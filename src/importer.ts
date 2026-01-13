/**
 * GitHub skill importer
 * Handles cloning GitHub repositories and importing skills
 */

import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { ValidationResult } from "./types.ts";
import { copyDir, discoverSkills, ensureDir, exists } from "./utils.ts";
import { validateSkillDir } from "./validator.ts";
import { parseSkillFile } from "./validator.ts";

export interface ImportOptions {
  branch?: string; // Branch to clone (default: main)
  skillsPath?: string; // Path within repo where skills are located (default: skills)
  force?: boolean; // Overwrite existing skills
  dryRun?: boolean; // Preview without copying
  targetDir?: string; // Target directory for imported skills (default: ./skills)
}

export interface ImportResult {
  skillName: string;
  skillDir: string;
  success: boolean;
  error?: string;
  validationErrors?: string[];
  alreadyExists?: boolean;
}

export interface ImportSummary {
  repoUrl: string;
  branch: string;
  totalFound: number;
  imported: number;
  failed: number;
  skipped: number;
  results: ImportResult[];
}

/**
 * Parse GitHub URL to extract owner/repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support various GitHub URL formats:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo.git
  // - git@github.com:owner/repo.git
  // - owner/repo

  let match;

  // HTTPS URL
  match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)(\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  // Short format: owner/repo
  match = url.match(/^([^\/]+)\/([^\/]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

/**
 * Clone GitHub repository to temporary directory
 */
async function cloneRepo(
  repoUrl: string,
  branch: string,
  tempDir: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure temp directory exists
    await ensureDir(tempDir);

    // Build git clone command
    const cloneArgs = [
      "clone",
      "--depth",
      "1",
      "--branch",
      branch,
      "--single-branch",
      repoUrl,
      tempDir,
    ];

    // Execute git clone
    const process = new Deno.Command("git", {
      args: cloneArgs,
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await process.output();

    if (code !== 0) {
      const errorMsg = new TextDecoder().decode(stderr);
      return { success: false, error: `Git clone failed: ${errorMsg}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Failed to clone repository: ${error.message}` };
  }
}

/**
 * Import skills from a GitHub repository
 */
export async function importFromGitHub(
  githubUrl: string,
  options: ImportOptions = {},
): Promise<ImportSummary> {
  const branch = options.branch || "main";
  const skillsPath = options.skillsPath || "skills";
  const targetDir = options.targetDir || "./skills";
  const force = options.force || false;
  const dryRun = options.dryRun || false;

  const results: ImportResult[] = [];
  let imported = 0;
  let failed = 0;
  let skipped = 0;

  // Parse GitHub URL
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  }

  // Build full GitHub URL
  const fullRepoUrl = `https://github.com/${parsed.owner}/${parsed.repo}.git`;

  // Create temporary directory
  const tempDir = await Deno.makeTempDir({ prefix: "skill-import-" });

  try {
    // Clone repository
    console.log(`\nCloning repository: ${fullRepoUrl}`);
    console.log(`Branch: ${branch}`);
    console.log(`Temporary directory: ${tempDir}\n`);

    const cloneResult = await cloneRepo(fullRepoUrl, branch, tempDir);
    if (!cloneResult.success) {
      throw new Error(cloneResult.error);
    }

    console.log("✓ Repository cloned successfully\n");

    // Discover skills in the cloned repo
    const skillsDir = join(tempDir, skillsPath);

    // Check if skills directory exists
    if (!await exists(skillsDir)) {
      throw new Error(
        `Skills directory not found: ${skillsPath}\nMake sure the repository has a '${skillsPath}' directory.`,
      );
    }

    console.log(`Discovering skills in: ${skillsPath}/\n`);
    const discoveredSkills = await discoverSkills(skillsDir);

    if (discoveredSkills.length === 0) {
      console.log(`No skills found in ${skillsPath}/`);
      return {
        repoUrl: fullRepoUrl,
        branch,
        totalFound: 0,
        imported: 0,
        failed: 0,
        skipped: 0,
        results: [],
      };
    }

    console.log(`Found ${discoveredSkills.length} skill(s):\n`);

    // Process each skill
    for (const skillDir of discoveredSkills) {
      const skillDirName = skillDir.split("/").pop() || skillDir;

      try {
        // Validate skill
        const validation = await validateSkillDir(skillDir);

        if (!validation.valid) {
          results.push({
            skillName: skillDirName,
            skillDir,
            success: false,
            validationErrors: validation.errors.map((e) =>
              `${e.field}: ${e.message}`
            ),
          });
          failed++;
          console.log(`  ✗ ${skillDirName}: Validation failed`);
          continue;
        }

        // Get skill metadata to get the actual skill name
        const skillFile = await parseSkillFile(join(skillDir, "SKILL.md"));
        const skillName = skillFile.metadata.name;

        // Check if skill already exists in target directory
        const targetSkillDir = join(targetDir, skillDirName);
        const skillExists = await exists(targetSkillDir);

        if (skillExists && !force) {
          results.push({
            skillName: skillDirName,
            skillDir,
            success: false,
            alreadyExists: true,
            error: "Skill already exists. Use --force to overwrite.",
          });
          skipped++;
          console.log(`  ⊘ ${skillDirName}: Already exists (use --force to overwrite)`);
          continue;
        }

        // Copy skill to target directory (unless dry-run)
        if (!dryRun) {
          await ensureDir(targetDir);

          // Remove existing skill if force is enabled
          if (skillExists && force) {
            await Deno.remove(targetSkillDir, { recursive: true });
          }

          await copyDir(skillDir, targetSkillDir);
        }

        results.push({
          skillName: skillDirName,
          skillDir: targetSkillDir,
          success: true,
        });
        imported++;

        if (dryRun) {
          console.log(`  ✓ ${skillDirName}: Would be imported (dry run)`);
        } else {
          console.log(`  ✓ ${skillDirName}: Imported successfully`);
        }
      } catch (error) {
        results.push({
          skillName: skillDirName,
          skillDir,
          success: false,
          error: error.message,
        });
        failed++;
        console.log(`  ✗ ${skillDirName}: ${error.message}`);
      }
    }

    return {
      repoUrl: fullRepoUrl,
      branch,
      totalFound: discoveredSkills.length,
      imported,
      failed,
      skipped,
      results,
    };
  } finally {
    // Clean up temporary directory
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
