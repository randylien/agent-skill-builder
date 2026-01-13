# Rebuild Instructions

If you've updated the source code and the binary is outdated, follow these steps:

## Prerequisites

- [Deno](https://deno.land/) v2.0 or later

## Building the Binary

```bash
# Clean old build
rm -rf dist/

# Build new binary
deno task build

# The binary will be in ./dist/skill-builder
```

## Installing the Binary

```bash
# Move to PATH (Linux/macOS)
sudo mv ./dist/skill-builder /usr/local/bin/

# Or create a symlink
sudo ln -sf $(pwd)/dist/skill-builder /usr/local/bin/skill-builder

# Verify installation
skill-builder version
```

## Build Options

The build task compiles the TypeScript source into a standalone executable with the following permissions:

- `--allow-read` - Read skill files
- `--allow-write` - Deploy skills to target directories
- `--allow-env` - Read environment variables for path expansion
- `--allow-run` - Execute git commands for importing from GitHub
- `--allow-net` - Network access for cloning GitHub repositories

## Testing Before Build

```bash
# Run in development mode
deno task dev help

# Test a command
deno task dev validate ./skills/check-sensitive

# Test GitHub import (dry run)
deno task dev import owner/repo --dry-run
```

## Troubleshooting

### Binary is outdated

If the binary gives unexpected results after code changes:

```bash
# Check if source was modified after binary
ls -lt src/*.ts dist/skill-builder | head -5

# If source files are newer, rebuild
deno task build
```

### Permission denied

```bash
# Make binary executable
chmod +x ./dist/skill-builder

# Or rebuild (sets permissions automatically)
deno task build
```

### Import command fails

The import command requires git to be installed:

```bash
# Check git installation
git --version

# Install git if needed
# macOS: brew install git
# Ubuntu/Debian: sudo apt install git
# CentOS/RHEL: sudo yum install git
```
