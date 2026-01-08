#!/usr/bin/env node

/**
 * Confluence Search Tool
 * Searches for pages and blog posts in Confluence
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
    console.error('Please copy .env.jira.example to .env.jira and fill in your credentials');
    process.exit(1);
  }
}

loadEnv();

const JIRA_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN are set in .env.jira');
  process.exit(1);
}

// Confluence is usually at the same domain but with /wiki path
const CONFLUENCE_URL = JIRA_URL.replace(/\/$/, '') + '/wiki';
const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function searchConfluence(query, options = {}) {
  try {
    const {
      limit = 25,
      type = 'page', // 'page', 'blogpost', or 'all'
      spaceKey = null
    } = options;

    // Build CQL (Confluence Query Language)
    let cql = `text ~ "${query}"`;

    if (type !== 'all') {
      cql += ` AND type = ${type}`;
    }

    if (spaceKey) {
      cql += ` AND space = ${spaceKey}`;
    }

    cql += ' ORDER BY lastmodified DESC';

    const url = `${CONFLUENCE_URL}/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=space,version,body.view`;

    console.log(`🔍 正在搜尋 Confluence: "${query}"...\n`);

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
    return data;

  } catch (error) {
    console.error('❌ 搜尋 Confluence 時發生錯誤:');
    console.error(error.message);

    if (error.message.includes('401')) {
      console.error('\n💡 提示: 請檢查您的 email 和 API token 是否正確');
    } else if (error.message.includes('404')) {
      console.error('\n💡 提示: 請檢查 Confluence URL 是否正確');
      console.error(`   當前使用: ${CONFLUENCE_URL}`);
    }

    process.exit(1);
  }
}

function stripHtml(html) {
  if (!html) return '';
  // Simple HTML tag removal
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function getExcerpt(html, maxLength = 200) {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function displayResults(data, query) {
  if (data.results.length === 0) {
    console.log(`❌ 沒有找到與 "${query}" 相關的文件`);
    return;
  }

  console.log(`📄 找到 ${data.results.length} 個相關文件:\n`);
  console.log('─'.repeat(80));

  data.results.forEach((page, index) => {
    const { id, type, title, space, version, _links } = page;
    const webUrl = `${CONFLUENCE_URL}${_links.webui}`;

    console.log(`\n${index + 1}. ${title}`);
    console.log(`   類型: ${type === 'page' ? '頁面' : '部落格文章'}`);
    console.log(`   空間: ${space.name} (${space.key})`);
    console.log(`   最後更新: ${new Date(version.when).toLocaleString()}`);
    console.log(`   更新者: ${version.by.displayName}`);

    // Show excerpt if body is available
    if (page.body && page.body.view && page.body.view.value) {
      const excerpt = getExcerpt(page.body.view.value);
      if (excerpt) {
        console.log(`   摘要: ${excerpt}`);
      }
    }

    console.log(`   連結: ${webUrl}`);
    console.log(`   頁面 ID: ${id}`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log(`\n總計: ${data.results.length} 個文件`);

  if (data.size >= data.limit) {
    console.log(`\n💡 提示: 結果可能不完整,請使用 --limit 參數增加顯示數量`);
  }
}

function printUsage() {
  console.log(`
使用方式: node search-confluence.js [選項] <搜尋關鍵字>

選項:
  --limit <數字>     限制結果數量 (預設: 25)
  --type <類型>      搜尋類型: page, blogpost, all (預設: page)
  --space <空間鍵>   限定搜尋特定空間

範例:
  node search-confluence.js "Multi-account"
  node search-confluence.js --limit 50 "帳戶復原"
  node search-confluence.js --type all "R2D2-16181"
  node search-confluence.js --space PROJ "設計文件"
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  // Parse options
  const options = {
    limit: 25,
    type: 'page',
    spaceKey: null
  };

  let query = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--type' && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    } else if (arg === '--space' && args[i + 1]) {
      options.spaceKey = args[i + 1];
      i++;
    } else if (!arg.startsWith('--')) {
      query += (query ? ' ' : '') + arg;
    }
  }

  if (!query) {
    console.error('❌ 請提供搜尋關鍵字');
    printUsage();
    process.exit(1);
  }

  const data = await searchConfluence(query, options);
  displayResults(data, query);
}

main();
