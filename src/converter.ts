/**
 * Format converter for different AI editors
 * Converts SKILL.md to platform-specific formats
 */

import type { SkillFile } from "./types.ts";

/**
 * Convert SKILL.md to Cursor .cursorrules format
 * Cursor uses markdown-like rules rather than YAML frontmatter
 */
export function convertToCursorRules(skill: SkillFile): string {
  const { metadata, content } = skill;

  const lines: string[] = [];

  // Add header comment with skill metadata
  lines.push(`# ${metadata.name}`);
  lines.push("");
  lines.push(`## Description`);
  lines.push(metadata.description);
  lines.push("");

  // Convert markdown content to Cursor rule format
  // If content already has rule sections, use it as-is
  if (content.includes("## Rule:")) {
    lines.push(content.trim());
  } else {
    // Otherwise, wrap the content in a generic rule section
    lines.push("## Rule: Skill Instructions");
    lines.push("");
    lines.push(content.trim());
  }

  return lines.join("\n");
}

/**
 * Extract rules from markdown content
 * Helps identify structured instructions for Cursor
 */
export function extractRules(content: string): Array<{ title: string; items: string[] }> {
  const rules: Array<{ title: string; items: string[] }> = [];
  const lines = content.split("\n");

  let currentRule: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    // Check for rule headers (## heading or **bold**)
    if (line.startsWith("## ")) {
      if (currentRule) {
        rules.push(currentRule);
      }
      currentRule = { title: line.slice(3).trim(), items: [] };
    } else if (currentRule && line.trim().startsWith("- ")) {
      // List item
      currentRule.items.push(line.trim());
    } else if (currentRule && line.trim()) {
      // Regular paragraph
      currentRule.items.push(line.trim());
    }
  }

  if (currentRule) {
    rules.push(currentRule);
  }

  return rules;
}

/**
 * Optimize SKILL.md for deployment
 * Removes unnecessary whitespace while preserving structure
 */
export function optimizeSkillContent(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join("\n")
    .replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
}
