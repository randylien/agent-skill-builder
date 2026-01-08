# Confluence 工具使用指南

這些工具可以讓您直接從命令列搜尋和查看 Confluence 文件。

## 🚀 快速開始

### 1. 設定環境變數

這些工具使用與 Jira 工具相同的認證設定:

```bash
cp .env.jira.example .env.jira
```

編輯 `.env.jira` 並填入您的 Atlassian 憑證:

```bash
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token-here
```

> 💡 Confluence 會自動使用 `{JIRA_URL}/wiki` 作為 Confluence URL

### 2. 取得 API Token

1. 前往 https://id.atlassian.com/manage-profile/security/api-tokens
2. 點擊「Create API token」
3. 複製生成的 token 並貼到 `.env.jira` 中

## 📚 工具說明

### search-confluence.js - 搜尋 Confluence 文件

搜尋 Confluence 中的頁面和部落格文章。

#### 基本使用

```bash
# 搜尋關鍵字
node search-confluence.js "Multi-account"

# 搜尋多個關鍵字
node search-confluence.js "帳戶復原 流程"
```

#### 進階選項

```bash
# 限制結果數量
node search-confluence.js --limit 50 "R2D2"

# 搜尋特定類型
node search-confluence.js --type page "設計文件"
node search-confluence.js --type blogpost "更新"
node search-confluence.js --type all "Multi-account"

# 限定特定空間 (Space Key)
node search-confluence.js --space PROJ "API"

# 組合使用
node search-confluence.js --limit 10 --type page --space PROJ "Multi-account"
```

#### 輸出範例

```
🔍 正在搜尋 Confluence: "Multi-account"...

📄 找到 3 個相關文件:

────────────────────────────────────────────────────────────────────────────────

1. R2D2-16181 - Multi-Account 帳戶復原流程 PRD
   類型: 頁面
   空間: Product Documentation (PROD)
   最後更新: 2025-12-29 上午10:30:00
   更新者: Randy Lien
   摘要: 改善多鏈多帳戶的復原體驗，確保用戶能夠安全且快速地復原所有帳戶...
   連結: https://yourcompany.atlassian.net/wiki/spaces/PROD/pages/123456789
   頁面 ID: 123456789

2. Multi-Account Architecture Design
   類型: 頁面
   空間: Engineering (ENG)
   最後更新: 2025-12-28 下午3:15:00
   更新者: John Doe
   摘要: Technical architecture for multi-account support...
   連結: https://yourcompany.atlassian.net/wiki/spaces/ENG/pages/987654321
   頁面 ID: 987654321

────────────────────────────────────────────────────────────────────────────────

總計: 2 個文件
```

### get-confluence-page.js - 取得頁面詳細內容

根據頁面 ID 取得完整的頁面內容、評論和子頁面。

#### 基本使用

```bash
# 取得單一頁面
node get-confluence-page.js 123456789

# 取得多個頁面
node get-confluence-page.js 123456789 987654321
```

#### 輸出範例

```
🔍 正在獲取 1 個頁面的詳細資訊...

════════════════════════════════════════════════════════════════════════════════
  R2D2-16181 - Multi-Account 帳戶復原流程 PRD
════════════════════════════════════════════════════════════════════════════════

📌 基本資訊
   類型: 頁面
   空間: Product Documentation (PROD)
   頁面 ID: 123456789
   版本: 5

👤 作者資訊
   建立者: Randy Lien
   最後更新: 2025-12-29 上午10:30:00
   更新訊息: Updated security considerations

📂 頁面階層
   Product > Multi-Account Features > R2D2-16181 - Multi-Account 帳戶復原流程 PRD

📝 內容
────────────────────────────────────────────────────────────────────────────────
# PRD: Multi-Account 帳戶復原流程

## 1. Executive Summary

改善多鏈多帳戶的復原體驗...
────────────────────────────────────────────────────────────────────────────────

📄 子頁面 (3)
   1. Security Considerations
   2. UX Mockups
   3. Technical Implementation

💬 評論 (2)

   John Doe - 2025-12-29 上午9:00:00
   Great work! One question about the seed phrase validation...

   Jane Smith - 2025-12-29 上午9:30:00
   We should also consider hardware wallet recovery...

🔗 連結: https://yourcompany.atlassian.net/wiki/spaces/PROD/pages/123456789
════════════════════════════════════════════════════════════════════════════════
```

## 🔍 常見使用案例

### 1. 搜尋專案相關文件

```bash
# 搜尋 R2D2-16181 相關的所有文件
node search-confluence.js "R2D2-16181"

# 搜尋 Multi-account 功能文件
node search-confluence.js --type all "Multi-account"
```

### 2. 查看特定文件的完整內容

```bash
# 先搜尋找到頁面 ID
node search-confluence.js "帳戶復原"

# 使用頁面 ID 查看完整內容
node get-confluence-page.js 123456789
```

### 3. 在特定空間中搜尋

```bash
# 只在產品文件空間搜尋
node search-confluence.js --space PROD "PRD"

# 只在工程文件空間搜尋
node search-confluence.js --space ENG "architecture"
```

### 4. 搜尋最近更新的文件

```bash
# 搜尋結果預設按更新時間排序
node search-confluence.js --limit 10 "設計"
```

## 🛠️ 技術細節

### Confluence API

- 使用 Confluence REST API v2
- 支援 CQL (Confluence Query Language)
- 自動處理 HTML 轉純文字

### 認證

- 使用 Basic Auth with API Token
- 與 Jira 工具共用相同憑證
- 安全性: Token 儲存在本地 `.env.jira` 檔案

### URL 結構

- Confluence URL: `{JIRA_URL}/wiki`
- 搜尋端點: `/rest/api/content/search`
- 頁面詳情: `/rest/api/content/{pageId}`

## ⚠️ 故障排除

### 錯誤: "Could not read .env.jira file"

請確保您已經建立 `.env.jira` 檔案:

```bash
cp .env.jira.example .env.jira
```

### 錯誤: "HTTP 401"

API Token 或 Email 不正確,請檢查:
1. Email 是否正確
2. API Token 是否有效
3. API Token 是否有 Confluence 存取權限

### 錯誤: "HTTP 404"

Confluence URL 不正確,請確認:
1. JIRA_URL 設定正確
2. Confluence 是否位於 `{JIRA_URL}/wiki`
3. 如果 Confluence 在其他 URL,需要修改工具中的 CONFLUENCE_URL

### 沒有搜尋結果

1. 確認關鍵字是否正確
2. 檢查是否有權限存取該空間
3. 嘗試使用不同的搜尋關鍵字
4. 使用 `--type all` 搜尋所有類型

## 📝 與 Jira 工具的關係

這些 Confluence 工具與現有的 Jira 工具互補:

| 工具 | 用途 |
|------|------|
| `get-jira-tickets.js` | 取得指派給您的 Jira tickets |
| `get-jira-ticket-details.js` | 取得特定 Jira ticket 詳情 |
| `search-confluence.js` | 搜尋 Confluence 文件 |
| `get-confluence-page.js` | 取得 Confluence 頁面詳情 |

所有工具共用相同的 `.env.jira` 配置檔案。

## 🔗 相關連結

- [Confluence REST API 文件](https://developer.atlassian.com/cloud/confluence/rest/v2/)
- [CQL 語法參考](https://developer.atlassian.com/cloud/confluence/cql/)
- [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
