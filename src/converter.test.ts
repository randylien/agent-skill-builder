/**
 * Tests for converter.ts
 * Tests format conversion functions
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { convertToCursorRules, extractRules, optimizeSkillContent } from "./converter.ts";
import { parseSkillFile } from "./validator.ts";
import type { SkillFile } from "./types.ts";
import { getFixturePath } from "./test_utils.ts";

Deno.test("convertToCursorRules - basic skill", () => {
  const skill: SkillFile = {
    metadata: {
      name: "test-skill",
      description: "A test skill for conversion",
    },
    content: "This is the skill content.\n\nIt has multiple paragraphs.",
    raw: "---\nname: test-skill\n---\n\nThis is the skill content.",
  };

  const result = convertToCursorRules(skill);

  assertStringIncludes(result, "# test-skill");
  assertStringIncludes(result, "## Description");
  assertStringIncludes(result, "A test skill for conversion");
  assertStringIncludes(result, "## Rule: Skill Instructions");
  assertStringIncludes(result, "This is the skill content.");
});

Deno.test("convertToCursorRules - skill with existing rules", () => {
  const skill: SkillFile = {
    metadata: {
      name: "test-skill",
      description: "A test skill",
    },
    content: "## Rule: Code Style\n\n- Use tabs\n- No semicolons\n\n## Rule: Error Handling\n\n- Always validate input",
    raw: "",
  };

  const result = convertToCursorRules(skill);

  assertStringIncludes(result, "# test-skill");
  assertStringIncludes(result, "## Description");
  assertStringIncludes(result, "## Rule: Code Style");
  assertStringIncludes(result, "## Rule: Error Handling");
  assertStringIncludes(result, "- Use tabs");
  assertStringIncludes(result, "- Always validate input");
});

Deno.test("convertToCursorRules - skill from fixture", async () => {
  const fixturePath = join(getFixturePath("cursor-rules-skill"), "SKILL.md");
  const skill = await parseSkillFile(fixturePath);

  const result = convertToCursorRules(skill);

  assertStringIncludes(result, "# cursor-test");
  assertStringIncludes(result, "## Description");
  assertStringIncludes(result, "A skill for testing Cursor conversion");
  assertStringIncludes(result, "## Rule: Code Style");
  assertStringIncludes(result, "## Rule: Error Handling");
});

Deno.test("convertToCursorRules - preserves line breaks", () => {
  const skill: SkillFile = {
    metadata: {
      name: "test-skill",
      description: "Test",
    },
    content: "Line 1\n\nLine 2\n\nLine 3",
    raw: "",
  };

  const result = convertToCursorRules(skill);

  assertStringIncludes(result, "Line 1\n\nLine 2\n\nLine 3");
});

Deno.test("convertToCursorRules - handles empty content", () => {
  const skill: SkillFile = {
    metadata: {
      name: "empty-skill",
      description: "An empty skill",
    },
    content: "",
    raw: "",
  };

  const result = convertToCursorRules(skill);

  assertStringIncludes(result, "# empty-skill");
  assertStringIncludes(result, "## Description");
  assertStringIncludes(result, "An empty skill");
});

Deno.test("extractRules - extract multiple rules", () => {
  const content = `## Code Style

- Use tabs
- No semicolons

## Error Handling

- Validate input
- Handle edge cases

Some additional text.`;

  const rules = extractRules(content);

  assertEquals(rules.length, 2);
  assertEquals(rules[0].title, "Code Style");
  assertEquals(rules[0].items.length, 2);
  assertEquals(rules[0].items[0], "- Use tabs");
  assertEquals(rules[0].items[1], "- No semicolons");

  assertEquals(rules[1].title, "Error Handling");
  assertEquals(rules[1].items.length, 3);
  assertEquals(rules[1].items[0], "- Validate input");
  assertEquals(rules[1].items[1], "- Handle edge cases");
  assertEquals(rules[1].items[2], "Some additional text.");
});

Deno.test("extractRules - single rule", () => {
  const content = `## Main Rule

- Item 1
- Item 2`;

  const rules = extractRules(content);

  assertEquals(rules.length, 1);
  assertEquals(rules[0].title, "Main Rule");
  assertEquals(rules[0].items.length, 2);
});

Deno.test("extractRules - no rules", () => {
  const content = "Just some text without rule headers.";

  const rules = extractRules(content);

  assertEquals(rules.length, 0);
});

Deno.test("extractRules - empty content", () => {
  const content = "";

  const rules = extractRules(content);

  assertEquals(rules.length, 0);
});

Deno.test("extractRules - rule with mixed content", () => {
  const content = `## Mixed Rule

This is a paragraph.

- List item 1
- List item 2

Another paragraph.`;

  const rules = extractRules(content);

  assertEquals(rules.length, 1);
  assertEquals(rules[0].title, "Mixed Rule");
  assertEquals(rules[0].items.length, 4);
  assertEquals(rules[0].items[0], "This is a paragraph.");
  assertEquals(rules[0].items[1], "- List item 1");
  assertEquals(rules[0].items[2], "- List item 2");
  assertEquals(rules[0].items[3], "Another paragraph.");
});

Deno.test("extractRules - ignore empty lines", () => {
  const content = `## Rule One

- Item 1

- Item 2

## Rule Two

Content here`;

  const rules = extractRules(content);

  assertEquals(rules.length, 2);
  assertEquals(rules[0].title, "Rule One");
  assertEquals(rules[0].items.length, 2);
  assertEquals(rules[1].title, "Rule Two");
  assertEquals(rules[1].items.length, 1);
});

Deno.test("optimizeSkillContent - remove trailing whitespace", () => {
  const content = "Line 1   \nLine 2\t\nLine 3  ";
  const result = optimizeSkillContent(content);

  assertEquals(result, "Line 1\nLine 2\nLine 3");
});

Deno.test("optimizeSkillContent - limit consecutive newlines", () => {
  const content = "Line 1\n\n\n\nLine 2\n\n\n\n\nLine 3";
  const result = optimizeSkillContent(content);

  assertEquals(result, "Line 1\n\nLine 2\n\nLine 3");
});

Deno.test("optimizeSkillContent - preserve double newlines", () => {
  const content = "Line 1\n\nLine 2\n\nLine 3";
  const result = optimizeSkillContent(content);

  assertEquals(result, "Line 1\n\nLine 2\n\nLine 3");
});

Deno.test("optimizeSkillContent - preserve single newlines", () => {
  const content = "Line 1\nLine 2\nLine 3";
  const result = optimizeSkillContent(content);

  assertEquals(result, "Line 1\nLine 2\nLine 3");
});

Deno.test("optimizeSkillContent - handle empty string", () => {
  const content = "";
  const result = optimizeSkillContent(content);

  assertEquals(result, "");
});

Deno.test("optimizeSkillContent - complex content", () => {
  const content = `# Heading

Paragraph 1


Paragraph 2



Paragraph 3`;

  const result = optimizeSkillContent(content);

  assertEquals(result, "# Heading\n\nParagraph 1\n\nParagraph 2\n\nParagraph 3");
});

Deno.test("optimizeSkillContent - preserve code blocks", () => {
  const content = "```javascript  \nconst x = 1;   \n```  ";
  const result = optimizeSkillContent(content);

  assertEquals(result, "```javascript\nconst x = 1;\n```");
});

Deno.test("optimizeSkillContent - mixed whitespace", () => {
  const content = "Line 1\t\n\n\nLine 2   \n\n\n\nLine 3  ";
  const result = optimizeSkillContent(content);

  assertEquals(result, "Line 1\n\nLine 2\n\nLine 3");
});
