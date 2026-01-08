/**
 * Skill deployment logic
 * Handles copying skills to target directories
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { DeployOptions, DeployResult, DeployTarget } from "./types.ts";
import { TARGET_PATHS } from "./types.ts";
import { copyDir, ensureDir, exists, expandHome, readTextFile } from "./utils.ts";
import { parseSkillFile } from "./validator.ts";
import { convertToCursorRules } from "./converter.ts";

/**
 * Get target directory path for deployment
 */
function getTargetPath(target: DeployTarget, isUserLevel: boolean): string {
  switch (target) {
    case "claude":
      return isUserLevel ? TARGET_PATHS.claude.user : TARGET_PATHS.claude.project;
    case "codex":
      return isUserLevel ? TARGET_PATHS.codex.user : TARGET_PATHS.codex.project;
    case "cursor":
      return TARGET_PATHS.cursor.project; // Cursor only has project-level
    default:
      throw new Error(`Unknown target: ${target}`);
  }
}

/**
 * Deploy skill to Claude Code or OpenAI Codex
 * Simply copies the skill directory to the target location
 */
async function deployToClaudeOrCodex(
  skillDir: string,
  target: DeployTarget,
  skillName: string,
  options: DeployOptions,
): Promise<DeployResult> {
  try {
    // Determine target path (default to user-level)
    const targetBase = getTargetPath(target, true);
    const expandedBase = expandHome(targetBase);
    const targetPath = join(expandedBase, skillName);

    // Check if skill already exists
    if (await exists(targetPath)) {
      if (!options.force) {
        return {
          target,
          success: false,
          error: `Skill already exists at ${targetPath}. Use --force to overwrite.`,
        };
      }

      // Remove existing skill
      if (!options.dryRun) {
        await Deno.remove(targetPath, { recursive: true });
      }
    }

    // Create target directory
    if (!options.dryRun) {
      await ensureDir(expandedBase);
      await copyDir(skillDir, targetPath);
    }

    return {
      target,
      success: true,
      path: targetPath,
    };
  } catch (error) {
    return {
      target,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deploy skill to Cursor
 * Converts SKILL.md to .cursorrules format
 */
async function deployToCursor(
  skillDir: string,
  options: DeployOptions,
): Promise<DeployResult> {
  try {
    const skillPath = join(skillDir, "SKILL.md");
    const skill = await parseSkillFile(skillPath);

    // Convert to Cursor rules format
    const cursorRules = convertToCursorRules(skill);

    // Cursor rules are project-level only
    const targetPath = TARGET_PATHS.cursor.project;

    // Check if .cursorrules already exists
    if (await exists(targetPath)) {
      if (!options.force) {
        return {
          target: "cursor",
          success: false,
          error: `${targetPath} already exists. Use --force to overwrite.`,
        };
      }
    }

    // Write .cursorrules file
    if (!options.dryRun) {
      await Deno.writeTextFile(targetPath, cursorRules);
    }

    return {
      target: "cursor",
      success: true,
      path: targetPath,
    };
  } catch (error) {
    return {
      target: "cursor",
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deploy skill to specified targets
 */
export async function deploySkill(
  skillDir: string,
  options: DeployOptions,
): Promise<DeployResult[]> {
  const results: DeployResult[] = [];

  // Get skill name from SKILL.md
  const skillPath = join(skillDir, "SKILL.md");
  const skill = await parseSkillFile(skillPath);
  const skillName = skill.metadata.name;

  for (const target of options.targets) {
    let result: DeployResult;

    if (target === "cursor") {
      result = await deployToCursor(skillDir, options);
    } else {
      result = await deployToClaudeOrCodex(skillDir, target, skillName, options);
    }

    results.push(result);
  }

  return results;
}

/**
 * Remove deployed skill from target
 */
export async function removeSkill(
  skillName: string,
  target: DeployTarget,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (target === "cursor") {
      const targetPath = TARGET_PATHS.cursor.project;
      if (await exists(targetPath)) {
        await Deno.remove(targetPath);
      }
    } else {
      const targetBase = getTargetPath(target, true);
      const expandedBase = expandHome(targetBase);
      const targetPath = join(expandedBase, skillName);

      if (await exists(targetPath)) {
        await Deno.remove(targetPath, { recursive: true });
      } else {
        return { success: false, error: `Skill not found: ${targetPath}` };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
