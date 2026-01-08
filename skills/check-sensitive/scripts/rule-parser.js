#!/usr/bin/env node

/**
 * 規則解析器 - 從 REFERENCE.md 解析敏感資訊檢查規則
 *
 * REFERENCE.md 格式:
 * - 使用 markdown 標題來組織規則類別
 * - 使用 ```regex code blocks 來定義正規表達式
 * - 每個規則會關聯到它所屬的類別名稱
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 尋找 REFERENCE.md 檔案
 * 依序搜尋: 專案根目錄 -> .git 同層 -> 當前目錄
 */
export function findReferenceFile() {
  const searchPaths = [
    // 專案根目錄 (假設從 .git 判斷)
    process.cwd(),
    // .git 同層目錄
    resolve(process.cwd(), '..'),
    // 當前執行目錄
    __dirname,
  ];

  for (const basePath of searchPaths) {
    const refPath = join(basePath, 'REFERENCE.md');
    if (existsSync(refPath)) {
      return refPath;
    }
  }

  return null;
}

/**
 * 解析 REFERENCE.md 中的規則
 * @param {string} filePath - REFERENCE.md 的路徑
 * @returns {Array<{category: string, pattern: RegExp, rawPattern: string}>}
 */
export function parseRules(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`REFERENCE.md not found at: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const rules = [];
  let currentCategory = 'Unknown';
  let inCodeBlock = false;
  let codeBlockType = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 檢測 Markdown 標題 (## 或 ###) 作為類別
    const headerMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headerMatch) {
      currentCategory = headerMatch[1].trim();
      continue;
    }

    // 檢測 code block 開始
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockType = line.substring(3).trim();
      } else {
        inCodeBlock = false;
        codeBlockType = '';
      }
      continue;
    }

    // 在 regex code block 中的內容視為規則
    if (inCodeBlock && codeBlockType === 'regex') {
      const pattern = line.trim();

      // 忽略空行和註解
      if (!pattern || pattern.startsWith('#') || pattern.startsWith('//')) {
        continue;
      }

      try {
        // 建立 RegExp，使用 global 和 multiline flags
        const regex = new RegExp(pattern, 'gm');
        rules.push({
          category: currentCategory,
          pattern: regex,
          rawPattern: pattern,
        });
      } catch (error) {
        console.warn(`⚠️  Invalid regex in ${currentCategory}: ${pattern}`);
        console.warn(`   Error: ${error.message}`);
      }
    }
  }

  return rules;
}

/**
 * 載入並解析規則
 * @returns {Array<{category: string, pattern: RegExp, rawPattern: string}>}
 */
export function loadRules() {
  const refFile = findReferenceFile();

  if (!refFile) {
    console.error('❌ REFERENCE.md not found!');
    console.error('');
    console.error('Please create REFERENCE.md in one of these locations:');
    console.error('  - Project root directory');
    console.error('  - Same directory as .git');
    console.error('  - Current directory');
    console.error('');
    console.error('You can use the example file as a template:');
    console.error('  cp skills/check-sensitive/REFERENCE.md.example REFERENCE.md');
    process.exit(1);
  }

  console.log(`📋 Loading rules from: ${refFile}`);
  const rules = parseRules(refFile);
  console.log(`✓ Loaded ${rules.length} rules\n`);

  return rules;
}

// 如果直接執行此檔案，顯示載入的規則
if (import.meta.url === `file://${process.argv[1]}`) {
  const rules = loadRules();

  console.log('Loaded rules:');
  console.log('─'.repeat(60));

  const grouped = {};
  for (const rule of rules) {
    if (!grouped[rule.category]) {
      grouped[rule.category] = [];
    }
    grouped[rule.category].push(rule.rawPattern);
  }

  for (const [category, patterns] of Object.entries(grouped)) {
    console.log(`\n📂 ${category} (${patterns.length} rules)`);
    for (const pattern of patterns) {
      console.log(`   - ${pattern}`);
    }
  }
}
