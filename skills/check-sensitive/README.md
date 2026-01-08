# Sensitive Information Check Tool

Automatically check for sensitive information like API keys, personal data, company emails before git commit.

## Quick Start

### 1. Setup Check Rules

```bash
# Copy example file to project root
cp skills/check-sensitive/REFERENCE.md.example REFERENCE.md

# Edit rules according to needs
vim REFERENCE.md
```

### 2. Scan Git Staged Files

```bash
# Execute after git add, before git commit
node skills/check-sensitive/scripts/scan-staged.js
```

### 3. Scan Specific Files

```bash
node skills/check-sensitive/scripts/scan-file.js src/config.ts .env.local
```

## Set as Git Pre-commit Hook (Recommended)

Automatically run check before each commit:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
node skills/check-sensitive/scripts/scan-staged.js
if [ $? -ne 0 ]; then
  echo "❌ Commit rejected: Sensitive information found"
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

## Test Rules

### Display Statistics

```bash
node skills/check-sensitive/scripts/test-patterns.js stats
```

### Run Built-in Tests

```bash
node skills/check-sensitive/scripts/test-patterns.js test
```

### Interactive Testing

```bash
node skills/check-sensitive/scripts/test-patterns.js interactive
```

## Handling False Positives

### Method 1: Inline Comment

```javascript
const API_ENDPOINT = "https://api.example.com"; // @sensitive-ignore
```

### Method 2: Exclude Files

Create `.sensitiveignore` file:

```
# Test files
**/*.test.ts
**/test-fixtures/**

# Encrypted files
**/*.encrypted
```

### Method 3: Adjust Rules

Edit `REFERENCE.md` to adjust or remove rules that cause false positives.

## Complete Documentation

See [SKILL.md](./SKILL.md) for complete documentation and advanced usage.

## FAQ

**Q: Why aren't my rules taking effect?**

A: Run `node skills/check-sensitive/scripts/test-patterns.js stats` to verify rules are correctly loaded.

**Q: How to add custom rules?**

A: Edit `REFERENCE.md`, add rules under the `## Custom Rules` section in this format:

````markdown
### My Custom Rule

```regex
CUSTOM-PATTERN-\d{4}
```
````

**Q: What if the tool runs slowly?**

A: Use `.sensitiveignore` to exclude large files or directories that don't need checking (like `node_modules/`, `dist/`, etc.).
