# Jira Tickets Fetcher - Setup Guide

## Quick Setup

### 1. Create your credentials file

```bash
cp .env.jira.example .env.jira
```

### 2. Edit .env.jira and fill in your information

```bash
# Open in your editor
nano .env.jira  # or use your preferred editor
```

Fill in these values:
- **JIRA_URL**: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
- **JIRA_EMAIL**: The email address you use to log into Jira
- **JIRA_API_TOKEN**: Generate one at https://id.atlassian.com/manage-profile/security/api-tokens

### 3. Run the script

```bash
node get-jira-tickets.js
```

## Generating an API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "CLI Access")
4. Copy the generated token
5. Paste it into your `.env.jira` file

⚠️ **Important**: Treat API tokens like passwords - never commit them to git!

## Troubleshooting

### "Could not read .env.jira file"
- Make sure you copied `.env.jira.example` to `.env.jira`
- Check that the file is in the same directory as the script

### "HTTP 401" error
- Verify your email is correct
- Check that your API token is valid
- Make sure there are no extra spaces in your `.env.jira` file

### "HTTP 404" error
- Verify your JIRA_URL is correct
- Make sure it includes `https://` and doesn't have a trailing slash

## What the Script Does

The script queries Jira for:
- All tickets assigned to you
- That are unresolved (not Done, Closed, etc.)
- Ordered by most recently updated first

It displays:
- Ticket key and summary
- Type, status, and priority
- Last updated date
- Direct link to the ticket
