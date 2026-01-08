#!/usr/bin/env node

/**
 * 掃描 Git Staged 檔案
 *
 * 這個腳本會:
 * 1. 取得所有 git staged 的檔案
 * 2. 使用規則掃描這些檔案
 * 3. 如果發現敏感資訊，返回非零 exit code
 */

import { spawnSync } from 'child_process';
import { loadRules } from './rule-parser.js';
import { scanFiles, formatResults } from './scanner.js';

/**
 * 取得 git staged 檔案列表
 * @returns {Array<string>} staged 檔案路徑列表
 */
function getStagedFiles() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (result.error) {
    console.error('❌ Failed to execute git command');
    console.error(`   Error: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error('❌ Failed to get staged files');
    console.error('   Make sure you are in a git repository');
    if (result.stderr) {
      console.error(`   ${result.stderr.trim()}`);
    }
    process.exit(1);
  }

  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Main function
 */
function main() {
  console.log('🔒 Checking staged files for sensitive information...\n');

  // 1. 取得 staged 檔案
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged files to check');
    console.log('   Use "git add <files>" to stage files first');
    process.exit(0);
  }

  console.log(`📝 Found ${stagedFiles.length} staged file(s):`);
  for (const file of stagedFiles) {
    console.log(`   - ${file}`);
  }
  console.log('');

  // 2. 載入檢查規則
  const rules = loadRules();

  if (rules.length === 0) {
    console.warn('⚠️  No rules loaded from REFERENCE.md');
    console.warn('   Skipping security check');
    process.exit(0);
  }

  // 3. 掃描檔案
  const results = scanFiles(stagedFiles, rules);

  // 4. 顯示結果
  const findingsCount = formatResults(results, false);

  // 5. 根據結果決定 exit code
  if (findingsCount > 0) {
    console.log('❌ Commit blocked: sensitive information detected');
    console.log('');
    console.log('Please remove sensitive information before committing:');
    console.log('  1. Remove the sensitive data from files');
    console.log('  2. Use @sensitive-ignore comment if it\'s a false positive');
    console.log('  3. Update .sensitiveignore to exclude specific files');
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ All checks passed! Safe to commit.');
    process.exit(0);
  }
}

// Execute
main();
