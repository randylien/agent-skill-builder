#!/usr/bin/env node

/**
 * Jira Tickets Fetcher
 * Fetches current user's assigned tickets from Jira Cloud
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.jira
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env.jira');
    const envContent = readFileSync(envPath, 'utf-8');

    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  } catch (error) {
    console.error('❌ Could not read .env.jira file');
    console.error('Please copy .env.jira.example to .env.jira and fill in your credentials');
    process.exit(1);
  }
}

loadEnv();

const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Validate configuration
if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN are set in .env.jira');
  process.exit(1);
}

// Create Basic Auth header
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function fetchJiraTickets() {
  try {
    // JQL query to get current user's unresolved tickets
    const jql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC';
    const url = `${JIRA_URL}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=key,summary,status,priority,updated,created,issuetype`;

    console.log('🔍 Fetching your Jira tickets...\n');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.issues.length === 0) {
      console.log('✅ No unresolved tickets assigned to you!');
      return;
    }

    console.log(`📋 Found ${data.issues.length} ticket(s):\n`);
    console.log('─'.repeat(80));

    data.issues.forEach((issue, index) => {
      const { key, fields } = issue;
      const { summary, status, priority, issuetype, updated, created } = fields;

      console.log(`\n${index + 1}. ${key} - ${summary}`);
      console.log(`   Type: ${issuetype.name}`);
      console.log(`   Status: ${status.name}`);
      console.log(`   Priority: ${priority?.name || 'None'}`);
      console.log(`   Updated: ${new Date(updated).toLocaleString()}`);
      console.log(`   Link: ${JIRA_URL}/browse/${key}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\nTotal: ${data.issues.length} ticket(s)`);

  } catch (error) {
    console.error('❌ Error fetching Jira tickets:');
    console.error(error.message);

    if (error.message.includes('401')) {
      console.error('\n💡 Tip: Check your email and API token are correct');
    } else if (error.message.includes('404')) {
      console.error('\n💡 Tip: Check your Jira URL is correct');
    }

    process.exit(1);
  }
}

fetchJiraTickets();
