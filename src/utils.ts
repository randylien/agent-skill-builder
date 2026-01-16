/**
 * Utility functions for Agent Skill Builder
 */

import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";
import { join, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import { expandGlob } from "https://deno.land/std@0.224.0/fs/mod.ts";

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * Expand tilde (~) in file paths to home directory
 */
export function expandHome(filepath: string): string {
  if (filepath.startsWith("~/")) {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
    if (!home) {
      throw new Error("Could not determine home directory");
    }
    return join(home, filepath.slice(2));
  }
  return filepath;
}

/**
 * Parse YAML frontmatter from markdown file
 * Returns { metadata, content, raw }
 */
export function parseFrontmatter(text: string): {
  metadata: Record<string, unknown>;
  content: string;
  raw: string;
} {
  const lines = text.split("\n");

  // Check if file starts with ---
  if (lines[0]?.trim() !== "---") {
    throw new Error("SKILL.md must start with YAML frontmatter (---)");
  }

  // Find the closing ---
  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    throw new Error("YAML frontmatter must end with ---");
  }

  const yamlLines = lines.slice(1, endIndex + 1);
  const contentLines = lines.slice(endIndex + 2);

  const yamlText = yamlLines.join("\n");
  const content = contentLines.join("\n");

  let metadata: Record<string, unknown>;
  try {
    metadata = parseYaml(yamlText) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid YAML syntax: ${getErrorMessage(error)}`);
  }

  return {
    metadata,
    content,
    raw: text,
  };
}

/**
 * Check if a file or directory exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

/**
 * Create directory recursively if it doesn't exist
 */
export async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

/**
 * Copy directory recursively
 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);

  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory) {
      await copyDir(srcPath, destPath);
    } else {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Read text file with error handling
 */
export async function readTextFile(path: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File not found: ${path}`);
    }
    throw error;
  }
}

/**
 * Find SKILL.md file in directory
 */
export async function findSkillFile(dir: string): Promise<string | null> {
  const skillPath = join(dir, "SKILL.md");
  if (await exists(skillPath)) {
    return skillPath;
  }
  return null;
}

/**
 * List all deployed skills in a target directory
 */
export async function listSkills(targetDir: string): Promise<string[]> {
  const expandedPath = expandHome(targetDir);

  if (!(await exists(expandedPath))) {
    return [];
  }

  const skills: string[] = [];
  for await (const entry of Deno.readDir(expandedPath)) {
    if (entry.isDirectory) {
      const skillFile = await findSkillFile(join(expandedPath, entry.name));
      if (skillFile) {
        skills.push(entry.name);
      }
    }
  }

  return skills.sort();
}

/**
 * Format validation errors for display
 */
export function formatErrors(errors: Array<{ field: string; message: string }>): string {
  return errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
}

/**
 * Discover all skill directories in a given parent directory
 * Returns array of skill directory paths that contain SKILL.md
 */
export async function discoverSkills(parentDir: string): Promise<string[]> {
  const resolvedPath = resolve(parentDir);

  if (!(await exists(resolvedPath))) {
    throw new Error(`Directory not found: ${parentDir}`);
  }

  const skills: string[] = [];
  for await (const entry of Deno.readDir(resolvedPath)) {
    if (entry.isDirectory) {
      const skillDir = join(resolvedPath, entry.name);
      const skillFile = await findSkillFile(skillDir);
      if (skillFile) {
        skills.push(skillDir);
      }
    }
  }

  return skills.sort();
}
