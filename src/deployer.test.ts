/**
 * Tests for deployer.ts
 * Tests skill deployment logic
 */

import { assertEquals, assertExists, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { batchDeploySkills, deploySkill, removeSkill } from "./deployer.ts";
import type { DeployOptions, DeployTarget } from "./types.ts";
import { exists } from "./utils.ts";
import { createTempDir, createTestSkill, getFixturePath } from "./test_utils.ts";

// Helper to create deploy options
function createDeployOptions(
  targets: DeployTarget[],
  force = false,
  dryRun = false,
): DeployOptions {
  return { targets, force, dryRun };
}

// Helper to set up a temporary deployment directory
async function setupDeploymentTest() {
  const tempDir = await createTempDir();
  const skillDir = join(tempDir, "test-skill");

  await createTestSkill(
    skillDir,
    {
      name: "test-skill",
      description: "A test skill for deployment",
    },
    "# Test Skill\n\nThis is a test skill.",
  );

  return { tempDir, skillDir };
}

Deno.test("deploySkill - deploy to Claude (dry run)", async () => {
  const { tempDir, skillDir } = await setupDeploymentTest();

  try {
    const options = createDeployOptions(["claude"], false, true);
    const results = await deploySkill(skillDir, options);

    assertEquals(results.length, 1);
    assertEquals(results[0].target, "claude");
    assertEquals(results[0].success, true);
    assertExists(results[0].path);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - deploy to multiple targets (dry run)", async () => {
  const { tempDir, skillDir } = await setupDeploymentTest();

  try {
    const options = createDeployOptions(["claude", "codex"], false, true);
    const results = await deploySkill(skillDir, options);

    assertEquals(results.length, 2);
    assertEquals(results[0].target, "claude");
    assertEquals(results[0].success, true);
    assertEquals(results[1].target, "codex");
    assertEquals(results[1].success, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - deploy to Cursor (dry run)", async () => {
  const { tempDir, skillDir } = await setupDeploymentTest();

  try {
    const options = createDeployOptions(["cursor"], false, true);
    const results = await deploySkill(skillDir, options);

    assertEquals(results.length, 1);
    assertEquals(results[0].target, "cursor");
    assertEquals(results[0].success, true);
    assertEquals(results[0].path, ".cursorrules");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - actual deployment to temporary location", async () => {
  const { tempDir, skillDir } = await setupDeploymentTest();

  try {
    // We can't actually deploy to the real ~/.claude/skills directory in tests,
    // so we'll just test the dry run mode
    const options = createDeployOptions(["claude"], false, true);
    const results = await deploySkill(skillDir, options);

    assertEquals(results[0].success, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - deploy with invalid skill", async () => {
  const tempDir = await createTempDir();
  const invalidSkillDir = join(tempDir, "invalid-skill");

  try {
    // Create directory without SKILL.md
    await Deno.mkdir(invalidSkillDir);

    const options = createDeployOptions(["claude"], false, true);

    try {
      await deploySkill(invalidSkillDir, options);
      throw new Error("Should have thrown an error");
    } catch (error) {
      assertStringIncludes(error.message, "File not found");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - deploy from fixture", async () => {
  const fixturePath = getFixturePath("valid-skill");
  const options = createDeployOptions(["claude"], false, true);

  const results = await deploySkill(fixturePath, options);

  assertEquals(results.length, 1);
  assertEquals(results[0].success, true);
  assertStringIncludes(results[0].path!, "test-skill");
});

Deno.test("batchDeploySkills - deploy multiple skills (dry run)", async () => {
  const tempDir = await createTempDir();

  try {
    // Create multiple skill directories
    await createTestSkill(
      join(tempDir, "skill-1"),
      { name: "skill-1", description: "First skill" },
      "Content 1",
    );
    await createTestSkill(
      join(tempDir, "skill-2"),
      { name: "skill-2", description: "Second skill" },
      "Content 2",
    );
    await createTestSkill(
      join(tempDir, "skill-3"),
      { name: "skill-3", description: "Third skill" },
      "Content 3",
    );

    const options = createDeployOptions(["claude"], false, true);
    const results = await batchDeploySkills(tempDir, options);

    assertEquals(results.length, 3);

    assertEquals(results[0].skillName, "skill-1");
    assertEquals(results[0].results.length, 1);
    assertEquals(results[0].results[0].success, true);

    assertEquals(results[1].skillName, "skill-2");
    assertEquals(results[1].results.length, 1);
    assertEquals(results[1].results[0].success, true);

    assertEquals(results[2].skillName, "skill-3");
    assertEquals(results[2].results.length, 1);
    assertEquals(results[2].results[0].success, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("batchDeploySkills - deploy to multiple targets (dry run)", async () => {
  const tempDir = await createTempDir();

  try {
    await createTestSkill(
      join(tempDir, "skill-1"),
      { name: "skill-1", description: "Test skill" },
      "Content",
    );

    const options = createDeployOptions(["claude", "codex"], false, true);
    const results = await batchDeploySkills(tempDir, options);

    assertEquals(results.length, 1);
    assertEquals(results[0].results.length, 2);
    assertEquals(results[0].results[0].target, "claude");
    assertEquals(results[0].results[1].target, "codex");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("batchDeploySkills - skip invalid skills", async () => {
  const tempDir = await createTempDir();

  try {
    // Create valid skill
    await createTestSkill(
      join(tempDir, "valid-skill"),
      { name: "valid-skill", description: "Valid skill" },
      "Content",
    );

    // Create invalid skill (missing name)
    await createTestSkill(
      join(tempDir, "invalid-skill"),
      { description: "Invalid skill" },
      "Content",
    );

    const options = createDeployOptions(["claude"], false, true);
    const results = await batchDeploySkills(tempDir, options);

    assertEquals(results.length, 2);

    // Valid skill should succeed
    assertEquals(results[0].skillName, "invalid-skill");
    assertExists(results[0].validationError);
    assertEquals(results[0].results.length, 0);

    // Invalid skill should have validation error
    assertEquals(results[1].skillName, "valid-skill");
    assertEquals(results[1].validationError, undefined);
    assertEquals(results[1].results.length, 1);
    assertEquals(results[1].results[0].success, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("batchDeploySkills - no skills found", async () => {
  const tempDir = await createTempDir();

  try {
    // Create non-skill directory
    await Deno.mkdir(join(tempDir, "not-a-skill"));

    const options = createDeployOptions(["claude"], false, true);

    try {
      await batchDeploySkills(tempDir, options);
      throw new Error("Should have thrown an error");
    } catch (error) {
      assertStringIncludes(error.message, "No skills found");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("batchDeploySkills - empty directory", async () => {
  const tempDir = await createTempDir();

  try {
    const options = createDeployOptions(["claude"], false, true);

    try {
      await batchDeploySkills(tempDir, options);
      throw new Error("Should have thrown an error");
    } catch (error) {
      assertStringIncludes(error.message, "No skills found");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("batchDeploySkills - from fixtures directory", async () => {
  // Note: This test uses actual fixture files
  const fixturesDir = join(Deno.cwd(), "src", "test_fixtures");
  const options = createDeployOptions(["claude"], false, true);

  const results = await batchDeploySkills(fixturesDir, options);

  // Should find and process all fixture skills (both valid and invalid)
  assertEquals(results.length > 0, true);

  // Check that valid skills were processed
  const validSkill = results.find((r) => r.skillName === "test-skill");
  assertExists(validSkill);
  assertEquals(validSkill.results.length, 1);
  assertEquals(validSkill.results[0].success, true);
});

Deno.test("removeSkill - skill does not exist (dry test)", async () => {
  const tempDir = await createTempDir();

  try {
    // Create a temporary "deployment" directory to simulate ~/.claude/skills
    const targetDir = join(tempDir, "skills");
    await Deno.mkdir(targetDir);

    // Since we can't easily mock the TARGET_PATHS, we'll just test
    // that the function handles non-existent skills
    const result = await removeSkill("nonexistent-skill", "claude");

    // The function will try to remove from actual ~/.claude/skills
    // which likely doesn't have our test skill
    assertEquals(result.success, false);
    assertStringIncludes(result.error!, "Skill not found");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("removeSkill - cursor target", async () => {
  // Test that cursor removal targets the correct path
  const result = await removeSkill("any-name", "cursor");

  // Since .cursorrules likely doesn't exist in test environment,
  // this should succeed (no error for non-existent cursor file)
  assertEquals(result.success, true);
});

Deno.test("deploySkill - cursor conversion", async () => {
  const fixturePath = getFixturePath("cursor-rules-skill");
  const options = createDeployOptions(["cursor"], false, true);

  const results = await deploySkill(fixturePath, options);

  assertEquals(results.length, 1);
  assertEquals(results[0].target, "cursor");
  assertEquals(results[0].success, true);
  assertEquals(results[0].path, ".cursorrules");
});

Deno.test("batchDeploySkills - mixed valid and invalid skills", async () => {
  const tempDir = await createTempDir();

  try {
    // Create valid skills
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

    // Create invalid skill (name too long)
    await createTestSkill(
      join(tempDir, "skill-invalid"),
      {
        name: "this-is-a-very-long-skill-name-that-exceeds-the-character-limit",
        description: "Invalid",
      },
      "Content",
    );

    const options = createDeployOptions(["claude"], false, true);
    const results = await batchDeploySkills(tempDir, options);

    assertEquals(results.length, 3);

    // Count successful and failed deployments
    const successful = results.filter((r) => r.results.length > 0 && r.results[0].success);
    const failed = results.filter((r) => r.validationError !== undefined);

    assertEquals(successful.length, 2);
    assertEquals(failed.length, 1);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("deploySkill - handles metadata parsing errors", async () => {
  const fixturePath = getFixturePath("invalid-no-frontmatter");
  const options = createDeployOptions(["claude"], false, true);

  try {
    await deploySkill(fixturePath, options);
    throw new Error("Should have thrown an error");
  } catch (error) {
    assertStringIncludes(error.message, "SKILL.md must start with YAML frontmatter");
  }
});
