/**
 * Test utilities for Agent Skill Builder
 * Provides helper functions for setting up and tearing down test environments
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "./utils.ts";

/**
 * Create a temporary test directory
 * Returns the path to the temporary directory
 */
export async function createTempDir(prefix = "test-"): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix });
  return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await Deno.remove(dir, { recursive: true });
  } catch (error) {
    // Ignore errors if directory doesn't exist
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Copy test fixture to a temporary location
 * Returns the path to the copied fixture
 */
export async function copyFixture(fixtureName: string, tempDir: string): Promise<string> {
  const fixtureDir = join(Deno.cwd(), "src", "test_fixtures", fixtureName);
  const targetDir = join(tempDir, fixtureName);

  await ensureDir(targetDir);

  // Copy all files from fixture to target
  for await (const entry of Deno.readDir(fixtureDir)) {
    const srcPath = join(fixtureDir, entry.name);
    const destPath = join(targetDir, entry.name);

    if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    } else if (entry.isDirectory) {
      await copyDirRecursive(srcPath, destPath);
    }
  }

  return targetDir;
}

/**
 * Copy directory recursively (helper for copyFixture)
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await ensureDir(dest);

  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory) {
      await copyDirRecursive(srcPath, destPath);
    } else {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Create a test SKILL.md file with custom content
 */
export async function createTestSkill(
  dir: string,
  metadata: Record<string, unknown>,
  content: string,
): Promise<string> {
  await ensureDir(dir);

  const yamlLines = ["---"];
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      yamlLines.push(`${key}:`);
      value.forEach((item) => yamlLines.push(`  - ${item}`));
    } else {
      yamlLines.push(`${key}: ${value}`);
    }
  }
  yamlLines.push("---");

  const fullContent = `${yamlLines.join("\n")}\n\n${content}`;
  const skillPath = join(dir, "SKILL.md");
  await Deno.writeTextFile(skillPath, fullContent);

  return skillPath;
}

/**
 * Get path to test fixture
 */
export function getFixturePath(fixtureName: string): string {
  return join(Deno.cwd(), "src", "test_fixtures", fixtureName);
}

/**
 * Assert that a file exists
 */
export async function assertFileExists(path: string): Promise<void> {
  try {
    await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Expected file to exist: ${path}`);
    }
    throw error;
  }
}

/**
 * Assert that a file does not exist
 */
export async function assertFileNotExists(path: string): Promise<void> {
  try {
    await Deno.stat(path);
    throw new Error(`Expected file to not exist: ${path}`);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
}

/**
 * Read and parse a SKILL.md file for testing
 */
export async function readTestSkill(path: string): Promise<{
  metadata: Record<string, unknown>;
  content: string;
}> {
  const text = await Deno.readTextFile(path);
  const lines = text.split("\n");

  const startIndex = lines.findIndex((line) => line.trim() === "---");
  const endIndex = lines.slice(startIndex + 1).findIndex((line) => line.trim() === "---");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Invalid SKILL.md format");
  }

  const yamlLines = lines.slice(startIndex + 1, startIndex + 1 + endIndex);
  const contentLines = lines.slice(startIndex + endIndex + 2);

  // Simple YAML parser for testing (only supports basic key-value pairs)
  const metadata: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of yamlLines) {
    if (line.trim().startsWith("- ")) {
      currentArray.push(line.trim().slice(2));
    } else if (line.includes(":")) {
      if (currentKey && currentArray.length > 0) {
        metadata[currentKey] = currentArray;
        currentArray = [];
      }
      const [key, ...valueParts] = line.split(":");
      currentKey = key.trim();
      const value = valueParts.join(":").trim();
      if (value) {
        metadata[currentKey] = value;
        currentKey = null;
      }
    }
  }

  if (currentKey && currentArray.length > 0) {
    metadata[currentKey] = currentArray;
  }

  return {
    metadata,
    content: contentLines.join("\n"),
  };
}
