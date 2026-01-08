---
name: manage-jira-confluence
description: Query Jira tickets and search Confluence documents. Use when you need to review assigned work items, get ticket details, search knowledge base articles, or retrieve project documentation. Supports JQL queries and CQL search.
---

# Jira & Confluence Query Tools

Use Atlassian REST API to query Jira tickets and Confluence documents.
If warnings appear during execution, please ignore them.

## Prerequisites

Ensure `.env.jira` or `env.jira` is configured:

```bash
JIRA_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

Generate API Token at https://id.atlassian.com/manage-profile/security/api-tokens.

## Available Tools

### 1. List Assigned Tickets

Get all unresolved assigned work:

```bash
node skills/manage-jira-confluence/scripts/get-jira-tickets.js
```

Use case: Review current work queue, check recently updated tickets.

---

### 2. Get Ticket Details

Get complete ticket information:

```bash
node skills/manage-jira-confluence/scripts/get-jira-ticket-details.js <TICKET-KEY> [<TICKET-KEY> ...]
```

Example:
```bash
node skills/manage-jira-confluence/scripts/get-jira-ticket-details.js R2D2-16132 R2D2-16190
```

Returns: Description, status, priority, subtasks, last 3 comments.

Use case: Understand requirements, review discussions, analyze task relationships.

---

### 3. Search Confluence Pages

Search documents using CQL:

```bash
node skills/manage-jira-confluence/scripts/search-confluence.js [OPTIONS] <QUERY>
```

**Options:**
- `--limit <number>`: Maximum number of results (default: 25)
- `--type <type>`: `page`, `blogpost` or `all` (default: `page`)
- `--space <key>`: Limit to specific space

**Examples:**

```bash
# Basic search
node skills/manage-jira-confluence/scripts/search-confluence.js "Multi-account"

# Limit to space
node skills/manage-jira-confluence/scripts/search-confluence.js --space PROD "PRD"

# Increase result count
node skills/manage-jira-confluence/scripts/search-confluence.js --limit 50 "architecture"

# Search all types
node skills/manage-jira-confluence/scripts/search-confluence.js --type all "API"
```

Returns: Title, space, last updated, excerpt, **page ID** (for fetching full content).

Use case: Find design docs, PRDs, technical specs, meeting notes.

---

### 4. Get Page Full Content

Get complete document using page ID:

```bash
node skills/manage-jira-confluence/scripts/get-confluence-page.js <PAGE-ID> [<PAGE-ID> ...]
```

Example:
```bash
node skills/manage-jira-confluence/scripts/get-confluence-page.js 123456789
```

Returns: Full content (HTML converted to plain text), hierarchy, version, child pages, comments (up to 5).

Use case: Read complete documentation, view page structure, check discussions.

---

## Common Workflows

### Find and Read Project Documentation

1. Search for relevant pages to get Page ID:
   ```bash
   node skills/manage-jira-confluence/scripts/search-confluence.js "R2D2-16181"
   ```

2. Use Page ID to get full content:
   ```bash
   node skills/manage-jira-confluence/scripts/get-confluence-page.js <PAGE-ID>
   ```

### Understand Ticket Content

1. List tickets:
   ```bash
   node skills/manage-jira-confluence/scripts/get-jira-tickets.js
   ```

2. Get detailed information:
   ```bash
   node skills/manage-jira-confluence/scripts/get-jira-ticket-details.js <TICKET-KEY>
   ```

3. Search related documentation:
   ```bash
   node skills/manage-jira-confluence/scripts/search-confluence.js "<TICKET-KEY>"
   ```

---

## Technical Details

### APIs
- **Jira**: REST API v3 (`/rest/api/3/`)
- **Confluence**: REST API v2 (`/rest/api/content/`)
- **Confluence URL**: Automatically derived from `{JIRA_URL}/wiki`

### Query Languages
- **Jira**: JQL (Jira Query Language)
- **Confluence**: CQL (Confluence Query Language)

### Authentication
- Basic Auth with API tokens
- Credentials stored in local `.env.jira`
- Jira and Confluence share the same configuration

---

## Troubleshooting

### HTTP 401
- Verify email is correct
- Check API token is valid and not expired
- Ensure `.env.jira` has no extra spaces

### HTTP 404
- Verify JIRA_URL is correct (includes `https://`, no trailing slash)
- Confirm Confluence is at `{JIRA_URL}/wiki`

### No Search Results
- Try different keywords
- Use `--type all` to search all types
- Check if you have permission to access the space
- Verify space key is correct (case-sensitive)

---

## Example Use Cases

### Product Manager
```bash
# Find PRDs
node skills/manage-jira-confluence/scripts/search-confluence.js --space PROD "PRD"

# View specific PRD
node skills/manage-jira-confluence/scripts/get-confluence-page.js 123456789
```

### Developer
```bash
# Review assigned work
node skills/manage-jira-confluence/scripts/get-jira-tickets.js

# Get ticket details
node skills/manage-jira-confluence/scripts/get-jira-ticket-details.js R2D2-16132

# Find technical specs
node skills/manage-jira-confluence/scripts/search-confluence.js --space ENG "architecture"
```

### QA
```bash
# Search test documentation
node skills/manage-jira-confluence/scripts/search-confluence.js --space QA "test plan"

# View test cases
node skills/manage-jira-confluence/scripts/get-confluence-page.js 987654321

# Check bug tickets
node skills/manage-jira-confluence/scripts/get-jira-ticket-details.js BUG-123
```
