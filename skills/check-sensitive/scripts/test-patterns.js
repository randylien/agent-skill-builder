#!/usr/bin/env node

/**
 * 測試 REFERENCE.md 中的規則
 *
 * 這個工具可以:
 * 1. 驗證所有規則的正規表達式語法
 * 2. 提供測試字串來驗證規則是否正常運作
 * 3. 顯示規則統計資訊
 */

import { loadRules } from './rule-parser.js';
import readline from 'readline';

/**
 * 互動式測試模式
 */
async function interactiveTest(rules) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🧪 Interactive Pattern Testing');
  console.log('═'.repeat(60));
  console.log('Enter test strings to check against all rules.');
  console.log('Type "exit" or press Ctrl+C to quit.\n');

  const ask = () => {
    rl.question('Test string: ', (input) => {
      if (input.toLowerCase() === 'exit' || !input) {
        rl.close();
        return;
      }

      console.log('');
      let matchCount = 0;

      for (const rule of rules) {
        rule.pattern.lastIndex = 0;
        const match = rule.pattern.test(input);

        if (match) {
          matchCount++;
          console.log(`✓ Matched: ${rule.category}`);
          console.log(`  Pattern: ${rule.rawPattern}`);
          console.log('');
        }
      }

      if (matchCount === 0) {
        console.log('✗ No patterns matched\n');
      } else {
        console.log(`Total: ${matchCount} pattern(s) matched\n`);
      }

      console.log('─'.repeat(60));
      ask();
    });
  };

  ask();
}

/**
 * 顯示規則統計
 */
function showStatistics(rules) {
  console.log('\n📊 Rule Statistics');
  console.log('═'.repeat(60));

  // 按類別分組
  const categories = {};
  for (const rule of rules) {
    if (!categories[rule.category]) {
      categories[rule.category] = 0;
    }
    categories[rule.category]++;
  }

  console.log(`\nTotal rules: ${rules.length}`);
  console.log(`Categories: ${Object.keys(categories).length}\n`);

  // 顯示每個類別的規則數量
  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1]);

  for (const [category, count] of sortedCategories) {
    const bar = '█'.repeat(Math.ceil(count / 2));
    console.log(`  ${category.padEnd(35)} ${bar} ${count}`);
  }

  console.log('');
}

/**
 * 內建測試案例
 */
function runBuiltInTests(rules) {
  console.log('\n🔬 Running Built-in Test Cases');
  console.log('═'.repeat(60));

  const testCases = [
    // API Keys
    { input: 'AKIAIOSFODNN7EXAMPLE', shouldMatch: true, description: 'AWS Access Key' },
    { input: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz', shouldMatch: true, description: 'OpenAI API Key' },
    { input: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz', shouldMatch: true, description: 'GitHub Token' },

    // PII
    { input: 'A123456789', shouldMatch: true, description: '台灣身分證 (假)' },
    { input: '0912345678', shouldMatch: true, description: '台灣手機號碼' },

    // Email
    { input: 'user@yourcompany.com', shouldMatch: true, description: '公司 Email' },

    // Should NOT match
    { input: 'const apiKey = "YOUR_API_KEY_HERE";', shouldMatch: false, description: 'Placeholder' },
    { input: 'https://example.com', shouldMatch: false, description: '一般網址' },
    { input: 'import { useState } from "react";', shouldMatch: false, description: '程式碼' },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    let matched = false;
    let matchedRules = [];

    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(testCase.input)) {
        matched = true;
        matchedRules.push(rule.category);
      }
    }

    const success = matched === testCase.shouldMatch;
    const icon = success ? '✓' : '✗';
    const status = success ? 'PASS' : 'FAIL';

    console.log(`\n${icon} ${status}: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: ${testCase.shouldMatch ? 'Should match' : 'Should NOT match'}`);

    const resultText = matched ? `Matched (${matchedRules.join(', ')})` : 'No match';
    console.log(`  Result: ${resultText}`);

    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Consider adjusting REFERENCE.md rules.');
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'stats';

  console.log('🧪 Pattern Testing Tool');

  // 載入規則
  const rules = loadRules();

  if (rules.length === 0) {
    console.error('❌ No rules loaded. Cannot run tests.');
    process.exit(1);
  }

  switch (mode) {
    case 'stats':
    case 'statistics':
      showStatistics(rules);
      break;

    case 'test':
    case 'built-in':
      runBuiltInTests(rules);
      break;

    case 'interactive':
    case 'i':
      interactiveTest(rules);
      break;

    default:
      console.log('\nUsage: node test-patterns.js [mode]');
      console.log('\nModes:');
      console.log('  stats       - Show rule statistics (default)');
      console.log('  test        - Run built-in test cases');
      console.log('  interactive - Interactive pattern testing');
      console.log('');
      console.log('Examples:');
      console.log('  node test-patterns.js stats');
      console.log('  node test-patterns.js test');
      console.log('  node test-patterns.js interactive');
      process.exit(1);
  }
}

// Run main
main();
