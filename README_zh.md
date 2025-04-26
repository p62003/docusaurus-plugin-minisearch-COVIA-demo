# Covia Docusaurus MiniSearch Plugin

Covia MiniSearch Plugin 是一個為 Docusaurus 小型至中型知識庫網站設計的輕量型本地搜尋解決方案。  
它主打快速部署、簡單整合，特別適合不具備專業開發背景的使用者。  
此插件完全於前端運行，無需額外的後端伺服器支持，適合個人、團隊與中小型專案使用。

> 📢 **重要說明**  
> 本插件設計目標為**中小型、主要以英文內容為主**的網站。  
> 本插件**不適用於**以下情境：
> - 超大型文件資料庫
> - 多語言網站
> - 需要**中文（繁體或簡體）斷詞優化**的場景  
> 
> ⚠️ 由於底層 MiniSearch 的斷詞機制限制，**本插件無法正確支援中文搜尋**。建議僅使用於英文或其他以空格分隔單詞的語言。  
> 
> 若有大型、多語言或中文搜尋優化等進階需求，建議改用如 `@easyops-cn/docusaurus-search-local` 等其他解決方案。



**🌟 Live Demo / 線上展示**
- 您可以在此查看本插件的線上示範網站：  
- 🔗 [https://p62003.github.io/docusaurus-plugin-minisearch-COVIA-demo/docs/](https://p62003.github.io/docusaurus-plugin-minisearch-COVIA-demo/docs/)


**🌟 Plugin Repository**
- 如果您想查看插件原始碼，請前往：  
- 🔗 [covia-docusaurus-minisearch-plugin](https://github.com/p62003/covia-docusaurus-minisearch-plugin)


**🌐 Available Languages:**
- [English (Default)](README.md)
- [繁體中文 (Traditional Chinese)](README_zh.md)



## 檔案結構

```
my-website/
│
├── plugins/
│   │
│   └── docusaurus-plugin-minisearch/
│       │
│       ├── index.js
│       ├── indexGenerator.js
│       ├── SearchBar.js
│       ├── SearchResults.js
│       ├── styles.module.css
│       ├── README.md
│       └── LICENSE
```

## 功能特點

* **即時搜尋**：提供高效、即時的前端搜尋體驗
* **關鍵字高亮**：使用多層次匹配策略，從精確匹配到模糊匹配
* **模糊搜尋**：支援拼寫錯誤和近似匹配（容許 20% 的編輯距離）
* **前綴搜尋**：支援輸入部分詞語進行匹配
* **字段加權**：對標題設置更高權重（2倍），提高相關性
* **無縫整合**：完美融入 Docusaurus 主題，支援明暗模式切換
* **完整布局**：搜尋結果頁面包含頁首和頁尾，保持網站一致性
* **自動索引**：在建置時自動生成搜尋索引，並複製到多個位置增強兼容性
* **智能搜尋延遲**：當 3 秒內搜尋次數超過 2 次時，自動啟用節流機制
* **多路徑兼容**：自動嘗試多個可能的索引路徑，確保在不同環境下正常工作
* **URL 智能修復**：自動檢測基礎路徑，修復搜尋結果鏈接

## 安裝方式

### 先決條件

* Docusaurus v3.0.0 或以上版本
* Node.js v16.0.0 或以上版本

### 步驟

**1. 在你的 Docusaurus 項目中安裝必要依賴及插件目錄：**

* 必須安裝的必要依賴：

| 套件 | 說明 | 安裝指令 |
|---|----|-------|
| minisearch | 前端全文搜尋引擎 | npm install minisearch |
| globby | 檔案路徑抓取工具 | npm install globby |
| gray-matter | 解析 .md / .mdx 前置 metadata | npm install gray-matter |

```
npm install minisearch globby gray-matter
```
* 創建插件目錄：
```bash
mkdir -p plugins/docusaurus-plugin-minisearch
```

**2. 複製插件檔案到該目錄：**

```bash
# 複製以下檔案到插件目錄
# - index.js
# - indexGenerator.js
# - SearchBar.js
# - SearchResults.js
# - styles.module.css
```

**3. 在 `docusaurus.config.js` 中添加插件配置：**

```js
// docusaurus.config.js
const config = {
  // 其他配置...
  plugins: [
    [
      './plugins/docusaurus-plugin-minisearch',
      {
        // 基本配置（必要）
        indexPath: '/search-index.json',  // 搜尋索引檔案路徑
        searchResultPath: '/search-results',  // 搜尋結果顯示頁面路徑
        searchFields: ['title', 'content'],  // 要搜尋的欄位
        resultFields: ['title', 'url', 'excerpt'],  // 要顯示的結果欄位
        
        // 可選配置
        maxResults: 10,  // 最大顯示結果數量
        highlightColor: '#ffeb3b',  // 搜尋關鍵字高亮顏色
        debounceTime: 3000  // 連續搜尋的最小間隔時間(毫秒)
      }
    ],
  ],
};
```

## 配置選項

下表列出了所有可用的配置選項，這些選項在 `index.js` 中定義：

| 選項 | 類型 | 默認值 | 必要性 | 說明 |
|------|------|--------|--------|------|
| indexPath | String | '/search-index.json' | 可選 | 搜尋索引檔案路徑 |
| searchResultPath | String | '/search-results' | 可選 | 搜尋結果顯示頁面路徑 |
| searchFields | Array | ['title', 'content'] | 可選 | 要搜尋的欄位 |
| resultFields | Array | ['title', 'url', 'excerpt'] | 可選 | 要顯示的結果欄位 |
| maxResults | Number | 10 | 可選 | 最大顯示結果數量 |
| highlightColor | String | '#ffeb3b' | 可選 | 搜尋關鍵字高亮顏色 |
| debounceTime | Number | 3000 | 可選 | 連續搜尋的最小間隔時間(毫秒) |

## 技術實現

### 插件架構

插件由以下核心組件構成：

1. **索引生成器 (indexGenerator.js)** - 從文檔檔案生成搜尋索引
2. **搜尋框組件 (SearchBar.js)** - 整合到 Docusaurus 導航欄，實現智能搜尋延遲功能
3. **搜尋結果頁面 (SearchResults.js)** - 顯示搜尋結果，實現多層次高亮和 URL 修復
4. **插件主文件 (index.js)** - 連接各組件，處理配置，注入全局樣式
5. **樣式文件 (styles.module.css)** - 定義搜尋框、搜尋結果、高亮關鍵字等樣式

### 使用的關鍵技術

* **MiniSearch** - 輕量級但功能強大的前端全文搜尋引擎
* **Docusaurus Theme API** - 集成到 Docusaurus 主題系統
* **React Hooks** - 管理搜尋狀態和索引載入
* **Docusaurus Plugin API** - 註冊路由和共享配置數據
* **CSS Modules** - 組件樣式隔離，避免樣式衝突

### 工作原理

1. **索引生成**
   * 在建置時遍歷所有文檔檔案
   * 提取標題、內容、URL 等信息
   * 生成 JSON 索引檔案存放在 `static` 目錄
   * 索引文件會被複製到多個位置，增強兼容性
   
2. **搜尋流程**
   * 用戶在導航欄搜尋框輸入關鍵字
   * 智能延遲功能檢測搜尋頻率，防止短時間內頻繁搜尋
   * 點擊搜尋按鈕後導航至搜尋結果頁面
   * 搜尋結果頁面嘗試從多個可能的路徑載入索引檔案
   * 使用 MiniSearch 在瀏覽器中進行搜尋，支援前綴匹配、模糊匹配和字段加權
   * 使用多層次匹配策略渲染搜尋結果並高亮關鍵字

3. **高亮功能實現**
   * 使用多層次匹配策略，按優先順序嘗試：
     1. 原始查詢詞匹配（如搜尋"READ"時）
     2. 完整詞匹配（分詞後的每個詞）
     3. 包含匹配（包含搜尋詞的單詞）
     4. 部分詞匹配（長度>=3的詞的子串）
   * 使用 CSS 和內聯樣式結合的方式確保高亮效果在各種環境下正常顯示

4. **URL 修復機制**
   * 自動檢測當前環境的基礎路徑，使用多種方法：
     1. 從 Docusaurus meta 標籤獲取
     2. 檢查當前 URL 路徑
     3. 檢查是否在本地開發環境
     4. 從搜尋結果頁面 URL 獲取
     5. 從文檔鏈接推斷
   * 確保搜尋結果鏈接在不同部署環境下正確工作

## 自定義

### 自定義搜尋結果樣式

修改 `styles.module.css` 檔案可自定義搜尋結果的外觀：

```css
/* 修改搜尋結果項目樣式 */
.resultItem {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border-radius: 8px;
  background-color: var(--ifm-card-background-color);
  box-shadow: var(--ifm-global-shadow-lw);
  transition: all 0.2s ease;
  border-left: 4px solid var(--ifm-color-primary);
}

/* 修改高亮關鍵字樣式 */
.highlight,
:global(.search-highlight) {
  background-color: var(--search-highlight-color, #ffeb3b) !important;
  color: #000 !important;
  padding: 0 2px !important;
  border-radius: 2px !important;
  font-weight: bold !important;
  display: inline !important;
}

/* 節流狀態的搜尋框 */
.throttled {
  border-color: var(--ifm-color-warning, #f0ad4e);
  background-color: rgba(240, 173, 78, 0.05);
  animation: pulse 1.5s infinite;
}
```

### 自定義搜尋選項

在 `SearchResults.js` 中修改搜尋選項：

```javascript
const hits = miniSearch.search(query, { 
  prefix: true,      // 前綴搜尋
  boost: { title: 2 }, // 標題權重為 2
  fuzzy: 0.2         // 模糊搜尋，容許 20% 的編輯距離
});
```

## 常見問題

**Q: 搜尋索引會增加網站大小嗎？**  
A: 會，但幅度有限。對於中小型文檔網站，索引通常在幾百KB範圍內。

**Q: 如何更新搜尋索引？**  
A: 每次重新建置網站時會自動更新索引。

**Q: 搜尋結果是否支援多語言？**  
A: 基本支援，但可能需要針對不同語言調整分詞設定。

**Q: 為什麼搜尋結果頁面顯示「頁面未找到」？**  
A: 這通常是由於路由衝突導致。確保 `searchResultPath` 設置為一個不與其他路由衝突的值。

**Q: 為什麼修改 indexPath 後，搜尋功能依然正常工作？**  
A: 插件設計了多重備份機制，會嘗試多個可能的索引路徑，確保即使配置有變化，功能也能正常運行。

**Q: 為什麼短時間內多次搜尋會被限制？**  
A: 插件實作了智能搜尋延遲功能，當 3 秒內搜尋次數超過 2 次時，會啟用節流機制，防止過度請求。

## 技術限制

* 純前端搜尋，不適用於極大型文檔庫
* 搜尋索引需要在建置時生成，無法包含動態內容
* 目前沒有內置的搜尋建議功能
* 對於中文等亞洲語言，沒有專門的分詞優化

## 文檔更新與索引維護

### 添加新文檔後更新搜尋索引

當你添加或修改文檔後，搜尋索引需要更新才能反映新內容。有以下幾種方式：

#### 方法一：完整重建站點

最直接的方法是重新構建整個網站：

```bash
npm run build
# 然後重新部署網站
```
#### 方法二：單獨更新索引文件（適用於 VPS/伺服器部署）

如果你只添加或修改了文檔內容，而不想重建整個網站，可以：

1. 在本地環境生成新的索引文件：
   ```bash
   npm start
   ```

2. 等待索引生成完成（通常會在控制台看到 `✅ search-index.json 已複製到 [路徑] 成功` 的訊息）

3. 將以下文件上傳到你的伺服器：
   - 新增的文檔文件
   - 位於 `static/search-index.json` 的新索引文件

4. 確保索引文件上傳到正確位置，通常是：
   - `/path-to-your-website/search-index.json`
   - 以及插件可能嘗試的其他路徑

這種方法特別適合文檔頻繁更新但網站結構穩定的情況，可以節省部署時間並減少資源消耗。

### 路徑與部署注意事項

在不同環境（本地開發、GitHub Pages、自託管 VPS 等）中，網站的基礎路徑可能不同：

- 本地開發：通常是 `http://localhost:3000/`
- GitHub Pages：通常是 `https://username.github.io/repo-name/`
- 自託管：可能是 `https://your-domain.com/` 或 `https://your-domain.com/docs/`

插件會嘗試自動檢測當前環境的基礎路徑，並嘗試多個可能的索引路徑，但如果遇到問題（例如搜尋結果鏈接錯誤），可以在 `docusaurus.config.js` 中明確設置 `baseUrl`：

```javascript
module.exports = {
  // ...
  baseUrl: '/your-base-path/',  // 例如 '/docs/' 或 '/'
  // ...
};
```

## 實作細節與注意事項

### 多路徑嘗試機制

插件會嘗試從多個可能的路徑加載索引文件：

```javascript
const possiblePaths = [
    // 原始路徑
    indexPath,
    // 相對路徑
    './search-index.json',
    // 絕對路徑
    '/search-index.json',
    // 基於當前站點的路徑
    window.location.pathname.split('/search-results')[0] + '/search-index.json'
];
```

這種設計確保即使配置有變化，搜索功能也能正常工作。

### 智能搜尋延遲功能

插件實作了智能搜尋延遲功能，只有在短時間內頻繁搜尋時才會啟動延遲：

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
    
    // ...
};
```

### MiniSearch 使用注意事項

使用 `MiniSearch.loadJSON` 時需直接傳入 JSON 字符串而非解析後的對象：

```javascript
// 錯誤方式
const rawIndex = JSON.parse(text);
const miniSearch = MiniSearch.loadJSON(rawIndex, options);

// 正確方式
const miniSearch = MiniSearch.loadJSON(text, options);
```

### 路由設置注意事項

避免搜尋結果路徑與 Docusaurus 默認路徑衝突：

```javascript
// 推薦使用專用路徑
searchResultPath = '/search-results'

// 確保精確匹配
addRoute({
  path: searchResultPath,
  component: '@theme/SearchResults',
  exact: true,
});
```

## 授權協議

本專案使用 MIT 授權協議。