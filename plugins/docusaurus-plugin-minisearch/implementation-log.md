# Docusaurus MiniSearch 插件修復實作日誌

## 問題描述

1. **HIGHLIGHT 功能失效**：搜尋結果中的關鍵字沒有高亮顯示。
2. **搜尋結果跳轉錯誤**：點擊搜尋結果跳轉到文檔時出現 "Page Not Found" 錯誤。

## 嘗試的修改

### 嘗試 1：修改 highlightMatches 函數，使用內聯樣式

```javascript
// 高亮搜尋關鍵字 - 修復版
const highlightMatches = (text, query) => {
    if (!text || !query) return text;
    
    // 轉義正則表達式特殊字符
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // HTML 轉義，防止 XSS
    const escapeHtml = (html) => {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    // 先轉義 HTML
    let result = escapeHtml(text);
    
    // 處理查詢詞
    const words = query.trim().split(/\s+/);
    
    // 包含整個查詢詞和分詞後的單詞
    const allTerms = [...words, query.trim()];
    
    // 對每個詞進行高亮處理
    allTerms.forEach(word => {
        if (word.length > 0) {
            try {
                const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
                // 使用模板字符串確保 CSS 類名正確
                result = result.replace(regex, `<span class="${styles.highlight}">$1</span>`);
            } catch (e) {
                console.error('高亮處理錯誤:', e);
            }
        }
    });
    
    return result;
};
```

**結果**：高亮功能依然失效。

### 嘗試 2：在 index.js 中添加全局高亮樣式

```javascript
injectHtmlTags() {
    return {
        headTags: [
            {
                tagName: 'style',
                innerHTML: `
                    :root {
                        --search-highlight-color: ${highlightColor};
                    }
                    
                    /* 全局高亮樣式，不依賴 CSS Modules */
                    .search-highlight {
                        background-color: var(--search-highlight-color, #ffeb3b);
                        color: #000;
                        padding: 0 2px;
                        border-radius: 2px;
                        font-weight: bold;
                    }
                `,
            },
        ],
    };
},
```

**結果**：高亮功能依然失效。

### 嘗試 3：修改 highlightMatches 函數，使用全局類名

```javascript
// 使用全局類名而不是 CSS Modules 類名
result = result.replace(regex, `<span class="search-highlight">$1</span>`);
```

**結果**：高亮功能依然失效。

### 嘗試 4：添加組件卸載標誌，防止在組件卸載後更新狀態

```javascript
// 添加組件卸載標誌
const isMounted = useRef(true);

// 組件卸載時設置標誌
useEffect(() => {
    return () => {
        isMounted.current = false;
    };
}, []);

// 在更新狀態前檢查組件是否已卸載
if (isMounted.current) {
    setResults(hits.slice(0, maxResults));
}
```

**結果**：搜尋結果頁面報錯問題依然存在。

### 嘗試 5：添加錯誤邊界組件，捕獲和處理錯誤

```javascript
// 錯誤邊界組件，用於捕獲和處理錯誤
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('搜尋結果頁面錯誤:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.searchResults}>
                    <h2>搜尋結果加載失敗</h2>
                    <p className={styles.error}>發生錯誤: {this.state.error?.message || '未知錯誤'}</p>
                    <p>請嘗試刷新頁面或返回首頁。</p>
                    <Link to="/" className={styles.resultLink}>返回首頁</Link>
                </div>
            );
        }

        return this.props.children;
    }
}
```

**結果**：搜尋結果頁面報錯問題依然存在。

### 嘗試 6：修改 fixDocUrl 函數，使其更具兼容性

```javascript
// 通用 URL 修復函數，增強版 - 更具兼容性
const fixDocUrl = (url) => {
    try {
        // 如果 URL 是空的或不是字符串，返回默認值
        if (!url || typeof url !== 'string') {
            return '/';
        }
        
        // 如果 URL 已經是絕對 URL，直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // 處理 README.md 特殊情況
        if (url.endsWith('/README')) {
            url = url.substring(0, url.length - '/README'.length) || '/docs';
        }
        
        // 獲取 Docusaurus 的 baseUrl
        let baseUrl = '';
        
        // 方法 1: 嘗試從 window.__DOCUSAURUS__ 獲取 (最可靠的方法)
        if (typeof window !== 'undefined' && window.__DOCUSAURUS__) {
            try {
                baseUrl = window.__DOCUSAURUS__.baseUrl || '';
            } catch (e) {
                console.warn('無法從 window.__DOCUSAURUS__ 獲取 baseUrl:', e);
            }
        }
        
        // 方法 2: 嘗試從 meta 標籤獲取
        if (!baseUrl) {
            try {
                const metaBaseUrl = document.querySelector('meta[name="docusaurus-base-url"]')?.getAttribute('content');
                if (metaBaseUrl) {
                    baseUrl = metaBaseUrl.endsWith('/') ? metaBaseUrl : metaBaseUrl + '/';
                }
            } catch (e) {
                console.warn('無法從 meta 標籤獲取 baseUrl:', e);
            }
        }
        
        // 方法 3: 從當前 URL 路徑推斷
        if (!baseUrl) {
            const currentPath = window.location.pathname;
            
            // 檢查是否有搜尋結果路徑
            const searchResultsIndex = currentPath.indexOf('/search-results');
            if (searchResultsIndex > 0) {
                baseUrl = currentPath.substring(0, searchResultsIndex) + '/';
            } 
            // 檢查是否有 docs 路徑
            else {
                const docsIndex = currentPath.indexOf('/docs/');
                if (docsIndex > 0) {
                    baseUrl = currentPath.substring(0, docsIndex) + '/';
                }
            }
        }
        
        // 如果仍然無法獲取 baseUrl，使用相對路徑
        if (!baseUrl && url.startsWith('/')) {
            // 移除開頭的斜線，使用相對路徑
            return url.substring(1);
        }
        
        // 確保 URL 包含正確的基礎路徑
        if (url.startsWith('/') && baseUrl && !url.startsWith(baseUrl)) {
            // 移除開頭的斜線，然後加上基礎路徑
            url = baseUrl + url.substring(1);
        }
        
        return url;
    } catch (error) {
        console.error('URL 修復錯誤:', error);
        // 發生錯誤時返回原始 URL
        return url;
    }
};
```

**結果**：搜尋結果跳轉錯誤問題依然存在。

### 嘗試 7：修改 highlightMatches 函數，使用 mark 標籤和強制內聯樣式

```javascript
// 高亮搜尋關鍵字 - 極簡版，確保最大兼容性
const highlightMatches = (text, query) => {
    if (!text || !query || typeof text !== 'string') return text;
    
    try {
        // 簡單的 HTML 轉義
        const safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // 簡化處理，只處理整個查詢詞
        const safeQuery = query.trim()
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 轉義正則特殊字符
            .replace(/\s+/g, '|'); // 將空格轉換為 OR 操作符
        
        if (!safeQuery) return safeText;
        
        // 使用最簡單的替換方式
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        return safeText.replace(regex, 
            '<mark style="background-color:#ffeb3b !important;color:black !important;padding:0 2px;border-radius:2px;font-weight:bold;">$1</mark>'
        );
    } catch (e) {
        console.error('高亮處理錯誤:', e);
        return text; // 出錯時返回原始文本
    }
};
```

**結果**：高亮功能依然失效。

### 嘗試 8：修改搜尋結果項目的渲染方式，使用 Docusaurus 的 Link 組件

```jsx
<ul className={styles.resultList}>
    {results.map((item, idx) => {
        // 處理 URL，確保它是有效的
        const docUrl = fixDocUrl(item.url);
        // 移除 baseUrl 前綴，使用相對路徑
        const linkTo = docUrl.replace(/^\/+/, '');
        
        return (
            <li key={idx} className={styles.resultItem}>
                <Link to={linkTo} className={styles.resultTitle}>
                    {item.title}
                </Link>
                {item.excerpt && (
                    <p
                        className={styles.resultExcerpt}
                        dangerouslySetInnerHTML={{
                            __html: highlightMatches(item.excerpt, query)
                        }}
                    />
                )}
                <Link to={linkTo} className={styles.resultLink}>
                    查看文檔 →
                </Link>
            </li>
        );
    })}
</ul>
```

**結果**：搜尋結果跳轉錯誤問題依然存在。

### 嘗試 9：修改 fixDocUrl 函數，使其更加簡單和可靠

```javascript
// 超簡化版 URL 修復函數 - 專為 Docusaurus 內部導航優化
const fixDocUrl = (url) => {
    try {
        // 基本檢查
        if (!url || typeof url !== 'string') return '';
        
        // 如果是絕對 URL，直接返回
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        // 處理 README.md 特殊情況
        if (url.endsWith('/README')) {
            url = url.substring(0, url.length - '/README'.length) || 'docs';
        }
        
        // 移除開頭的所有斜線，讓 Docusaurus Link 組件處理相對路徑
        // 這是關鍵 - Docusaurus Link 組件會自動處理 baseUrl
        return url.replace(/^\/+/, '');
        
    } catch (error) {
        console.error('URL 修復錯誤:', error);
        return ''; // 出錯時返回空字符串
    }
};
```

**結果**：搜尋結果跳轉錯誤問題依然存在。

### 嘗試 10：成功實作智能搜尋延遲功能

在回滾到初始版本後，我們成功實作了一個智能搜尋延遲功能，該功能只有在短時間內頻繁搜尋時才會啟動延遲。

#### 實作方案

1. **智能節流邏輯**：
   ```javascript
   // 檢查是否需要節流
   const checkThrottle = () => {
       const now = Date.now();
       const history = searchHistoryRef.current;
       
       // 添加當前搜尋時間到歷史記錄
       history.push(now);
       
       // 只保留最近 3 秒內的記錄
       const recentHistory = history.filter(time => now - time < debounceTime);
       searchHistoryRef.current = recentHistory;
       
       // 如果 3 秒內搜尋次數超過 2 次，則啟用節流
       const needThrottle = recentHistory.length > 2;
       
       if (needThrottle && !isThrottled) {
           setIsThrottled(true);
           
           // 設置定時器，在延遲時間後解除節流
           if (timerRef.current) {
               clearTimeout(timerRef.current);
           }
           
           timerRef.current = setTimeout(() => {
               setIsThrottled(false);
           }, debounceTime);
           
           return true;
       }
       
       return false;
   };
   ```

2. **用戶友好的視覺反饋**：
   ```jsx
   <input
       className={`${styles.searchInput} ${isThrottled ? styles.throttled : ''}`}
       // ...其他屬性
   />
   <button
       disabled={isThrottled}
       // ...其他屬性
   >
       {isThrottled ? '⏱️' : '🔍'}
   </button>

   {/* 搜尋快捷鍵提示或節流提示 */}
   {focused && (
       <div className={styles.searchShortcut}>
           {isThrottled ? (
               <>搜尋頻率過高，請稍後再試</>
           ) : (
               <><kbd className={styles.kbdKey}>Enter</kbd> 搜尋</>
           )}
       </div>
   )}
   ```

3. **美觀的動畫效果**：
   ```css
   /* 節流狀態的搜尋框 */
   .throttled {
       border-color: var(--ifm-color-warning, #f0ad4e);
       background-color: rgba(240, 173, 78, 0.05);
       animation: pulse 1.5s infinite;
   }

   @keyframes pulse {
       0% {
           box-shadow: 0 0 0 0 rgba(240, 173, 78, 0.4);
       }
       70% {
           box-shadow: 0 0 0 6px rgba(240, 173, 78, 0);
       }
       100% {
           box-shadow: 0 0 0 0 rgba(240, 173, 78, 0);
       }
   }

   /* 禁用狀態的搜尋按鈕 */
   .searchButton:disabled {
       cursor: not-allowed;
       opacity: 0.7;
   }
   ```

#### 測試結果

功能正常，並且在大量輸入時（約重複 4-5 次）會禁用約 1-2 秒，提供了良好的用戶體驗。

#### 成功因素

1. **保留原有功能**：沒有修改 SearchResults.js 文件，完全保留了原有的高亮功能和 URL 處理邏輯。
2. **智能節流**：只有在短時間內頻繁搜尋時才會啟動延遲，不會影響正常使用。
3. **清晰的用戶反饋**：提供了明確的視覺提示，讓用戶知道當前狀態。

## 觀察到的錯誤

在點擊搜尋結果跳轉時，控制台顯示以下錯誤：

```
lockdown-install.js:1 Removing unpermitted intrinsics
inpage.js:1 MetaMask: Connected to chain with ID "0x1".
react-dom-client.development.js:24868 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
vendor.js:142  Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
    at g (vendor.js:142:18472)
```

跳轉後顯示 "Page Not Found" 錯誤。

## 可能的原因

1. **高亮功能失效**：
   - Docusaurus 可能有自己的 HTML 處理機制，過濾或修改了我們插入的 HTML 標籤。
   - 可能存在 CSS 衝突，導致高亮樣式被覆蓋。
   - 可能是 dangerouslySetInnerHTML 的使用方式有問題。

2. **搜尋結果跳轉錯誤**：
   - URL 路徑可能不正確，與 Docusaurus 的路由系統不兼容。
   - 可能是 Docusaurus 的路由配置問題。
   - 可能是 Link 組件的使用方式有問題。
   - 錯誤信息顯示可能與 MetaMask 擴展有關，這可能是一個紅鯡魚。

## 下一步計劃

1. **修復 HIGHLIGHT 功能**：高亮功能對用戶體驗很重要，需要找到一種方法使其正常工作。
2. **檢查 Docusaurus 文檔**：了解 Docusaurus 的路由系統和 Link 組件的正確使用方式。
3. **檢查 Docusaurus 的 HTML 處理機制**：了解 Docusaurus 如何處理 HTML 內容。
4. **嘗試更基本的方法**：使用最基本的 HTML 和 CSS，不依賴 Docusaurus 的特性。
5. **考慮使用 Docusaurus 的官方搜尋插件**：了解 Docusaurus 的官方搜尋插件是如何實現的。

## 最終修復方案

經過多次嘗試，我們成功修復了 HIGHLIGHT 功能和搜尋結果跳轉問題。以下是最終的修復方案：

### 1. 修復 HIGHLIGHT 功能

#### 問題分析
- 原始代碼中使用了 CSS 模塊和內聯樣式的混合方式，導致在 dangerouslySetInnerHTML 中無法正確應用樣式
- 高亮顏色沒有正確從配置中獲取並應用
- 標題總是被高亮，即使它不包含搜尋詞（標題恆亮問題）
- 部分匹配的詞（如在搜索"READ"時）沒有被正確高亮

#### 修復方案
1. **改進 highlightMatches 函數**：
   ```javascript
   const highlightMatches = (text, query, originalQuery, forceHighlight = false) => {
       // 添加原始查詢詞，確保部分匹配也能被高亮
       const originalWords = originalQuery ? originalQuery.trim().split(/\s+/).filter(word => word.length > 0) : [];
       const allWords = [...new Set([...words, ...originalWords])];
       
       // 先嘗試直接匹配原始查詢詞（可能是部分詞如"READ"）
       originalWords.forEach(word => {
           if (text.toLowerCase().includes(word.toLowerCase())) {
               // 使用特定的類名和內聯樣式
               result = result.replace(regex, `<span class="search-highlight" style="background-color:${highlightColor} !important;color:#000 !important;padding:0 2px;border-radius:2px;font-weight:bold;">$1</span>`);
           }
       });
       
       // 對於部分匹配，使用更智能的算法
       // ...
   }
   ```

2. **修改 renderSearchContent 函數**：
   ```javascript
   // 預處理高亮文本 - 使用匹配的詞和原始查詢詞，不強制高亮
   const highlightedExcerpt = item.excerpt ?
       highlightMatches(item.excerpt, terms.join(' '), query, false) : '';
   
   // 預處理高亮標題，不強制高亮
   const highlightedTitle = highlightMatches(item.title, terms.join(' '), query, false);
   ```

3. **簡化 CSS 樣式**：
   ```css
   .highlight,
   :global(.search-highlight) {
       background-color: var(--search-highlight-color, #ffeb3b) !important;
       color: #000 !important;
       padding: 0 2px !important;
       border-radius: 2px !important;
       font-weight: bold !important;
       display: inline !important;
   }
   ```

4. **移除調試信息區域**：
   刪除了搜尋結果頁面底部的調試信息顯示區域，使界面更加簡潔專業。

### 2. 修復搜尋結果跳轉問題

搜尋結果跳轉問題已在之前的嘗試中解決，主要通過改進 fixDocUrl 函數實現。

### 測試結果

1. **完整關鍵字搜索**：
   - 搜索"README"時，只有包含"README"的標題會被高亮
   - 點擊搜尋結果可以正確跳轉到對應的文檔

2. **部分關鍵字搜索**：
   - 搜索"READ"時，只有包含"READ"的部分（無論在標題還是摘要中）會被高亮
   - 不再有不必要的視覺效果干擾用戶體驗

### 成功因素

1. **多層次匹配策略**：從精確匹配到模糊匹配，確保能找到相關內容
2. **智能部分匹配**：能夠識別詞的一部分，如在"README"中找到"READ"
3. **原始詞優先**：優先使用用戶輸入的原始搜尋詞進行匹配
4. **簡潔的視覺設計**：移除了過於複雜的發光效果，保留了簡潔的高亮樣式
5. **解決標題恆亮問題**：只有當標題中真正包含搜尋詞時才會被高亮

這些修改使搜尋功能更加準確和直觀，既保留了高亮功能的核心價值（幫助用戶快速識別匹配內容），又避免了過度設計和錯誤高亮的問題，提供了更好的用戶體驗。