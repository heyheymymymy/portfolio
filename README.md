# 作品集

極簡白底、不規則瀑布流排版。純 HTML/CSS/JS，不需要任何建置工具。

## 本機預覽

```bash
cd 作品集
python3 -m http.server 8000
```

然後打開 http://localhost:8000

（一定要用伺服器開，不能直接雙擊 index.html——因為作品資料是用 `fetch` 讀 `js/works.json`，`file://` 協定會擋掉這個請求。）

## 換上真實作品

### 方法一：用管理介面（推薦，只有 Chrome / Edge 支援）

1. 啟動本機伺服器（見上）
2. 瀏覽器打開 http://localhost:8000/admin.html
3. 按「選擇『作品集』資料夾」，選這個專案資料夾本身（要看得到 index.html、images、js），授權讀寫
4. 把圖片拖進拖拉區，或點「點這裡選檔案」選圖片——圖片會自動複製進 `images/` 資料夾
5. 拖動卡片可以調整順序，點文字框可以改標題，點 × 可以移除（只是不顯示在網站上，不會刪除圖片檔案）
6. 按「儲存到網站」，會直接把結果寫回 `js/works.json`
7. 回到網站分頁重新整理，就會看到最新結果

admin.html 只給你自己用，不會出現在公開網站的任何連結裡，訪客找不到它。

### 方法二：手動編輯（適合 Safari / Firefox，或不想授權資料夾存取）

1. 把圖片檔案丟進 `images/` 資料夾
2. 打開 `js/works.json`，加一筆或修改一筆：
   ```json
   { "title": "海報設計 — 咖啡品牌", "img": "images/poster-01.jpg" }
   ```
3. 存檔重新整理頁面即可，版面會自動依照圖片真實比例排列
4. 還沒放真圖的佔位項目維持 `"img": ""` 加一個 `"ratio"`（高寬比，例如 1.3 代表比較高的直式），沒有 img 的時候才會用到這個欄位

### 影片

`img` 欄位指到 `.mp4` / `.webm` / `.mov` / `.m4v` 檔案，會自動判斷成影片，不用額外標記。網格上自動靜音循環播放，點開燈箱換成有控制列、可以開聲音的完整播放器。admin.html 上傳／拖拉時也接受影片檔。

### 大張顯示

作品項目加一個 `"feature": true`，網格上會跨兩欄顯示，變成比較搶眼的錨點——也可以在 admin.html 每張卡片下面直接勾選「大張顯示」。

## 修改基本資訊

打開 `index.html`：
- `.header-contact-line` / `.header-contact-email` 改成你的聯絡文字與 email
- `.header-handle` 改成你的帳號／署名

## 部署上線（免費）

推薦用 [Vercel](https://vercel.com) 或 [GitHub Pages]：
- Vercel：把這個資料夾丟進一個 GitHub repo，到 vercel.com 用 "Import Project" 選那個 repo，其他全部預設值即可，幾分鐘後會拿到一個網址
- GitHub Pages：repo 設定裡開啟 Pages，指到根目錄即可

部署上線前記得：**不要把 `admin.html` 和 `js/admin.js` 也部署上去**（或至少不要在任何地方連結它），它是本機管理工具，不是給訪客看的頁面。單純不連結它其實也夠安全，但如果要更保險，部署時可以直接不上傳這兩個檔案。

## 之後想加的功能（目前先不做，保持速成）

- 分類篩選按鈕
- 關於我／履歷頁面
- 更豐富的轉場動畫
