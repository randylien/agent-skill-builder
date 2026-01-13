# Build Instructions

## Issue: Outdated Binary

The `dist/skill-builder` binary is outdated and missing the `batch-deploy` command.

**Binary compiled:** 2026-01-08
**batch-deploy added:** 2026-01-12
**Status:** Binary needs rebuild

## Quick Fix

### Option 1: Use the rebuild script (Recommended)

```bash
./rebuild.sh
```

### Option 2: Manual build

```bash
# Ensure Deno is installed
deno --version

# Build the binary
deno task build

# Verify it works
./dist/skill-builder --help
```

You should now see `batch-deploy <dir>` in the commands list.

### Option 3: Run directly with Deno (without compiling)

```bash
# Instead of: ./dist/skill-builder batch-deploy ...
# Run:
deno run --allow-read --allow-write --allow-env src/main.ts batch-deploy ./skills --all
```

## Verifying the Fix

After rebuilding, verify that `batch-deploy` appears in the help output:

```bash
./dist/skill-builder --help
```

Expected output should include:
```
COMMANDS:
  deploy <dir>       Deploy skill to target platforms
  batch-deploy <dir> Deploy all skills in a directory  👈 This should appear
  validate <dir>     Validate SKILL.md format
  ...
```

## Installing Deno

If you don't have Deno installed:

```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Or use Homebrew (macOS)
brew install deno

# Or visit: https://deno.land/#installation
```

## Automated Builds

Consider setting up a GitHub Action to automatically rebuild the binary on every push:

1. Create `.github/workflows/build.yml`
2. Add a build step that compiles and commits the binary
3. Or use releases with pre-built binaries for different platforms

## Your Command Should Work After Rebuild

```bash
# Your original command (with typo fixed):
./dist/skill-builder batch-deploy ./skills --all --project-path ~/Projects/hot-ai-config
```

**Note:** You typed `batch-depoly` (missing an 'e'), the correct command is `batch-deploy`.
