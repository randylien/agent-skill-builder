#!/usr/bin/env node

/**
 * Confluence Page Details Fetcher
 * Fetches detailed information about specific Confluence pages
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.jira (Confluence uses same credentials)
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

const CONFLUENCE_URL = JIRA_URL.replace(/\/$/, '') + '/wiki';
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function fetchPageDetails(pageId) {
  try {
    const url = `${CONFLUENCE_URL}/rest/api/content/${pageId}?expand=body.storage,body.view,version,space,ancestors,children.page,descendants.comment`;

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
    console.error(`❌ Error fetching page ${pageId}:`, error.message);
    return null;
  }
}

function stripHtml(html) {
  if (!html) return '';

  // Remove HTML tags but preserve some structure
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '  • ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function displayPageDetails(page) {
  const { id, type, title, space, version, _links } = page;
  const webUrl = `${CONFLUENCE_URL}${_links.webui}`;

  console.log('\n' + '═'.repeat(80));
  console.log(`  ${title}`);
  console.log('═'.repeat(80));

  console.log(`\n📌 基本資訊`);
  console.log(`   類型: ${type === 'page' ? '頁面' : '部落格文章'}`);
  console.log(`   空間: ${space.name} (${space.key})`);
  console.log(`   頁面 ID: ${id}`);
  console.log(`   版本: ${version.number}`);

  console.log(`\n👤 作者資訊`);
  console.log(`   建立者: ${version.by.displayName}`);
  console.log(`   最後更新: ${new Date(version.when).toLocaleString()}`);
  console.log(`   更新訊息: ${version.message || '(無)'}`);

  // Show ancestors (breadcrumb)
  if (page.ancestors && page.ancestors.length > 0) {
    console.log(`\n📂 頁面階層`);
    const breadcrumb = page.ancestors.map(a => a.title).join(' > ');
    console.log(`   ${breadcrumb} > ${title}`);
  }

  // Show page content
  if (page.body && page.body.storage && page.body.storage.value) {
    console.log(`\n📝 內容`);
    console.log('─'.repeat(80));
    const content = stripHtml(page.body.storage.value);
    console.log(content);
    console.log('─'.repeat(80));
  }

  // Show child pages
  if (page.children && page.children.page && page.children.page.results && page.children.page.results.length > 0) {
    console.log(`\n📄 子頁面 (${page.children.page.results.length})`);
    page.children.page.results.forEach((child, idx) => {
      console.log(`   ${idx + 1}. ${child.title}`);
    });
  }

  // Show comments
  if (page.descendants && page.descendants.comment && page.descendants.comment.results && page.descendants.comment.results.length > 0) {
    const comments = page.descendants.comment.results;
    console.log(`\n💬 評論 (${comments.length})`);
    comments.slice(0, 5).forEach((comment, idx) => {
      if (comment.body && comment.body.storage) {
        const commentText = stripHtml(comment.body.storage.value);
        console.log(`\n   ${comment.version.by.displayName} - ${new Date(comment.version.when).toLocaleString()}`);
        console.log(`   ${commentText.split('\n').join('\n   ')}`);
      }
    });
    if (comments.length > 5) {
      console.log(`\n   ... 還有 ${comments.length - 5} 則評論`);
    }
  }

  console.log(`\n🔗 連結: ${webUrl}`);
  console.log('═'.repeat(80));
}

async function main() {
  const pageIds = process.argv.slice(2);

  if (pageIds.length === 0) {
    console.log(`
使用方式: node get-confluence-page.js <PAGE-ID> [<PAGE-ID> ...]

PAGE-ID 可以是:
  - 數字 ID (例如: 123456789)
  - 從搜尋結果取得的 ID

範例:
  node get-confluence-page.js 123456789
  node get-confluence-page.js 123456789 987654321

提示: 使用 search-confluence.js 來找到頁面 ID
`);
    process.exit(1);
  }

  console.log(`🔍 正在獲取 ${pageIds.length} 個頁面的詳細資訊...\n`);

  for (const pageId of pageIds) {
    const page = await fetchPageDetails(pageId);
    if (page) {
      displayPageDetails(page);
    }
  }
}

main();
