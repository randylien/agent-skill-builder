# Agent Skill Builder

[English](README.md) | 繁體中文

> 跨平台 AI 編輯器技能部署工具

使用單一指令將 AI Agent 技能部署到 **Claude Code**、**OpenAI Codex** 和 **Cursor**。

## 功能特色

- **通用格式** - 使用標準 SKILL.md 格式編寫一次技能
- **多平台支援** - 部署到 Claude Code、OpenAI Codex 和 Cursor
- **智慧轉換** - 自動轉換為平台專屬格式
- **輕量級** - 單一執行檔，零依賴
- **跨平台** - 支援 macOS、Linux 和 Windows
- **安全部署** - 部署前驗證，防止意外覆寫

## 安裝

### 選項 1：下載預先編譯的執行檔（建議）

```bash
# 下載最新版本（即將推出）
curl -fsSL https://github.com/randylien/agent-skill-builder/releases/latest/download/skill-builder -o skill-builder
chmod +x skill-builder
mv skill-builder /usr/local/bin/
```

### 選項 2：從原始碼建置

**前置需求：**[Deno](https://deno.land/) 執行環境

```bash
# 複製專案
git clone https://github.com/randylien/agent-skill-builder.git
cd agent-skill-builder

# 建置執行檔
deno task build

# 執行檔會在 ./dist/skill-builder
# 將它移到你的 PATH
mv ./dist/skill-builder /usr/local/bin/
```

### 選項 3：使用 Deno 執行

```bash
deno run --allow-read --allow-write --allow-env src/main.ts <command>
```

## 快速開始

### 1. 建立技能

建立一個包含 `SKILL.md` 檔案的目錄：

```
my-skill/
└── SKILL.md
```

**SKILL.md** 格式：

```yaml
---
name: my-skill
description: 此技能功能的簡短描述
allowed-tools:
  - Read
  - Grep
  - Glob
---

# My Skill

使用此技能的說明...
```

### 2. 驗證你的技能

```bash
skill-builder validate ./my-skill
```

### 3. 部署到平台

```bash
# 部署到 Claude Code
skill-builder deploy ./my-skill --target claude

# 部署到 OpenAI Codex
skill-builder deploy ./my-skill --target codex

# 部署到 Cursor（轉換為 .cursorrules）
skill-builder deploy ./my-skill --target cursor

# 一次部署到所有平台
skill-builder deploy ./my-skill --all

# 批次部署目錄中的所有技能
skill-builder batch-deploy ./skills --target claude

# 批次部署到所有平台並強制覆寫
skill-builder batch-deploy ./skills --all --force
```

## 使用說明

### 指令

#### `validate <dir>`

在部署前驗證技能目錄。

```bash
skill-builder validate ./my-skill
```

檢查項目：
- SKILL.md 是否存在
- YAML frontmatter 是否有效
- 必要欄位（`name`、`description`）
- 字元限制（name：64、description：500）
- 格式限制（小寫、無換行等）

#### `deploy <dir>`

部署技能到目標平台。

```bash
# 單一目標
skill-builder deploy ./my-skill --target claude

# 所有平台
skill-builder deploy ./my-skill --all

# 模擬執行（預覽而不寫入）
skill-builder deploy ./my-skill --all --dry-run

# 強制覆寫現有技能
skill-builder deploy ./my-skill --all --force
```

**選項：**
- `--target <t>` - 目標平台：`claude`、`codex` 或 `cursor`
- `--all` - 部署到所有平台
- `--force` - 覆寫現有技能
- `--dry-run` - 模擬部署而不寫入檔案

**部署路徑：**
- **Claude Code：** `~/.claude/skills/skill-name/`
- **OpenAI Codex：** `~/.codex/skills/skill-name/`
- **Cursor：** `./.cursorrules`（僅專案層級）

#### `batch-deploy <dir>`

一次部署目錄中的所有技能。

```bash
# 將所有技能部署到 Claude Code
skill-builder batch-deploy ./skills --target claude

# 將所有技能部署到所有平台
skill-builder batch-deploy ./skills --all

# 模擬執行（預覽而不寫入）
skill-builder batch-deploy ./skills --all --dry-run

# 強制覆寫現有技能
skill-builder batch-deploy ./skills --all --force
```

**選項：**
- `--target <t>` - 目標平台：`claude`、`codex` 或 `cursor`
- `--all` - 部署到所有平台
- `--force` - 覆寫現有技能
- `--dry-run` - 模擬部署而不寫入檔案

**輸出範例：**
```
Discovering skills in: ./skills

Found 4 skill(s):

  - check-sensitive
  - humanize-text
  - manage-jira-confluence
  - skill-reviewer

Deploying to: claude

──────────────────────────────────────────────────

[check-sensitive]
  ✓ claude: /home/user/.claude/skills/check-sensitive

[humanize-text]
  ✓ claude: /home/user/.claude/skills/humanize-text

[manage-jira-confluence]
  ✓ claude: /home/user/.claude/skills/manage-jira-confluence

[skill-reviewer]
  ✓ claude: /home/user/.claude/skills/skill-reviewer

──────────────────────────────────────────────────

Summary: 4 succeeded, 0 failed
```

#### `list`

列出已部署的技能。

```bash
# 列出 Claude Code 技能
skill-builder list --target claude

# 列出所有已部署的技能
skill-builder list --all
```

**注意：**Cursor 每個專案使用單一 `.cursorrules` 檔案，因此不支援列表功能。

#### `remove <name>`

移除已部署的技能。

```bash
skill-builder remove my-skill --target claude
```

**選項：**
- `--target <t>` - 必要。要移除的平台：`claude`、`codex` 或 `cursor`

## SKILL.md 格式規範

### 必要欄位

```yaml
---
name: skill-name              # 最多 64 字元，僅小寫字母/數字/連字號
description: 簡短描述           # 最多 500 字元，單行
---
```

### 選用欄位（僅 Claude Code）

```yaml
---
name: my-skill
description: 我的技能描述
allowed-tools:                # 限制為特定工具
  - Read
  - Grep
  - Glob
model: claude-sonnet-4        # 指定使用的模型
skills:                       # 僅用於子代理
  - other-skill
---
```

**注意：**
- OpenAI Codex 會忽略未知欄位（向後相容）
- 使用最嚴格的限制以確保跨平台相容性
- 名稱應與目錄名稱相符（建議）

### 技能範例

```yaml
---
name: pdf-processor
description: 從 PDF 檔案中提取文字和表格。處理 PDF 或文件提取時使用。
allowed-tools:
  - Read
  - Bash
---

# PDF 處理器

## 說明

此技能協助你處理 PDF 檔案：

1. 從 PDF 提取文字
2. 解析表格和表單
3. 合併多個 PDF

## 使用方式

\```bash
python scripts/extract.py input.pdf
\```

詳細 API 請參閱 [REFERENCE.md](REFERENCE.md)。
```

## 平台差異

| 功能 | Claude Code | OpenAI Codex | Cursor |
|---------|-------------|--------------|--------|
| 格式 | SKILL.md | SKILL.md | .cursorrules |
| YAML Frontmatter | ✅ 是 | ✅ 是 | ❌ 否（已轉換） |
| `allowed-tools` | ✅ 支援 | ⚠️ 忽略 | ⚠️ N/A |
| `model` | ✅ 支援 | ⚠️ 忽略 | ⚠️ N/A |
| 使用者技能 | `~/.claude/skills/` | `~/.codex/skills/` | N/A |
| 專案技能 | `.claude/skills/` | `.codex/skills/` | `.cursorrules` |
| 多個技能 | ✅ 是 | ✅ 是 | ❌ 單一檔案 |

### Cursor 轉換

Agent Skill Builder 會自動將 SKILL.md 轉換為 Cursor 的 `.cursorrules` 格式：

**輸入（SKILL.md）：**
```yaml
---
name: my-skill
description: 執行某些有用的功能
---

# 說明
- 執行這個
- 執行那個
```

**輸出（.cursorrules）：**
```markdown
# my-skill

## Description
執行某些有用的功能

## Rule: Skill Instructions

# 說明
- 執行這個
- 執行那個
```

## 架構

### 為什麼選擇 Deno？

- ✅ **單一執行檔** - 編譯為獨立執行檔，零依賴
- ✅ **原生 TypeScript** - 無需建置配置
- ✅ **預設安全** - 明確的檔案系統存取權限
- ✅ **跨平台** - 支援 Windows、macOS、Linux（ARM 和 x64）
- ✅ **現代化工具** - 內建格式化器、檢查器、測試執行器

### 專案結構

```
agent-skill-builder/
├── src/
│   ├── main.ts           # CLI 進入點
│   ├── types.ts          # 型別定義
│   ├── validator.ts      # SKILL.md 驗證
│   ├── deployer.ts       # 部署邏輯
│   ├── converter.ts      # 格式轉換
│   └── utils.ts          # 工具函式
├── examples/
│   └── demo-skill/       # 範例技能
├── dist/
│   └── skill-builder     # 編譯的執行檔
├── spec.md               # 技術規格
├── deno.json             # Deno 配置
└── README.md
```

## 開發

### 前置需求

- [Deno](https://deno.land/) v2.0 或更新版本

### 指令

```bash
# 在開發模式下執行
deno task dev validate examples/demo-skill

# 執行測試
deno task test

# 建置執行檔
deno task build

# 格式化程式碼
deno fmt

# 檢查程式碼
deno lint
```

### 執行測試

```bash
deno test --allow-read --allow-write
```

## 藍圖

### 階段 1：MVP ✅
- [x] SKILL.md 驗證
- [x] 部署到 Claude Code
- [x] 部署到 OpenAI Codex
- [x] 部署到 Cursor（含轉換）
- [x] 單一執行檔編譯

### 階段 2：增強功能
- [ ] 技能範本（腳手架）
- [ ] 互動式部署（選擇目標）
- [ ] 技能更新偵測
- [ ] 衝突解決
- [ ] 遠端技能安裝（從 git URL）

### 階段 3：擴展平台支援
- [ ] GitHub Copilot 支援
- [ ] Windsurf 支援
- [ ] VSCode 擴充功能
- [ ] 網頁版技能管理器

## 貢獻

歡迎貢獻！請隨時提交 Pull Request。

### 貢獻指南

1. 遵循現有的程式碼風格（使用 `deno fmt`）
2. 為新功能添加測試
3. 更新相關文件
4. 提交前確保所有測試通過

## 授權

MIT License - 詳見 [LICENSE](LICENSE)

## 致謝

- [Anthropic](https://anthropic.com) - Claude Code 和 Agent Skills 概念
- [OpenAI](https://openai.com) - Codex CLI 和技能格式
- [Cursor](https://cursor.com) - AI 驅動的程式碼編輯器

## 資源

### 文件

- [Claude Code Agent Skills](https://code.claude.com/docs/en/skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/create-skill/)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

### 相關專案

- [anthropics/skills](https://github.com/anthropics/skills) - 官方 Claude 技能儲存庫
- [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) - Cursor 規則集合

## 支援

- **問題回報：**[GitHub Issues](https://github.com/randylien/agent-skill-builder/issues)
- **討論區：**[GitHub Discussions](https://github.com/randylien/agent-skill-builder/discussions)

---

使用 [Deno](https://deno.land/) 用❤️建造
