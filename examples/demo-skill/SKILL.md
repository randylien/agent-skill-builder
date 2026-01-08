---
name: demo-skill
description: Example skill for testing Agent Skill Builder deployment across Claude Code, OpenAI Codex, and Cursor platforms
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Demo Skill

This is a demonstration skill for testing the Agent Skill Builder tool.

## Instructions

When activated, this skill helps you:

1. **Validate** - Check if skill format is correct
2. **Deploy** - Copy skill to target platforms
3. **Test** - Verify deployment was successful

## Usage Example

```bash
# Validate this skill
skill-builder validate ./demo-skill

# Deploy to Claude Code
skill-builder deploy ./demo-skill --target claude

# Deploy to all platforms
skill-builder deploy ./demo-skill --all
```

## Best Practices

- Always validate before deploying
- Use `--dry-run` to preview changes
- Check existing skills with `skill-builder list`

## Notes

This skill demonstrates progressive disclosure - additional details can be stored in separate files and referenced when needed.
