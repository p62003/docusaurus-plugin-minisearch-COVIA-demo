import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';
import MiniSearch from 'minisearch';
import Layout from '@theme/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

/**
 * 搜尋結果頁面組件 - 修復路由問題
 */
export default function SearchResults() {
    // 從全局數據獲取搜尋配置
    const { searchConfig } = usePluginData('docusaurus-plugin-minisearch') || {};

    const { search } = useLocation();
    const query = new URLSearchParams(search).get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 使用默認配置或從全局數據獲取配置
    const {
        indexPath = '/search-index.json',
        searchFields = ['title', 'content'],
        resultFields = ['title', 'url', 'excerpt'],
        maxResults = 10
    } = searchConfig || {};

    // 高亮搜尋關鍵字
    const highlightMatches = (text, query) => {
        if (!text || !query) return text;
        const words = query.trim().split(/\s+/).filter(word => word.length > 1);
        if (words.length === 0) return text;

        let result = text;
        words.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            result = result.replace(regex, '<span class="' + styles.highlight + '">$1</span>');
        });
        return result;
    };

    // 通用 URL 修復函數，增強版
    const fixDocUrl = (url) => {
        // 獲取當前環境的基礎路徑
        const getBasePath = () => {
            // 嘗試從 Docusaurus meta 標籤獲取
            const metaBaseUrl = document.querySelector('meta[name="docusaurus-base-url"]')?.getAttribute('content');
            if (metaBaseUrl) {
                return metaBaseUrl.endsWith('/') ? metaBaseUrl : metaBaseUrl + '/';
            }

            // 檢查當前 URL 路徑
            const currentPath = window.location.pathname;

            // 檢查是否在本地開發環境
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // 檢查本地環境是否有特定路徑前綴
                const matches = currentPath.match(/^(\/[^\/]+)\//);
                if (matches && matches[1] !== '/search-results') {
                    console.log('本地環境檢測到路徑前綴:', matches[1]);
                    return matches[1] + '/';
                }
            }

            // 檢查是否包含 docusaurus-plugin-minisearch-COVIA-demo
            if (currentPath.includes('/docusaurus-plugin-minisearch-COVIA-demo/')) {
                return '/docusaurus-plugin-minisearch-COVIA-demo/';
            }

            // 嘗試從搜尋結果頁面 URL 獲取
            const searchResultsIndex = currentPath.indexOf('/search-results');
            if (searchResultsIndex > 0) {
                return currentPath.substring(0, searchResultsIndex) + '/';
            }

            // 嘗試從文檔鏈接推斷
            const docsMatch = document.querySelector('a[href*="/docs/"]');
            if (docsMatch) {
                const href = docsMatch.getAttribute('href');
                const docsIndex = href.indexOf('/docs/');
                if (docsIndex > 0) {
                    return href.substring(0, docsIndex) + '/';
                }
            }

            // 默認返回根路徑
            return '/';
        };

        const basePath = getBasePath();
        console.log('檢測到的基礎路徑:', basePath, '原始 URL:', url);

        // 處理 README.md 特殊情況
        if (url.endsWith('/README')) {
            url = url.substring(0, url.length - '/README'.length) || '/docs';
        }

        // 確保 URL 包含正確的基礎路徑
        if (url.startsWith('/') && !url.startsWith(basePath)) {
            // 移除開頭的斜線，然後加上基礎路徑
            url = basePath + url.substring(1);
            console.log('修正後的 URL:', url);
        }

        return url;
    };
    useEffect(() => {
        async function searchDocs() {
            if (!query) return;
            setLoading(true);
            setError(null);
            try {
                console.log('開始執行搜尋...');

                // 嘗試多種索引路徑
                const possiblePaths = [
                    // 原始路徑
                    indexPath,
                    // 相對路徑
                    './search-index.json',
                    // 絕對路徑
                    '/search-index.json',
                    // 基於當前站點的路徑
                    window.location.pathname.split('/search-results')[0] + '/search-index.json',
                    // Docusaurus 文檔特定路徑
                    '/docusaurus-plugin-minisearch-COVIA-demo/search-index.json'
                ];

                // 去除重複路徑
                const uniquePaths = [...new Set(possiblePaths)];
                console.log('將嘗試以下路徑:', uniquePaths);

                let success = false;
                let lastError = null;

                // 依次嘗試所有可能的路徑
                for (const path of uniquePaths) {
                    try {
                        console.log(`嘗試路徑: ${path}`);
                        const res = await fetch(path);

                        if (!res.ok) {
                            console.log(`路徑 ${path} 返回狀態: ${res.status}`);
                            continue; // 嘗試下一個路徑
                        }

                        const text = await res.text();

                        // 確認是 JSON 而不是 HTML
                        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                            console.log(`路徑 ${path} 返回 HTML 而非 JSON`);
                            continue;
                        }

                        console.log(`成功從 ${path} 獲取索引內容`);

                        const miniSearch = MiniSearch.loadJSON(text, {
                            fields: searchFields,
                            storeFields: resultFields,
                        });

                        console.log(`使用關鍵詞 "${query}" 執行搜尋`);
                        const hits = miniSearch.search(query, {
                            prefix: true,
                            boost: { title: 2 },
                            fuzzy: 0.2
                        });

                        console.log(`找到 ${hits.length} 個結果`);
                        setResults(hits.slice(0, maxResults));
                        success = true;
                        break; // 成功獲取索引，跳出循環

                    } catch (err) {
                        console.warn(`路徑 ${path} 獲取失敗:`, err);
                        lastError = err;
                    }
                }

                if (!success) {
                    console.error('所有路徑都失敗');
                    throw lastError || new Error('無法載入搜尋索引');
                }
            } catch (err) {
                console.error('搜尋出錯:', err);
                setError('無法載入搜尋索引。請確保 search-index.json 文件已正確生成並放置在適當位置。');
            } finally {
                setLoading(false);
            }
        }

        searchDocs();
    }, [query, indexPath, searchFields, resultFields, maxResults]);

    // 渲染搜尋結果內容
    const renderSearchContent = () => {
        if (loading) {
            return (
                <div className={styles.searchResults}>
                    <h2>搜尋中...</h2>
                    <div className={styles.loader}></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.searchResults}>
                    <h2>搜尋錯誤</h2>
                    <p className={styles.error}>{error}</p>
                    <div className={styles.debugInfo}>
                        <h3>調試信息</h3>
                        <p>如果您是網站管理員，請檢查：</p>
                        <ol>
                            <li>static/search-index.json 檔案是否存在</li>
                            <li>檔案是否為有效的 JSON 格式</li>
                            <li>打開瀏覽器開發者工具，切換到網路標籤，嘗試搜尋並查看網路請求</li>
                        </ol>
                    </div>
                </div>
            );
        }

        if (!query) {
            return (
                <div className={styles.searchResults}>
                    <h2>文檔搜尋</h2>
                    <p>請在上方搜尋框輸入關鍵字。</p>
                </div>
            );
        }

        if (results.length === 0) {
            return (
                <div className={styles.searchResults}>
                    <h2>搜尋結果: {query}</h2>
                    <p>沒有找到符合 "{query}" 的內容。</p>
                    <ul className={styles.suggestions}>
                        <li>請確認拼寫是否正確</li>
                        <li>嘗試使用不同的關鍵字</li>
                        <li>嘗試使用更一般的詞彙</li>
                    </ul>
                </div>
            );
        }

        return (
            <div className={styles.searchResults}>
                <h2>搜尋結果: {query}</h2>
                <p className={styles.resultCount}>共找到 {results.length} 個結果</p>
                <ul className={styles.resultList}>
                    {results.map((item, idx) => (
                        <li key={idx} className={styles.resultItem}>
                            <a href={fixDocUrl(item.url)} className={styles.resultTitle}>
                                {item.title}
                            </a>
                            {item.excerpt && (
                                <p
                                    className={styles.resultExcerpt}
                                    dangerouslySetInnerHTML={{
                                        __html: highlightMatches(item.excerpt, query)
                                    }}
                                />
                            )}
                            <a href={fixDocUrl(item.url)} className={styles.resultLink}>
                                查看文檔 →
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // 使用 Docusaurus Layout 包裹內容
    return (
        <Layout
            title={query ? `搜尋結果: ${query}` : '搜尋'}
            description="文檔搜尋結果"
        >
            <main className="container margin-vert--lg">
                {renderSearchContent()}
            </main>
        </Layout>
    );
}