---
name: check-sensitive
description: Check files to be committed for sensitive information (API keys, PII, company emails, etc.). Use this skill before git commit to prevent leaking confidential data.
allowed-tools:
  - Read
  - Bash
  - Grep
---

# Sensitive Information Check Tool

Automatically scan staged files before git commit to detect sensitive information and prevent committing confidential data to version control systems.

## Prerequisites

Ensure `REFERENCE.md` file is configured to define sensitive information patterns to check:

```bash
# Create REFERENCE.md in project root or same level as .git
touch REFERENCE.md
```

Refer to `skills/check-sensitive/REFERENCE.md.example` to configure your sensitive information rules.

## Available Tools

### 1. Quick Scan Staged Files

Scan all git staged files:

```bash
node skills/check-sensitive/scripts/scan-staged.js
```

Use case: Final check before executing `git commit`.

**Output Example:**
```
✓ Check completed
✗ Found 2 files containing sensitive information:
  - src/config.ts:12 - Possible API Key
  - .env.local:5 - Company email
```

---

### 2. Scan Specific Files

Check specified files:

```bash
node skills/check-sensitive/scripts/scan-file.js <file-path> [<file-path> ...]
```

Example:
```bash
node skills/check-sensitive/scripts/scan-file.js src/config.ts .env.local
```

Use case: Focus check on specific configuration or code files.

---

### 3. Update Check Rules

Edit `REFERENCE.md` to add or modify sensitive information check patterns:

```bash
# Use your preferred editor
vim REFERENCE.md
# or
code REFERENCE.md
```

## Check Rule Examples

`REFERENCE.md` supports three main types of sensitive information:

### API Keys / Tokens
- API keys from services like AWS, GCP, Stripe
- OAuth tokens, JWT tokens
- Private key files (.pem, .key)

### Personally Identifiable Information (PII)
- National ID numbers (Taiwan, China)
- Credit card numbers
- Phone numbers (specific formats)

### Company/Organization Information
- Company email domains
- Internal system URLs
- Project code names

## Suggested Workflow

```bash
# 1. Normal git workflow
git add .

# 2. Run sensitive information check
node skills/check-sensitive/scripts/scan-staged.js

# 3. If check passes, proceed with commit
git commit -m "Add new feature"
```

## Advanced Usage

### Set as Git Pre-commit Hook

Automatically run check before each commit:

```bash
# Create pre-commit hook
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

### Ignore Specific Files

Create `.sensitiveignore` file in project root:

```
# Ignore test files
**/*.test.ts
**/test-fixtures/**

# Ignore encrypted files
**/*.encrypted
```

## Handling False Positives

If some content is misidentified as sensitive information:

1. **Use Comment Marker**: Add `@sensitive-ignore` to the line
   ```typescript
   const API_ENDPOINT = "https://api.example.com"; // @sensitive-ignore
   ```

2. **Update REFERENCE.md**: Adjust check rule precision

3. **Use .sensitiveignore**: Exclude specific files or directories

## Important Notes

- This tool **will not** modify any files, only report found issues
- Regularly update `REFERENCE.md` to reflect latest security requirements
- For already committed history, use `git filter-branch` or BFG Repo-Cleaner to clean up

## Troubleshooting

### Tool Execution Fails

```bash
# Check Node.js version
node --version  # Recommended >= 16

# Confirm in git repository
git status
```

### Rules Not Working

```bash
# Check REFERENCE.md format
cat REFERENCE.md

# Verify regular expressions
node skills/check-sensitive/scripts/test-patterns.js
```

## Related Resources

- [Git Hooks Documentation](https://git-scm.com/docs/githooks)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
