#!/usr/bin/env node

/**
 * 掃描指定的檔案
 *
 * Usage: node scan-file.js <file1> [file2] [file3] ...
 */

import { loadRules } from './rule-parser.js';
import { scanFiles, formatResults } from './scanner.js';

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scan-file.js <file1> [file2] [file3] ...');
    console.error('');
    console.error('Examples:');
    console.error('  node scan-file.js src/config.ts');
    console.error('  node scan-file.js .env.local src/api/keys.ts');
    process.exit(1);
  }

  const filePaths = args;

  console.log('🔍 Scanning specified files for sensitive information...\n');
  console.log(`📝 Files to check (${filePaths.length}):`);
  for (const file of filePaths) {
    console.log(`   - ${file}`);
  }
  console.log('');

  // 載入檢查規則
  const rules = loadRules();

  if (rules.length === 0) {
    console.warn('⚠️  No rules loaded from REFERENCE.md');
    console.warn('   Skipping security check');
    process.exit(0);
  }

  // 掃描檔案
  const results = scanFiles(filePaths, rules);

  // 顯示結果 (verbose mode)
  const findingsCount = formatResults(results, true);

  // 根據結果決定 exit code
  if (findingsCount > 0) {
    process.exit(1);
  } else {
    console.log('✅ No sensitive information detected!');
    process.exit(0);
  }
}

// Execute
main();
