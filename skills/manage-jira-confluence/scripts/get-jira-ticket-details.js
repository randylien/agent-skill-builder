#!/usr/bin/env node

/**
 * Jira Ticket Details Fetcher
 * Fetches detailed information about specific Jira tickets
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
    process.exit(1);
  }
}

loadEnv();

const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function fetchTicketDetails(ticketKey) {
  try {
    const fields = [
      'summary',
      'description',
      'status',
      'priority',
      'assignee',
      'reporter',
      'created',
      'updated',
      'issuetype',
      'subtasks',
      'parent',
      'labels',
      'components',
      'fixVersions',
      'comment'
    ].join(',');

    const url = `${JIRA_URL}/rest/api/3/issue/${ticketKey}?fields=${fields}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${ticketKey}:`, error.message);
    return null;
  }
}

function formatDescription(desc) {
  if (!desc) return '(無描述)';

  // Convert Atlassian Document Format to plain text
  if (desc.content) {
    let text = '';
    desc.content.forEach(block => {
      if (block.type === 'paragraph' && block.content) {
        block.content.forEach(inline => {
          if (inline.text) text += inline.text;
        });
        text += '\n';
      } else if (block.type === 'bulletList' && block.content) {
        block.content.forEach(item => {
          if (item.content) {
            item.content.forEach(para => {
              if (para.content) {
                para.content.forEach(inline => {
                  if (inline.text) text += '  • ' + inline.text + '\n';
                });
              }
            });
          }
        });
      }
    });
    return text.trim() || '(無描述)';
  }

  return desc;
}

function displayTicketDetails(issue) {
  const { key, fields } = issue;

  console.log('\n' + '═'.repeat(80));
  console.log(`  ${key}: ${fields.summary}`);
  console.log('═'.repeat(80));

  console.log(`\n📌 基本資訊`);
  console.log(`   類型: ${fields.issuetype.name}`);
  console.log(`   狀態: ${fields.status.name}`);
  console.log(`   優先級: ${fields.priority?.name || 'None'}`);
  console.log(`   負責人: ${fields.assignee?.displayName || '未指派'}`);
  console.log(`   報告人: ${fields.reporter?.displayName || '未知'}`);

  console.log(`\n📅 時間`);
  console.log(`   建立時間: ${new Date(fields.created).toLocaleString()}`);
  console.log(`   更新時間: ${new Date(fields.updated).toLocaleString()}`);

  if (fields.labels && fields.labels.length > 0) {
    console.log(`\n🏷️  標籤: ${fields.labels.join(', ')}`);
  }

  if (fields.components && fields.components.length > 0) {
    console.log(`\n🔧 組件: ${fields.components.map(c => c.name).join(', ')}`);
  }

  if (fields.parent) {
    console.log(`\n👆 上層工作: ${fields.parent.key} - ${fields.parent.fields.summary}`);
  }

  console.log(`\n📝 描述`);
  console.log('─'.repeat(80));
  const description = formatDescription(fields.description);
  console.log(description);
  console.log('─'.repeat(80));

  if (fields.subtasks && fields.subtasks.length > 0) {
    console.log(`\n📋 子任務 (${fields.subtasks.length})`);
    fields.subtasks.forEach((subtask, idx) => {
      console.log(`   ${idx + 1}. ${subtask.key} - ${subtask.fields.summary}`);
      console.log(`      狀態: ${subtask.fields.status.name}`);
    });
  }

  if (fields.comment && fields.comment.comments && fields.comment.comments.length > 0) {
    console.log(`\n💬 最近評論 (顯示最新 3 則)`);
    const recentComments = fields.comment.comments.slice(-3).reverse();
    recentComments.forEach((comment, idx) => {
      const commentText = formatDescription(comment.body);
      console.log(`\n   ${comment.author.displayName} - ${new Date(comment.created).toLocaleString()}`);
      console.log(`   ${commentText.split('\n').join('\n   ')}`);
    });
  }

  console.log(`\n🔗 連結: ${JIRA_URL}/browse/${key}`);
  console.log('═'.repeat(80));
}

async function main() {
  const ticketKeys = process.argv.slice(2);

  if (ticketKeys.length === 0) {
    console.log('使用方式: node get-jira-ticket-details.js <TICKET-KEY> [<TICKET-KEY> ...]');
    console.log('範例: node get-jira-ticket-details.js R2D2-16132 R2D2-16190');
    process.exit(1);
  }

  console.log(`🔍 正在獲取 ${ticketKeys.length} 個工作項目的詳細資訊...\n`);

  for (const ticketKey of ticketKeys) {
    const issue = await fetchTicketDetails(ticketKey);
    if (issue) {
      displayTicketDetails(issue);
    }
  }
}

main();
