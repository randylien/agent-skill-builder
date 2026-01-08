# Agent Skill Builder

> Cross-platform skill deployment tool for AI editors

Deploy AI Agent Skills to **Claude Code**, **OpenAI Codex**, and **Cursor** with a single command.

## Features

- **Universal Format** - Write skills once using standard SKILL.md format
- **Multi-Platform** - Deploy to Claude Code, OpenAI Codex, and Cursor
- **Smart Conversion** - Automatically converts to platform-specific formats
- **Lightweight** - Single executable with zero dependencies
- **Cross-Platform** - Works on macOS, Linux, and Windows
- **Safe Deployment** - Validates before deploying, prevents accidental overwrites

## Installation

### Option 1: Download Pre-built Binary (Recommended)

```bash
# Download the latest release (coming soon)
curl -fsSL https://github.com/randylien/agent-skill-builder/releases/latest/download/skill-builder -o skill-builder
chmod +x skill-builder
mv skill-builder /usr/local/bin/
```

### Option 2: Build from Source

**Prerequisites:** [Deno](https://deno.land/) runtime

```bash
# Clone the repository
git clone https://github.com/randylien/agent-skill-builder.git
cd agent-skill-builder

# Build the executable
deno task build

# The binary will be in ./dist/skill-builder
# Move it to your PATH
mv ./dist/skill-builder /usr/local/bin/
```

### Option 3: Run with Deno

```bash
deno run --allow-read --allow-write --allow-env src/main.ts <command>
```

## Quick Start

### 1. Create a Skill

Create a directory with a `SKILL.md` file:

```
my-skill/
└── SKILL.md
```

**SKILL.md** format:

```yaml
---
name: my-skill
description: Brief description of what this skill does
allowed-tools:
  - Read
  - Grep
  - Glob
---

# My Skill

Instructions for using this skill...
```

### 2. Validate Your Skill

```bash
skill-builder validate ./my-skill
```

### 3. Deploy to Platforms

```bash
# Deploy to Claude Code
skill-builder deploy ./my-skill --target claude

# Deploy to OpenAI Codex
skill-builder deploy ./my-skill --target codex

# Deploy to Cursor (converts to .cursorrules)
skill-builder deploy ./my-skill --target cursor

# Deploy to all platforms at once
skill-builder deploy ./my-skill --all
```

## Usage

### Commands

#### `validate <dir>`

Validate a skill directory before deployment.

```bash
skill-builder validate ./my-skill
```

Checks:
- SKILL.md exists
- Valid YAML frontmatter
- Required fields (`name`, `description`)
- Character limits (name: 64, description: 500)
- Format constraints (lowercase, no newlines, etc.)

#### `deploy <dir>`

Deploy a skill to target platforms.

```bash
# Single target
skill-builder deploy ./my-skill --target claude

# All platforms
skill-builder deploy ./my-skill --all

# Dry run (preview without writing)
skill-builder deploy ./my-skill --all --dry-run

# Force overwrite existing skills
skill-builder deploy ./my-skill --all --force
```

**Options:**
- `--target <t>` - Target platform: `claude`, `codex`, or `cursor`
- `--all` - Deploy to all platforms
- `--force` - Overwrite existing skills
- `--dry-run` - Simulate deployment without writing files

**Deployment Paths:**
- **Claude Code:** `~/.claude/skills/skill-name/`
- **OpenAI Codex:** `~/.codex/skills/skill-name/`
- **Cursor:** `./.cursorrules` (project-level only)

#### `list`

List deployed skills.

```bash
# List Claude Code skills
skill-builder list --target claude

# List all deployed skills
skill-builder list --all
```

**Note:** Cursor uses a single `.cursorrules` file per project, so it doesn't support listing.

#### `remove <name>`

Remove a deployed skill.

```bash
skill-builder remove my-skill --target claude
```

**Options:**
- `--target <t>` - Required. Platform to remove from: `claude`, `codex`, or `cursor`

## SKILL.md Format Specification

### Required Fields

```yaml
---
name: skill-name              # Max 64 chars, lowercase letters/numbers/hyphens only
description: Brief description # Max 500 chars, single line
---
```

### Optional Fields (Claude Code only)

```yaml
---
name: my-skill
description: My skill description
allowed-tools:                # Restrict to specific tools
  - Read
  - Grep
  - Glob
model: claude-sonnet-4        # Specify model to use
skills:                       # For subagents only
  - other-skill
---
```

**Notes:**
- OpenAI Codex ignores unknown fields (backward compatible)
- Use most restrictive limits for cross-platform compatibility
- Name must match directory name (recommended)

### Example Skill

```yaml
---
name: pdf-processor
description: Extract text and tables from PDF files. Use when working with PDFs or document extraction.
allowed-tools:
  - Read
  - Bash
---

# PDF Processor

## Instructions

This skill helps you process PDF files:

1. Extract text from PDFs
2. Parse tables and forms
3. Merge multiple PDFs

## Usage

\```bash
python scripts/extract.py input.pdf
\```

For detailed API, see [REFERENCE.md](REFERENCE.md).
```

## Platform Differences

| Feature | Claude Code | OpenAI Codex | Cursor |
|---------|-------------|--------------|--------|
| Format | SKILL.md | SKILL.md | .cursorrules |
| YAML Frontmatter | ✅ Yes | ✅ Yes | ❌ No (converted) |
| `allowed-tools` | ✅ Supported | ⚠️ Ignored | ⚠️ N/A |
| `model` | ✅ Supported | ⚠️ Ignored | ⚠️ N/A |
| User Skills | `~/.claude/skills/` | `~/.codex/skills/` | N/A |
| Project Skills | `.claude/skills/` | `.codex/skills/` | `.cursorrules` |
| Multiple Skills | ✅ Yes | ✅ Yes | ❌ Single file |

### Cursor Conversion

Agent Skill Builder automatically converts SKILL.md to Cursor's `.cursorrules` format:

**Input (SKILL.md):**
```yaml
---
name: my-skill
description: Does something useful
---

# Instructions
- Do this
- Do that
```

**Output (.cursorrules):**
```markdown
# my-skill

## Description
Does something useful

## Rule: Skill Instructions

# Instructions
- Do this
- Do that
```

## Architecture

### Why Deno?

- ✅ **Single Executable** - Compile to standalone binary with zero dependencies
- ✅ **TypeScript Native** - No build configuration needed
- ✅ **Secure by Default** - Explicit permissions for file system access
- ✅ **Cross-Platform** - Works on Windows, macOS, Linux (ARM and x64)
- ✅ **Modern Tooling** - Built-in formatter, linter, test runner

### Project Structure

```
agent-skill-builder/
├── src/
│   ├── main.ts           # CLI entry point
│   ├── types.ts          # Type definitions
│   ├── validator.ts      # SKILL.md validation
│   ├── deployer.ts       # Deployment logic
│   ├── converter.ts      # Format conversion
│   └── utils.ts          # Utility functions
├── examples/
│   └── demo-skill/       # Example skill
├── dist/
│   └── skill-builder     # Compiled binary
├── spec.md               # Technical specification
├── deno.json             # Deno configuration
└── README.md
```

## Development

### Prerequisites

- [Deno](https://deno.land/) v2.0 or later

### Commands

```bash
# Run in development mode
deno task dev validate examples/demo-skill

# Run tests
deno task test

# Build executable
deno task build

# Format code
deno fmt

# Lint code
deno lint
```

### Running Tests

```bash
deno test --allow-read --allow-write
```

## Roadmap

### Phase 1: MVP ✅
- [x] SKILL.md validation
- [x] Deploy to Claude Code
- [x] Deploy to OpenAI Codex
- [x] Deploy to Cursor (with conversion)
- [x] Single executable compilation

### Phase 2: Enhanced Features
- [ ] Skill templates (scaffolding)
- [ ] Interactive deployment (select targets)
- [ ] Skill update detection
- [ ] Conflict resolution
- [ ] Remote skill installation (from git URLs)

### Phase 3: Extended Platform Support
- [ ] GitHub Copilot support
- [ ] Windsurf support
- [ ] VSCode extension
- [ ] Web-based skill manager

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Guidelines

1. Follow the existing code style (use `deno fmt`)
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- [Anthropic](https://anthropic.com) - Claude Code and Agent Skills concept
- [OpenAI](https://openai.com) - Codex CLI and skills format
- [Cursor](https://cursor.com) - AI-powered code editor

## Resources

### Documentation

- [Claude Code Agent Skills](https://code.claude.com/docs/en/skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/create-skill/)
- [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)

### Related Projects

- [anthropics/skills](https://github.com/anthropics/skills) - Official Claude skills repository
- [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) - Cursor rules collection

## Support

- **Issues:** [GitHub Issues](https://github.com/randylien/agent-skill-builder/issues)
- **Discussions:** [GitHub Discussions](https://github.com/randylien/agent-skill-builder/discussions)

---

Built with ❤️ using [Deno](https://deno.land/)
