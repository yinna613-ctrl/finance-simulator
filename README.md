# Finance Simulator

繁體中文個人財務規劃與投資複利模擬器。

## 台股行情資料

- 後端代為讀取臺灣證券交易所公開 API：`https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_AVG_ALL`
- 不需要 API 金鑰。查詢上市台股代碼後，顯示 API 回傳的收盤價、月平均價與資料日期。
- API 提供的是已發布的收盤資料，不是盤中即時報價，也不包含五年歷史價格序列。
- 複利圖使用者可自行調整各標的的年化報酬假設；該假設不是由此 API 算出的歷史績效。
- 本機請在專案目錄執行 `npm install` 和 `npm start`，再開啟 `http://localhost:3000`；不要直接用 `file://` 開啟 HTML。
- 部署到 Vercel 時，前端與 `/api/twse/stocks` 後端可使用同一網域。
- 若前端部署在 GitHub Pages，請在 `index.html` 將 `TWSE_PROXY_BASE_URL` 設為 Vercel 專案網址，以呼叫後端代理。

收入、支出與投資配置儲存在使用者瀏覽器的 `localStorage`。
