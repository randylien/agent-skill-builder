/**
 * SKILL.md validator
 * Validates skill files according to Claude Code and OpenAI Codex specifications
 */

import type { SkillFile, SkillMetadata, ValidationError, ValidationResult } from "./types.ts";
import { LIMITS } from "./types.ts";
import { getErrorMessage, parseFrontmatter, readTextFile } from "./utils.ts";

/**
 * Validate skill metadata against format requirements
 */
export function validateMetadata(metadata: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required field: name
  if (!metadata.name) {
    errors.push({ field: "name", message: "Required field is missing" });
  } else if (typeof metadata.name !== "string") {
    errors.push({ field: "name", message: "Must be a string" });
  } else {
    // Check character limit
    if (metadata.name.length > LIMITS.name) {
      errors.push({
        field: "name",
        message: `Must be ${LIMITS.name} characters or less (got ${metadata.name.length})`,
      });
    }

    // Check for newlines (single line only)
    if (metadata.name.includes("\n")) {
      errors.push({ field: "name", message: "Must be a single line (no newlines)" });
    }

    // Check format (lowercase letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(metadata.name)) {
      errors.push({
        field: "name",
        message: "Must contain only lowercase letters, numbers, and hyphens",
      });
    }
  }

  // Required field: description
  if (!metadata.description) {
    errors.push({ field: "description", message: "Required field is missing" });
  } else if (typeof metadata.description !== "string") {
    errors.push({ field: "description", message: "Must be a string" });
  } else {
    // Check character limit
    if (metadata.description.length > LIMITS.description) {
      errors.push({
        field: "description",
        message:
          `Must be ${LIMITS.description} characters or less (got ${metadata.description.length})`,
      });
    }

    // Check for newlines (single line only)
    if (metadata.description.includes("\n")) {
      errors.push({ field: "description", message: "Must be a single line (no newlines)" });
    }
  }

  // Optional field: allowed-tools (array of strings)
  if (metadata["allowed-tools"] !== undefined) {
    if (!Array.isArray(metadata["allowed-tools"])) {
      errors.push({ field: "allowed-tools", message: "Must be an array" });
    } else {
      const tools = metadata["allowed-tools"] as unknown[];
      tools.forEach((tool, index) => {
        if (typeof tool !== "string") {
          errors.push({
            field: "allowed-tools",
            message: `Item at index ${index} must be a string`,
          });
        }
      });
    }
  }

  // Optional field: model (string)
  if (metadata.model !== undefined && typeof metadata.model !== "string") {
    errors.push({ field: "model", message: "Must be a string" });
  }

  // Optional field: skills (array of strings)
  if (metadata.skills !== undefined) {
    if (!Array.isArray(metadata.skills)) {
      errors.push({ field: "skills", message: "Must be an array" });
    } else {
      const skills = metadata.skills as unknown[];
      skills.forEach((skill, index) => {
        if (typeof skill !== "string") {
          errors.push({ field: "skills", message: `Item at index ${index} must be a string` });
        }
      });
    }
  }

  return errors;
}

/**
 * Parse and validate a SKILL.md file
 */
export async function parseSkillFile(filepath: string): Promise<SkillFile> {
  const text = await readTextFile(filepath);
  const { metadata, content, raw } = parseFrontmatter(text);

  return {
    metadata: metadata as unknown as SkillMetadata,
    content,
    raw,
  };
}

/**
 * Validate a SKILL.md file
 */
export async function validateSkillFile(filepath: string): Promise<ValidationResult> {
  try {
    const skill = await parseSkillFile(filepath);
    const errors = validateMetadata(skill.metadata as unknown as Record<string, unknown>);

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ field: "file", message: getErrorMessage(error) }],
    };
  }
}

/**
 * Validate a skill directory
 * Checks for SKILL.md file and validates its content
 */
export async function validateSkillDir(dirPath: string): Promise<ValidationResult> {
  try {
    // Check if directory exists
    const stat = await Deno.stat(dirPath);
    if (!stat.isDirectory) {
      return {
        valid: false,
        errors: [{ field: "directory", message: "Path is not a directory" }],
      };
    }

    // Check for SKILL.md file
    const skillPath = `${dirPath}/SKILL.md`;
    try {
      await Deno.stat(skillPath);
    } catch {
      return {
        valid: false,
        errors: [{ field: "SKILL.md", message: "File not found in directory" }],
      };
    }

    // Validate SKILL.md content
    return await validateSkillFile(skillPath);
  } catch (error) {
    return {
      valid: false,
      errors: [{ field: "directory", message: getErrorMessage(error) }],
    };
  }
}
