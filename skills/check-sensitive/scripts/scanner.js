#!/usr/bin/env node

/**
 * 敏感資訊掃描引擎
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function loadIgnorePatterns() {
  const ignorePath = join(process.cwd(), '.sensitiveignore');
  if (!existsSync(ignorePath)) return [];

  const content = readFileSync(ignorePath, 'utf-8');
  const patterns = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const regexPattern = trimmed
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    patterns.push(new RegExp(regexPattern));
  }
  return patterns;
}

export function shouldIgnoreFile(filePath, ignorePatterns) {
  return ignorePatterns.some(pattern => pattern.test(filePath));
}

export function scanFile(filePath, rules, ignorePatterns = []) {
  if (shouldIgnoreFile(filePath, ignorePatterns)) {
    return { filePath, findings: [], ignored: true };
  }

  if (!existsSync(filePath)) {
    return { filePath, findings: [], error: 'File not found' };
  }

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error) {
    return { filePath, findings: [], error: 'Cannot read file: ' + error.message };
  }

  const lines = content.split('\n');
  const findings = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    if (line.includes('@sensitive-ignore')) continue;

    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(line)) !== null) {
        findings.push({
          line: lineNum + 1,
          column: match.index + 1,
          content: line.trim(),
          category: rule.category,
          pattern: rule.rawPattern,
          matchedText: match[0],
        });
      }
    }
  }

  return { filePath, findings, ignored: false };
}

export function scanFiles(filePaths, rules) {
  const ignorePatterns = loadIgnorePatterns();
  const results = [];

  for (const filePath of filePaths) {
    const result = scanFile(filePath, rules, ignorePatterns);
    if (result.findings.length > 0 || result.error) {
      results.push(result);
    }
  }
  return results;
}

export function formatResults(results, verbose = false) {
  let totalFindings = 0;

  console.log('');
  console.log('🔍 Scan Results');
  console.log('═'.repeat(60));

  if (results.length === 0) {
    console.log('✅ No sensitive information detected!');
    console.log('');
    return 0;
  }

  for (const result of results) {
    if (result.error) {
      console.log('\n⚠️  ' + result.filePath);
      console.log('   Error: ' + result.error);
      continue;
    }

    if (result.findings.length === 0) continue;

    totalFindings += result.findings.length;
    console.log('\n❌ ' + result.filePath + ' (' + result.findings.length + ' issues)');
    console.log('─'.repeat(60));

    const grouped = {};
    for (const finding of result.findings) {
      if (!grouped[finding.category]) grouped[finding.category] = [];
      grouped[finding.category].push(finding);
    }

    for (const [category, findings] of Object.entries(grouped)) {
      console.log('\n  📌 ' + category + ':');

      for (const finding of findings) {
        console.log('     Line ' + finding.line + ':' + finding.column);
        if (verbose) {
          console.log('     Pattern: ' + finding.pattern);
          console.log('     Matched: ' + finding.matchedText);
        }
        const preview = finding.content.length > 80
          ? finding.content.substring(0, 77) + '...'
          : finding.content;
        console.log('     > ' + preview);
        console.log('');
      }
    }
  }

  console.log('═'.repeat(60));
  console.log('Total: ' + totalFindings + ' potential issues found in ' + results.length + ' files');
  console.log('');

  if (totalFindings > 0) {
    console.log('💡 To ignore false positives:');
    console.log('   1. Add @sensitive-ignore comment to the line');
    console.log('   2. Update .sensitiveignore to exclude files');
    console.log('   3. Adjust patterns in REFERENCE.md');
    console.log('');
  }

  return totalFindings;
}
