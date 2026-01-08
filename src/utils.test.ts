/**
 * Tests for utils.ts
 * Tests utility functions
 */

import { assertEquals, assertExists, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  copyDir,
  discoverSkills,
  ensureDir,
  exists,
  expandHome,
  findSkillFile,
  formatErrors,
  listSkills,
  parseFrontmatter,
  readTextFile,
} from "./utils.ts";
import { createTempDir, createTestSkill, getFixturePath } from "./test_utils.ts";

Deno.test("expandHome - expand tilde in path", () => {
  const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  assertExists(home);

  const result = expandHome("~/test/path");
  assertEquals(result, join(home, "test/path"));
});

Deno.test("expandHome - path without tilde", () => {
  const path = "/absolute/path";
  const result = expandHome(path);
  assertEquals(result, path);
});

Deno.test("expandHome - relative path without tilde", () => {
  const path = "relative/path";
  const result = expandHome(path);
  assertEquals(result, path);
});

Deno.test("parseFrontmatter - valid YAML frontmatter", () => {
  const text = `---
name: test-skill
description: A test skill
---

# Content

This is the content.`;

  const result = parseFrontmatter(text);

  assertEquals(result.metadata.name, "test-skill");
  assertEquals(result.metadata.description, "A test skill");
  assertEquals(result.content.trim(), "# Content\n\nThis is the content.");
  assertEquals(result.raw, text);
});

Deno.test("parseFrontmatter - with array values", () => {
  const text = `---
name: test-skill
description: A test skill
allowed-tools:
  - Read
  - Write
---

Content here.`;

  const result = parseFrontmatter(text);

  assertEquals(result.metadata.name, "test-skill");
  assertEquals(result.metadata["allowed-tools"], ["Read", "Write"]);
});

Deno.test("parseFrontmatter - missing opening delimiter", () => {
  const text = `name: test-skill
---

Content`;

  assertRejects(
    () => Promise.resolve(parseFrontmatter(text)),
    Error,
    "SKILL.md must start with YAML frontmatter (---)",
  );
});

Deno.test("parseFrontmatter - missing closing delimiter", () => {
  const text = `---
name: test-skill

Content`;

  assertRejects(
    () => Promise.resolve(parseFrontmatter(text)),
    Error,
    "YAML frontmatter must end with ---",
  );
});

Deno.test("parseFrontmatter - invalid YAML syntax", () => {
  const text = `---
name: test-skill
invalid: [unclosed array
---

Content`;

  assertRejects(
    () => Promise.resolve(parseFrontmatter(text)),
    Error,
    "Invalid YAML syntax",
  );
});

Deno.test("exists - file exists", async () => {
  const tempDir = await createTempDir();
  const testFile = join(tempDir, "test.txt");
  await Deno.writeTextFile(testFile, "test");

  try {
    const result = await exists(testFile);
    assertEquals(result, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("exists - file does not exist", async () => {
  const result = await exists("/nonexistent/file.txt");
  assertEquals(result, false);
});

Deno.test("exists - directory exists", async () => {
  const tempDir = await createTempDir();

  try {
    const result = await exists(tempDir);
    assertEquals(result, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ensureDir - create new directory", async () => {
  const tempDir = await createTempDir();
  const newDir = join(tempDir, "subdir");

  try {
    await ensureDir(newDir);
    const result = await exists(newDir);
    assertEquals(result, true);

    const stat = await Deno.stat(newDir);
    assertEquals(stat.isDirectory, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ensureDir - create nested directories", async () => {
  const tempDir = await createTempDir();
  const nestedDir = join(tempDir, "a", "b", "c");

  try {
    await ensureDir(nestedDir);
    const result = await exists(nestedDir);
    assertEquals(result, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ensureDir - directory already exists", async () => {
  const tempDir = await createTempDir();

  try {
    // Should not throw error
    await ensureDir(tempDir);
    const result = await exists(tempDir);
    assertEquals(result, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("copyDir - copy directory with files", async () => {
  const tempDir = await createTempDir();
  const srcDir = join(tempDir, "src");
  const destDir = join(tempDir, "dest");

  try {
    // Create source directory with files
    await ensureDir(srcDir);
    await Deno.writeTextFile(join(srcDir, "file1.txt"), "content1");
    await Deno.writeTextFile(join(srcDir, "file2.txt"), "content2");

    // Copy directory
    await copyDir(srcDir, destDir);

    // Verify files were copied
    assertEquals(await exists(join(destDir, "file1.txt")), true);
    assertEquals(await exists(join(destDir, "file2.txt")), true);

    const content1 = await Deno.readTextFile(join(destDir, "file1.txt"));
    assertEquals(content1, "content1");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("copyDir - copy nested directories", async () => {
  const tempDir = await createTempDir();
  const srcDir = join(tempDir, "src");
  const destDir = join(tempDir, "dest");

  try {
    // Create nested directory structure
    await ensureDir(join(srcDir, "subdir"));
    await Deno.writeTextFile(join(srcDir, "file.txt"), "root");
    await Deno.writeTextFile(join(srcDir, "subdir", "nested.txt"), "nested");

    // Copy directory
    await copyDir(srcDir, destDir);

    // Verify structure was copied
    assertEquals(await exists(join(destDir, "file.txt")), true);
    assertEquals(await exists(join(destDir, "subdir", "nested.txt")), true);

    const content = await Deno.readTextFile(join(destDir, "subdir", "nested.txt"));
    assertEquals(content, "nested");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("readTextFile - read existing file", async () => {
  const tempDir = await createTempDir();
  const testFile = join(tempDir, "test.txt");
  const expectedContent = "Hello, World!";

  try {
    await Deno.writeTextFile(testFile, expectedContent);
    const content = await readTextFile(testFile);
    assertEquals(content, expectedContent);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("readTextFile - file not found", async () => {
  await assertRejects(
    async () => await readTextFile("/nonexistent/file.txt"),
    Error,
    "File not found: /nonexistent/file.txt",
  );
});

Deno.test("findSkillFile - find SKILL.md in directory", async () => {
  const tempDir = await createTempDir();

  try {
    await Deno.writeTextFile(join(tempDir, "SKILL.md"), "test content");

    const result = await findSkillFile(tempDir);
    assertEquals(result, join(tempDir, "SKILL.md"));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("findSkillFile - SKILL.md not found", async () => {
  const tempDir = await createTempDir();

  try {
    const result = await findSkillFile(tempDir);
    assertEquals(result, null);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("listSkills - list skills in directory", async () => {
  const tempDir = await createTempDir();

  try {
    // Create skill directories
    await createTestSkill(
      join(tempDir, "skill1"),
      { name: "skill1", description: "First skill" },
      "Content",
    );
    await createTestSkill(
      join(tempDir, "skill2"),
      { name: "skill2", description: "Second skill" },
      "Content",
    );
    // Create non-skill directory
    await ensureDir(join(tempDir, "not-a-skill"));

    const skills = await listSkills(tempDir);

    assertEquals(skills.length, 2);
    assertEquals(skills[0], "skill1");
    assertEquals(skills[1], "skill2");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("listSkills - empty directory", async () => {
  const tempDir = await createTempDir();

  try {
    const skills = await listSkills(tempDir);
    assertEquals(skills.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("listSkills - directory does not exist", async () => {
  const skills = await listSkills("/nonexistent/directory");
  assertEquals(skills.length, 0);
});

Deno.test("formatErrors - format multiple errors", () => {
  const errors = [
    { field: "name", message: "Required field is missing" },
    { field: "description", message: "Must be a string" },
  ];

  const result = formatErrors(errors);
  assertEquals(result, "  - name: Required field is missing\n  - description: Must be a string");
});

Deno.test("formatErrors - single error", () => {
  const errors = [
    { field: "name", message: "Required field is missing" },
  ];

  const result = formatErrors(errors);
  assertEquals(result, "  - name: Required field is missing");
});

Deno.test("formatErrors - empty array", () => {
  const errors: Array<{ field: string; message: string }> = [];
  const result = formatErrors(errors);
  assertEquals(result, "");
});

Deno.test("discoverSkills - discover multiple skills", async () => {
  const tempDir = await createTempDir();

  try {
    // Create multiple skill directories
    await createTestSkill(
      join(tempDir, "skill-a"),
      { name: "skill-a", description: "Skill A" },
      "Content A",
    );
    await createTestSkill(
      join(tempDir, "skill-b"),
      { name: "skill-b", description: "Skill B" },
      "Content B",
    );
    await createTestSkill(
      join(tempDir, "skill-c"),
      { name: "skill-c", description: "Skill C" },
      "Content C",
    );

    // Create non-skill directory
    await ensureDir(join(tempDir, "not-a-skill"));

    const skills = await discoverSkills(tempDir);

    assertEquals(skills.length, 3);
    assertEquals(skills[0], join(tempDir, "skill-a"));
    assertEquals(skills[1], join(tempDir, "skill-b"));
    assertEquals(skills[2], join(tempDir, "skill-c"));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("discoverSkills - no skills found", async () => {
  const tempDir = await createTempDir();

  try {
    // Create non-skill directories
    await ensureDir(join(tempDir, "dir1"));
    await ensureDir(join(tempDir, "dir2"));

    const skills = await discoverSkills(tempDir);
    assertEquals(skills.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("discoverSkills - directory does not exist", async () => {
  await assertRejects(
    async () => await discoverSkills("/nonexistent/directory"),
    Error,
    "Directory not found",
  );
});

Deno.test("discoverSkills - sorted alphabetically", async () => {
  const tempDir = await createTempDir();

  try {
    // Create skills in non-alphabetical order
    await createTestSkill(
      join(tempDir, "zebra"),
      { name: "zebra", description: "Zebra skill" },
      "Content",
    );
    await createTestSkill(
      join(tempDir, "apple"),
      { name: "apple", description: "Apple skill" },
      "Content",
    );
    await createTestSkill(
      join(tempDir, "mango"),
      { name: "mango", description: "Mango skill" },
      "Content",
    );

    const skills = await discoverSkills(tempDir);

    assertEquals(skills.length, 3);
    assertEquals(skills[0], join(tempDir, "apple"));
    assertEquals(skills[1], join(tempDir, "mango"));
    assertEquals(skills[2], join(tempDir, "zebra"));
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
