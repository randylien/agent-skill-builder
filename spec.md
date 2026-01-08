# Agent Skill Builder - Technical Specification

## Executive Summary

Agent Skill Builder is a cross-platform skill deployment tool that supports one-click deployment of AI Agent Skills to various AI editors and CLI tools such as Claude Code, OpenAI Codex, and Cursor.

## Research Findings

### 1. Claude Code Skills Configuration

**Directory Structure:**
- Personal skills: `~/.claude/skills/`
- Project skills: `.claude/skills/`
- Plugin skills: `plugins/skills/`

**SKILL.md Format Specification:**

```yaml
---
name: skill-name                    # Required, max 64 chars, lowercase letters, numbers, hyphens
description: Brief description      # Required, max 1024 chars
allowed-tools: Read, Grep, Glob    # Optional, restrict available tools
model: claude-sonnet-4-20250514    # Optional, specify model
skills: []                         # Optional, only for subagent
---

# Skill Instructions

[Markdown formatted instruction content]
```

**Skill Priority (when names duplicate):**
1. Enterprise (highest priority)
2. Personal
3. Project
4. Plugin (lowest priority)

**Sources:**
- [Agent Skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

---

### 2. OpenAI Codex Skills Configuration

**Directory Structure:**
- Global config: `~/.codex/`
- Skills directory: `~/.codex/skills/`
- Project skills: `.codex/skills/`
- Global instructions: `~/.codex/AGENTS.md`
- Config file: `~/.codex/config.toml`

**SKILL.md Format Specification:**

```yaml
---
name: <skill-name>              # Required, max 100 chars, single line
description: <description>      # Required, max 500 chars, single line
---

<instructions, references, or examples>
```

**Validation Rules:**
- Reject multiline `name` or `description`
- Reject fields exceeding character limits
- Reject invalid YAML syntax
- Reject missing required fields

**Behavioral Characteristics:**
- Codex only injects skill name, description, and file path into runtime context
- Instruction content is not injected unless explicitly invoked (Progressive disclosure)
- Codex ignores extra fields in frontmatter

**Sources:**
- [Custom skills - OpenAI Codex](https://developers.openai.com/codex/skills/create-skill/)
- [Skills in OpenAI Codex](https://blog.fsck.com/2025/12/19/codex-skills/)
- [Configuring Codex](https://developers.openai.com/codex/local-config/)

---

### 3. Cursor AI Configuration

**Configuration Method:**
- Primarily uses `.cursorrules` file (non-standard SKILL.md)
- Location: Project root directory

**Format Characteristics:**
- Markdown-like format
- Uses rule sections
- Different from Claude Code/Codex YAML frontmatter format

**.cursorrules Example:**

```markdown
## Rule: Code Quality
- Always respect and follow **linting rules**.
- Do not introduce new linting errors.
- Format code according to the existing linting and Prettier settings.

## Rule: Formatting
- DO NOT add or remove empty lines unnecessarily.
- DO NOT change existing spacing or indentation unless required by linting rules.
- Avoid any cosmetic-only changes unless explicitly requested.

## Rule: Clarity
- Comment new logic briefly if it's not self-explanatory.
- Keep function names and variable names descriptive and readable.
```

**Features:**
- Does not support standard SKILL.md format
- Focuses on rule definition rather than skill encapsulation
- Teams can define shared rules via Cursor dashboard

**Sources:**
- [Cursor AI Complete Guide 2025](https://blogs.magnusminds.net/Blog/cursor-ai-complete-guide-2025)
- [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)

---

## Compatibility Analysis

### Common Features

| Feature | Claude Code | OpenAI Codex | Cursor |
|---------|-------------|--------------|--------|
| SKILL.md Support | ✅ Yes | ✅ Yes | ❌ No |
| YAML Frontmatter | ✅ Yes | ✅ Yes | ❌ No |
| Markdown Instructions | ✅ Yes | ✅ Yes | ✅ Yes |
| Personal Skills Directory | `~/.claude/skills/` | `~/.codex/skills/` | N/A |
| Project Skills Directory | `.claude/skills/` | `.codex/skills/` | `.cursorrules` |

### YAML Field Compatibility

| Field | Claude Code | OpenAI Codex | Compatibility |
|-------|-------------|--------------|---------------|
| `name` | Required, 64 chars | Required, 100 chars | ✅ Compatible (use 64 char limit) |
| `description` | Required, 1024 chars | Required, 500 chars | ✅ Compatible (use 500 char limit) |
| `allowed-tools` | Optional | Not supported | ⚠️ Partially compatible (Codex ignores) |
| `model` | Optional | Not supported | ⚠️ Partially compatible (Codex ignores) |
| `skills` | Optional | Not supported | ⚠️ Partially compatible (Codex ignores) |

---

## Architecture Design

### Core Principles

1. **Lowest Common Denominator Principle**
   - Use SKILL.md format supported by both Claude Code and Codex as standard
   - Provide converter for Cursor (SKILL.md → .cursorrules)

2. **Lightweight Design**
   - Single executable file
   - Zero or minimal dependencies
   - Cross-platform support (Linux, macOS, Windows)

3. **Backward Compatibility**
   - Use strictest limits (name: 64 chars, description: 500 chars)
   - Codex ignores unrecognized fields without error

### Standardized SKILL.md Format

```yaml
---
name: skill-name              # Max 64 chars (compatible with both)
description: Brief desc       # Max 500 chars (compatible with both)
# Following fields only supported by Claude Code, automatically ignored by Codex
allowed-tools: Read, Grep    # Optional
model: claude-sonnet-4       # Optional
---

# Skill Instructions

[Markdown content]
```

---

## Implementation Plan

### Target Deployment Paths

```
Input:
  source-skill/
    ├── SKILL.md
    └── supporting-files/

Deploy to:
  1. ~/.claude/skills/skill-name/     (Claude Code)
  2. ~/.codex/skills/skill-name/      (OpenAI Codex)
  3. ./.cursorrules                    (Cursor - format conversion)
```

### Core Function Modules

#### 1. Skill Validator
- Validate SKILL.md format
- Check YAML frontmatter required fields
- Validate character limits (name: 64, description: 500)
- Check YAML syntax correctness

#### 2. Skill Deployer
- Copy skills to target directory
- Handle file permissions
- Avoid overwriting existing skills (provide option)
- Support batch deployment

#### 3. Format Converter
- SKILL.md → .cursorrules converter
- Extract description as comment
- Convert Markdown instructions to Cursor rule format

#### 4. CLI Interface
```bash
# Deploy to single target
skill-builder deploy <skill-dir> --target claude
skill-builder deploy <skill-dir> --target codex
skill-builder deploy <skill-dir> --target cursor

# Deploy to all platforms
skill-builder deploy <skill-dir> --all

# Validate skill format
skill-builder validate <skill-dir>

# List deployed skills
skill-builder list --target claude
skill-builder list --all
```

---

## Technical Stack

### Language Choice: Node.js / Deno / Bun

**Recommendation: Deno**

Advantages:
- ✅ Single executable compilation (`deno compile`)
- ✅ Built-in TypeScript support
- ✅ Zero configuration, no node_modules needed
- ✅ Cross-platform support (Windows, macOS, Linux)
- ✅ Excellent standard library (file operations, YAML parsing)
- ✅ Secure by default (requires explicit file system access authorization)

Alternative Options:
- **Bun**: Also supports single executable compilation, but ecosystem is newer
- **Node.js**: Requires bundling tools (pkg, nexe), more complex
- **Go**: Excellent cross-platform compilation, but less friendly for text processing than JS
- **Python**: Packaging into executable is complex (PyInstaller)

### Core Dependencies

```typescript
// Deno standard library (no installation needed)
import { parse as parseYaml } from "https://deno.land/std/yaml/mod.ts";
import { copy } from "https://deno.land/std/fs/mod.ts";
import { parse as parseArgs } from "https://deno.land/std/flags/mod.ts";
```

---

## File Structure

```
agent-skill-builder/
├── src/
│   ├── main.ts              # CLI entry point
│   ├── validator.ts         # SKILL.md validator
│   ├── deployer.ts          # Deployment logic
│   ├── converter.ts         # Format converter
│   └── utils.ts             # Utility functions
├── tests/
│   ├── fixtures/            # Test SKILL.md examples
│   └── *.test.ts            # Unit tests
├── README.md
├── spec.md                  # This document
└── deno.json                # Deno configuration
```

---

## Deployment Strategy

### Phase 1: MVP (Minimum Viable Product)
- ✅ Support SKILL.md validation
- ✅ Deploy to Claude Code (`~/.claude/skills/`)
- ✅ Deploy to OpenAI Codex (`~/.codex/skills/`)
- ✅ Basic CLI interface

### Phase 2: Cursor Support
- ✅ SKILL.md → .cursorrules converter
- ✅ Smart rule extraction (generate Cursor rules from Markdown instructions)

### Phase 3: Advanced Features
- ✅ Skill template generator
- ✅ Interactive deployment (select target platforms)
- ✅ Skill update detection
- ✅ Conflict resolution mechanism

---

## Testing Strategy

### Test Cases

1. **Validator Tests**
   - ✅ Valid SKILL.md passes validation
   - ✅ Throw error when missing required fields
   - ✅ Throw error when exceeding character limits
   - ✅ Throw error for invalid YAML syntax

2. **Deployer Tests**
   - ✅ Successfully copy files to target directory
   - ✅ Handle existing skills (overwrite/skip option)
   - ✅ Preserve file permissions
   - ✅ Support skills with subdirectories

3. **Converter Tests**
   - ✅ Correctly convert SKILL.md to .cursorrules
   - ✅ Preserve Markdown formatting
   - ✅ Handle complex instruction structures

---

## Security Considerations

1. **File System Permissions**
   - Only write to known safe directories (`~/.claude/`, `~/.codex/`)
   - Validate symbolic links, prevent path traversal attacks

2. **YAML Injection Protection**
   - Use secure YAML parser
   - Validate input, reject maliciously crafted YAML

3. **Overwrite Protection**
   - Do not overwrite existing skills by default
   - Provide `--force` flag for explicit overwrite

---

## Success Metrics

- ✅ Single command deploys skill to multiple platforms
- ✅ Compiled executable < 10MB
- ✅ Execution speed < 1 second (typical skill)
- ✅ 100% test coverage (core functionality)
- ✅ Cross-platform support (Windows, macOS, Linux)

---

## Future Enhancements

1. **Skill Marketplace Integration**
   - Install skills from remote repositories (npm-like)
   - Publish personal skills to public marketplace

2. **Version Control**
   - Skill version management
   - Automatic update mechanism

3. **GUI Interface**
   - Simple graphical deployment tool
   - VSCode/Cursor extension

4. **More Platform Support**
   - GitHub Copilot
   - Windsurf
   - Other editors supporting Agent Skills

---

## References

### Claude Code
- [Agent Skills - Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Agent Skills - Claude Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [GitHub - anthropics/skills](https://github.com/anthropics/skills)

### OpenAI Codex
- [Custom skills - OpenAI Codex](https://developers.openai.com/codex/skills/create-skill/)
- [Skills in OpenAI Codex](https://blog.fsck.com/2025/12/19/codex-skills/)
- [Configuring Codex](https://developers.openai.com/codex/local-config/)
- [codex/docs/skills.md](https://github.com/openai/codex/blob/main/docs/skills.md)

### Cursor AI
- [Cursor AI Complete Guide 2025](https://blogs.magnusminds.net/Blog/cursor-ai-complete-guide-2025)
- [awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)
- [Cursor 2.0 Ultimate Guide 2025](https://skywork.ai/blog/vibecoding/cursor-2-0-ultimate-guide-2025-ai-code-editing/)
