/**
 * Tests for validator.ts
 * Tests SKILL.md validation logic
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  parseSkillFile,
  validateMetadata,
  validateSkillDir,
  validateSkillFile,
} from "./validator.ts";
import { LIMITS } from "./types.ts";
import { createTempDir, createTestSkill, getFixturePath } from "./test_utils.ts";

Deno.test("validateMetadata - valid minimal metadata", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 0, "Should have no validation errors");
});

Deno.test("validateMetadata - valid metadata with optional fields", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    "allowed-tools": ["Read", "Write"],
    model: "sonnet",
    skills: ["other-skill"],
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 0, "Should have no validation errors");
});

Deno.test("validateMetadata - missing name field", () => {
  const metadata = {
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Required field is missing");
});

Deno.test("validateMetadata - missing description field", () => {
  const metadata = {
    name: "test-skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "description");
  assertEquals(errors[0].message, "Required field is missing");
});

Deno.test("validateMetadata - name not a string", () => {
  const metadata = {
    name: 123,
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Must be a string");
});

Deno.test("validateMetadata - description not a string", () => {
  const metadata = {
    name: "test-skill",
    description: 123,
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "description");
  assertEquals(errors[0].message, "Must be a string");
});

Deno.test("validateMetadata - name too long", () => {
  const longName = "a".repeat(LIMITS.name + 1);
  const metadata = {
    name: longName,
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(
    errors[0].message,
    `Must be ${LIMITS.name} characters or less (got ${longName.length})`,
  );
});

Deno.test("validateMetadata - description too long", () => {
  const longDescription = "a".repeat(LIMITS.description + 1);
  const metadata = {
    name: "test-skill",
    description: longDescription,
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "description");
  assertEquals(
    errors[0].message,
    `Must be ${LIMITS.description} characters or less (got ${longDescription.length})`,
  );
});

Deno.test("validateMetadata - name with uppercase letters", () => {
  const metadata = {
    name: "Test-Skill",
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Must contain only lowercase letters, numbers, and hyphens");
});

Deno.test("validateMetadata - name with underscores", () => {
  const metadata = {
    name: "test_skill",
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Must contain only lowercase letters, numbers, and hyphens");
});

Deno.test("validateMetadata - name with spaces", () => {
  const metadata = {
    name: "test skill",
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Must contain only lowercase letters, numbers, and hyphens");
});

Deno.test("validateMetadata - name with newlines", () => {
  const metadata = {
    name: "test-skill\nwith-newline",
    description: "A test skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 2);
  assertEquals(errors[0].field, "name");
  assertEquals(errors[0].message, "Must be a single line (no newlines)");
  assertEquals(errors[1].field, "name");
  assertEquals(errors[1].message, "Must contain only lowercase letters, numbers, and hyphens");
});

Deno.test("validateMetadata - description with newlines", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill\nwith newline",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "description");
  assertEquals(errors[0].message, "Must be a single line (no newlines)");
});

Deno.test("validateMetadata - allowed-tools not an array", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    "allowed-tools": "Read",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "allowed-tools");
  assertEquals(errors[0].message, "Must be an array");
});

Deno.test("validateMetadata - allowed-tools with non-string items", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    "allowed-tools": ["Read", 123, "Write"],
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "allowed-tools");
  assertEquals(errors[0].message, "Item at index 1 must be a string");
});

Deno.test("validateMetadata - model not a string", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    model: 123,
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "model");
  assertEquals(errors[0].message, "Must be a string");
});

Deno.test("validateMetadata - skills not an array", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    skills: "other-skill",
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "skills");
  assertEquals(errors[0].message, "Must be an array");
});

Deno.test("validateMetadata - skills with non-string items", () => {
  const metadata = {
    name: "test-skill",
    description: "A test skill",
    skills: ["skill1", 123],
  };

  const errors = validateMetadata(metadata);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].field, "skills");
  assertEquals(errors[0].message, "Item at index 1 must be a string");
});

Deno.test("parseSkillFile - valid skill file", async () => {
  const fixturePath = join(getFixturePath("valid-skill"), "SKILL.md");
  const skill = await parseSkillFile(fixturePath);

  assertExists(skill);
  assertEquals(skill.metadata.name, "test-skill");
  assertEquals(skill.metadata.description, "A test skill for unit testing");
  assertEquals(skill.metadata["allowed-tools"], ["Read", "Write"]);
  assertEquals(skill.metadata.model, "sonnet");
  assertExists(skill.content);
  assertExists(skill.raw);
});

Deno.test("parseSkillFile - minimal skill file", async () => {
  const fixturePath = join(getFixturePath("valid-skill-minimal"), "SKILL.md");
  const skill = await parseSkillFile(fixturePath);

  assertExists(skill);
  assertEquals(skill.metadata.name, "minimal-skill");
  assertEquals(skill.metadata.description, "A minimal valid skill with only required fields");
  assertEquals(skill.metadata["allowed-tools"], undefined);
  assertEquals(skill.metadata.model, undefined);
});

Deno.test("parseSkillFile - file not found", async () => {
  const fixturePath = "/nonexistent/SKILL.md";

  try {
    await parseSkillFile(fixturePath);
    throw new Error("Should have thrown an error");
  } catch (error) {
    assertEquals(error.message, `File not found: ${fixturePath}`);
  }
});

Deno.test("validateSkillFile - valid skill", async () => {
  const fixturePath = join(getFixturePath("valid-skill"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateSkillFile - missing name field", async () => {
  const fixturePath = join(getFixturePath("invalid-no-name"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "name");
});

Deno.test("validateSkillFile - missing description field", async () => {
  const fixturePath = join(getFixturePath("invalid-no-description"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "description");
});

Deno.test("validateSkillFile - invalid name format", async () => {
  const fixturePath = join(getFixturePath("invalid-name-format"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "name");
  assertEquals(
    result.errors[0].message,
    "Must contain only lowercase letters, numbers, and hyphens",
  );
});

Deno.test("validateSkillFile - name too long", async () => {
  const fixturePath = join(getFixturePath("invalid-name-too-long"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "name");
});

Deno.test("validateSkillFile - description too long", async () => {
  const fixturePath = join(getFixturePath("invalid-description-too-long"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "description");
});

Deno.test("validateSkillFile - no frontmatter", async () => {
  const fixturePath = join(getFixturePath("invalid-no-frontmatter"), "SKILL.md");
  const result = await validateSkillFile(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "file");
  assertEquals(result.errors[0].message, "SKILL.md must start with YAML frontmatter (---)");
});

Deno.test("validateSkillDir - valid directory", async () => {
  const fixturePath = getFixturePath("valid-skill");
  const result = await validateSkillDir(fixturePath);

  assertEquals(result.valid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("validateSkillDir - directory without SKILL.md", async () => {
  const tempDir = await createTempDir();

  try {
    const result = await validateSkillDir(tempDir);

    assertEquals(result.valid, false);
    assertEquals(result.errors.length, 1);
    assertEquals(result.errors[0].field, "SKILL.md");
    assertEquals(result.errors[0].message, "File not found in directory");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("validateSkillDir - path is not a directory", async () => {
  const tempDir = await createTempDir();
  const filePath = join(tempDir, "test.txt");
  await Deno.writeTextFile(filePath, "test");

  try {
    const result = await validateSkillDir(filePath);

    assertEquals(result.valid, false);
    assertEquals(result.errors.length, 1);
    assertEquals(result.errors[0].field, "directory");
    assertEquals(result.errors[0].message, "Path is not a directory");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("validateSkillDir - directory does not exist", async () => {
  const result = await validateSkillDir("/nonexistent/directory");

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "directory");
});

Deno.test("validateSkillDir - invalid skill in directory", async () => {
  const fixturePath = getFixturePath("invalid-no-name");
  const result = await validateSkillDir(fixturePath);

  assertEquals(result.valid, false);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].field, "name");
});
