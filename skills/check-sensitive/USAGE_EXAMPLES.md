# 使用範例

## 情境 1: 初次設定

```bash
# 1. 複製規則範本
cp skills/check-sensitive/REFERENCE.md.example REFERENCE.md

# 2. 根據公司需求編輯規則
vim REFERENCE.md
# 修改 @yourcompany.com 為你的公司域名
# 新增專案特定的敏感模式

# 3. 測試規則是否正確載入
node skills/check-sensitive/scripts/test-patterns.js stats

# 4. 執行內建測試確認規則運作
node skills/check-sensitive/scripts/test-patterns.js test
```

## 情境 2: 日常開發流程

```bash
# 正常開發流程
vim src/config.ts        # 修改程式碼
git add src/config.ts    # 加入 staged

# 在 commit 前檢查
node skills/check-sensitive/scripts/scan-staged.js

# 如果通過檢查，才進行 commit
git commit -m "Update config"
```

## 情境 3: 檢查特定檔案

```bash
# 檢查單一檔案
node skills/check-sensitive/scripts/scan-file.js .env.local

# 檢查多個檔案
node skills/check-sensitive/scripts/scan-file.js \
  src/config.ts \
  src/api/client.ts \
  .env.production

# 詳細模式 (顯示匹配的 pattern)
node skills/check-sensitive/scripts/scan-file.js src/secrets.ts
```

## 情境 4: 處理誤報

### 方式 1: 使用 @sensitive-ignore

```typescript
// src/config.ts
export const CONFIG = {
  // 這是公開的 API endpoint，不是敏感資訊
  apiUrl: "https://internal.company.com/api", // @sensitive-ignore
  
  // 實際的 API key 應該從環境變數讀取
  apiKey: process.env.API_KEY,
};
```

### 方式 2: 建立 .sensitiveignore

```bash
# 複製範例
cp skills/check-sensitive/.sensitiveignore.example .sensitiveignore

# 編輯以排除誤報的檔案
cat >> .sensitiveignore << EOF
# 我們的測試資料
tests/fixtures/**
EOF
```

### 方式 3: 調整 REFERENCE.md 規則

```bash
# 編輯 REFERENCE.md
vim REFERENCE.md

# 讓規則更精確，例如:
# 原本: @\w+\.com
# 調整為: @(specificdomain|anotherdomain)\.com
```

## 情境 5: 設定自動化 Hook

### Git Pre-commit Hook

```bash
# 建立 hook
cat > .git/hooks/pre-commit << 'HOOK_EOF'
#!/bin/bash

echo "🔒 Checking for sensitive information..."
node skills/check-sensitive/scripts/scan-staged.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit blocked by sensitive information check"
  echo "Please review and fix the issues above"
  exit 1
fi

echo "✅ Security check passed"
HOOK_EOF

chmod +x .git/hooks/pre-commit

# 測試 hook
git add .
git commit -m "Test commit"  # 會自動觸發檢查
```

### CI/CD 整合 (GitHub Actions)

```yaml
# .github/workflows/security-check.yml
name: Security Check

on: [push, pull_request]

jobs:
  check-sensitive-info:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Copy REFERENCE.md
        run: cp skills/check-sensitive/REFERENCE.md.example REFERENCE.md
      
      - name: Check for sensitive information
        run: |
          # 檢查所有變更的檔案
          git diff --name-only origin/main... | while read file; do
            if [ -f "$file" ]; then
              node skills/check-sensitive/scripts/scan-file.js "$file"
            fi
          done
```

## 情境 6: 團隊協作

### 共享規則配置

```bash
# 將 REFERENCE.md 加入版本控制 (移除敏感範例)
# 建立專案特定的規則
cat > REFERENCE.md << 'EOF'
## 專案特定規則

### 我們的 API Keys
```regex
PROJ_[A-Z0-9]{32}
```

### 內部系統
```regex
https?://internal\.ourcompany\.com
```
EOF

git add REFERENCE.md
git commit -m "Add security check rules"

# 團隊成員 clone 後即可使用
```

### 建立專案文件

```markdown
# 專案 README.md

## 安全性檢查

本專案使用敏感資訊檢查工具來防止機密資料外洩。

在 commit 前，請執行:
\`\`\`bash
node skills/check-sensitive/scripts/scan-staged.js
\`\`\`

或設定自動化 hook:
\`\`\`bash
./scripts/setup-git-hooks.sh
\`\`\`

如遇到誤報，請參考: skills/check-sensitive/USAGE_EXAMPLES.md
```

## 情境 7: 規則開發與測試

### 互動式測試新規則

```bash
# 啟動互動式測試
node skills/check-sensitive/scripts/test-patterns.js interactive

# 輸入測試字串
Test string: PROJ_ABC123XYZ456DEF789GHI012JKL

# 查看哪些規則匹配
# 如果沒有匹配，則新增規則到 REFERENCE.md
```

### 驗證規則效果

```bash
# 1. 新增規則到 REFERENCE.md
cat >> REFERENCE.md << 'EOF'
### Project API Keys
```regex
PROJ_[A-Z0-9]{24}
```
EOF

# 2. 驗證規則已載入
node skills/check-sensitive/scripts/test-patterns.js stats | grep "Project API Keys"

# 3. 建立測試檔案
echo 'const key = "PROJ_ABC123XYZ456DEF789GH";' > /tmp/test.js

# 4. 測試檢測
node skills/check-sensitive/scripts/scan-file.js /tmp/test.js

# 5. 如果成功檢測，規則就生效了！
```

## 情境 8: 緊急處理已提交的敏感資訊

如果不小心已經 commit 了敏感資訊:

```bash
# ⚠️ 警告: 這些操作會改寫 Git 歷史

# 選項 1: 修改最近一次 commit (尚未 push)
git reset HEAD~1
# 移除敏感資訊
vim src/config.ts
# 重新 commit
git add src/config.ts
node skills/check-sensitive/scripts/scan-staged.js
git commit -m "Update config (removed sensitive info)"

# 選項 2: 已經 push 到遠端
# 使用 BFG Repo-Cleaner 清理歷史
# https://rtyley.github.io/bfg-repo-cleaner/

# 選項 3: 撤銷整個 commit
git revert <commit-hash>
```

## 進階技巧

### 自訂錯誤訊息

修改 `scripts/scanner.js` 的 `formatResults` 函數來客製化輸出。

### 整合其他工具

```bash
# 與 pre-commit framework 整合
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: check-sensitive
        name: Check sensitive information
        entry: node skills/check-sensitive/scripts/scan-staged.js
        language: system
        pass_filenames: false
```

### 效能優化

```bash
# 建立 .sensitiveignore 排除大型目錄
echo "node_modules/**" >> .sensitiveignore
echo "dist/**" >> .sensitiveignore
echo "*.min.js" >> .sensitiveignore
```
