# External Skill Linking

The Agent Skill Builder supports linking external skills from other platforms and locations to your Claude Code, Codex, or Cursor configurations. This feature allows you to manage skills across different sources while maintaining a consistent deployment structure.

## Overview

External skill linking allows you to:
- Reference skills from other platforms without copying them
- Link skills from local directories, Git repositories, or web URLs
- Maintain both user-level (global) and project-level (local) link configurations
- Sync linked skills on demand or all at once
- Enable/disable links without removing them

## Link Types

### Local Links
Reference skills from local filesystem paths.

```bash
skill-builder link add /path/to/my-skill --target claude --name my-skill
```

**Use cases:**
- Shared skills across multiple projects on the same machine
- Development and testing of skills before publishing
- Team-shared skills on a network drive

### Git Links
Reference skills from Git repositories (GitHub, GitLab, Bitbucket, etc.).

```bash
skill-builder link add https://github.com/user/repo --target claude \
  --name github-skill --path skills/awesome-skill --branch main
```

**Use cases:**
- External skill repositories
- Team or organization skill collections
- Version-controlled skills from public or private repositories

### Web Links
Reference skills from web URLs (planned feature, not yet implemented for sync).

```bash
skill-builder link add https://example.com/skills/my-skill --target claude --name web-skill
```

## Configuration Levels

### User-Level Links
Stored in `~/.claude/skill-links.json` (or `~/.codex/skill-links.json`, `~/.cursor/skill-links.json`)

**Characteristics:**
- Global to all projects for the current user
- Applies across all development work
- Use `--user` flag (default)

**Example:**
```bash
skill-builder link add ~/shared-skills/productivity --target claude --user
```

### Project-Level Links
Stored in `.claude/skill-links.json` (or `.codex/skill-links.json`, `.cursor/skill-links.json`)

**Characteristics:**
- Specific to the current project
- Can be committed to version control for team sharing
- Use `--project` flag

**Example:**
```bash
skill-builder link add ./team-skills/code-review --target claude --project
```

## Link Registry Format

The link registry is stored as a JSON file with the following structure:

```json
{
  "version": "1.0.0",
  "links": [
    {
      "name": "my-linked-skill",
      "type": "local",
      "source": "/path/to/skill",
      "enabled": true,
      "description": "Optional description"
    },
    {
      "name": "github-skill",
      "type": "git",
      "source": "https://github.com/user/repo",
      "path": "skills/my-skill",
      "branch": "main",
      "enabled": true
    }
  ]
}
```

## Commands

### Add a Link

```bash
skill-builder link add <source> --target <platform> [options]
```

**Options:**
- `--target <t>`: Target platform (claude, codex, cursor) - **required**
- `--user`: Use user-level configuration (default)
- `--project`: Use project-level configuration
- `--name <n>`: Link name (defaults to source basename)
- `--type <t>`: Link type (local, git, web) - auto-detected if not specified
- `--path <p>`: Subdirectory path within source (for git/web)
- `--branch <b>`: Git branch (for git links, default: main)
- `--description <d>`: Description of the linked skill
- `--force`: Overwrite existing link with same name

**Examples:**
```bash
# Add a local skill link
skill-builder link add /home/user/my-skills/productivity --target claude

# Add a git link with custom name
skill-builder link add https://github.com/awesome/skills --target codex \
  --name awesome-skills --path skills/code-review

# Add a project-level link
skill-builder link add ~/shared/team-skill --target claude --project
```

### List Links

```bash
skill-builder link list --target <platform> [--user|--project]
```

Shows all configured links with their status (enabled/disabled) and metadata.

**Example:**
```bash
skill-builder link list --target claude --user
```

### Remove a Link

```bash
skill-builder link remove <name> --target <platform> [--user|--project]
```

Permanently removes a link from the registry.

**Example:**
```bash
skill-builder link remove my-skill --target claude
```

### Enable/Disable Links

```bash
skill-builder link enable <name> --target <platform> [--user|--project]
skill-builder link disable <name> --target <platform> [--user|--project]
```

Toggle links without removing them from the registry.

**Examples:**
```bash
# Temporarily disable a link
skill-builder link disable old-skill --target claude

# Re-enable it later
skill-builder link enable old-skill --target claude
```

### Sync a Link

```bash
skill-builder link sync <name> --target <platform> [--user|--project] [--force]
```

Downloads/copies the linked skill and deploys it to the target platform.

**How it works:**
- **Local links**: Validates and deploys directly from the source path
- **Git links**: Clones the repository to a temporary directory, extracts the skill, and deploys it
- **Web links**: Not yet supported

**Example:**
```bash
skill-builder link sync github-skill --target claude
```

### Sync All Links

```bash
skill-builder link sync-all --target <platform> [--user|--project] [--force]
```

Syncs all enabled links in the registry.

**Example:**
```bash
skill-builder link sync-all --target claude --user
```

## Workflows

### Scenario 1: Team Skill Repository

Your team maintains a repository of shared skills:

1. **Add the repository link:**
```bash
skill-builder link add https://github.com/myteam/skills --target claude \
  --name team-skills --project
```

2. **Sync to deploy all skills:**
```bash
skill-builder link sync team-skills --target claude --project
```

3. **Update when the repository changes:**
```bash
skill-builder link sync team-skills --target claude --project --force
```

### Scenario 2: Local Development

You're developing skills locally and want to test them:

1. **Add a local link:**
```bash
skill-builder link add ~/dev/my-new-skill --target claude --name dev-skill
```

2. **Sync to deploy:**
```bash
skill-builder link sync dev-skill --target claude
```

3. **After making changes, re-sync:**
```bash
skill-builder link sync dev-skill --target claude --force
```

### Scenario 3: Multi-Platform Deployment

You want the same skills across multiple platforms:

1. **Add links for each platform:**
```bash
skill-builder link add /shared/skills/common --target claude --name common-skill
skill-builder link add /shared/skills/common --target codex --name common-skill
```

2. **Sync all:**
```bash
skill-builder link sync common-skill --target claude
skill-builder link sync common-skill --target codex
```

## Best Practices

1. **Version Control Project Links**: Include `.claude/skill-links.json` in your repository to share links with your team

2. **Use Descriptive Names**: Give links meaningful names that indicate their purpose
   ```bash
   --name team-code-review-skill
   ```

3. **Document Dependencies**: Add descriptions to help others understand what each link provides
   ```bash
   --description "Team code review standards and automation"
   ```

4. **Test Before Syncing**: For Git links, validate the source before syncing to avoid deploying broken skills

5. **Regular Updates**: Periodically re-sync Git links to get the latest updates
   ```bash
   skill-builder link sync-all --target claude --force
   ```

6. **Disable Rather Than Remove**: If you're unsure about a link, disable it instead of removing it
   ```bash
   skill-builder link disable uncertain-skill --target claude
   ```

## Limitations

- **Web links** are not yet supported for syncing
- **Git links** require Git to be installed and accessible in PATH
- **Local links** must point to valid SKILL.md directories
- **Sync operations** create temporary copies for Git links, which are cleaned up after deployment

## Troubleshooting

### Link validation fails
- Ensure the source path exists and is accessible
- For Git links, verify the URL and branch are correct
- For local links, check that the directory contains a valid SKILL.md file

### Sync fails
- Check network connectivity for Git/web links
- Ensure you have permissions to access the source
- Verify the target platform configuration is correct

### Link not appearing after sync
- Confirm the link is enabled: `skill-builder link list --target <platform>`
- Check deployment logs for errors
- Verify the skill was validated successfully before deployment

## See Also

- [SKILL.md Format Specification](../spec.md)
- [Deployment Guide](../README.md#deployment)
- [Batch Deployment](../README.md#batch-deploy)
