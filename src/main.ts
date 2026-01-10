#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * Agent Skill Builder - CLI Entry Point
 * Cross-platform skill deployment tool for AI editors
 */

import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts";
import { basename } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { DeployOptions, DeployTarget } from "./types.ts";
import { TARGET_PATHS } from "./types.ts";
import { validateSkillDir } from "./validator.ts";
import { batchDeploySkills, deploySkill, removeSkill } from "./deployer.ts";
import { discoverSkills, expandHome, formatErrors, listSkills } from "./utils.ts";

const VERSION = "0.1.0";

function printHelp() {
  console.log(`
Agent Skill Builder v${VERSION}
Cross-platform skill deployment tool for AI editors

USAGE:
  skill-builder <command> [options]

COMMANDS:
  deploy <dir>       Deploy skill to target platforms
  batch-deploy <dir> Deploy all skills in a directory
  validate <dir>     Validate SKILL.md format
  list               List deployed skills
  remove <name>      Remove deployed skill
  help               Show this help message
  version            Show version

DEPLOY OPTIONS:
  --target <t>       Target platform: claude, codex, cursor
  --all              Deploy to all platforms
  --force            Overwrite existing skills
  --dry-run          Simulate deployment without writing files
  --project-path <p> Deploy to specified project folder (e.g., /path/to/project)

BATCH-DEPLOY OPTIONS:
  --target <t>       Target platform: claude, codex, cursor
  --all              Deploy to all platforms
  --force            Overwrite existing skills
  --dry-run          Simulate deployment without writing files
  --project-path <p> Deploy to specified project folder (e.g., /path/to/project)

LIST OPTIONS:
  --target <t>     List skills from specific target
  --all            List skills from all platforms

REMOVE OPTIONS:
  --target <t>     Remove from specific target (required)

EXAMPLES:
  # Validate a skill
  skill-builder validate ./my-skill

  # Deploy to Claude Code
  skill-builder deploy ./my-skill --target claude

  # Deploy to all platforms
  skill-builder deploy ./my-skill --all

  # Deploy with overwrite
  skill-builder deploy ./my-skill --target codex --force

  # Batch deploy all skills in a directory
  skill-builder batch-deploy ./skills --target claude

  # Batch deploy all skills to all platforms
  skill-builder batch-deploy ./skills --all --force

  # Deploy to a specific project folder
  skill-builder deploy ./my-skill --target claude --project-path /path/to/my-project

  # Batch deploy to a specific project folder
  skill-builder batch-deploy ./skills --all --project-path ~/workspace/my-app

  # List all deployed skills
  skill-builder list --all

  # Remove a skill
  skill-builder remove my-skill --target claude
`);
}

async function commandValidate(dir: string) {
  console.log(`Validating skill: ${dir}\n`);

  const result = await validateSkillDir(dir);

  if (result.valid) {
    console.log("✓ Validation passed!");
    Deno.exit(0);
  } else {
    console.error("✗ Validation failed:\n");
    console.error(formatErrors(result.errors));
    Deno.exit(1);
  }
}

async function commandDeploy(dir: string, args: ReturnType<typeof parse>) {
  // Parse targets
  const targets: DeployTarget[] = [];

  if (args.all) {
    targets.push("claude", "codex", "cursor");
  } else if (args.target) {
    const target = args.target as string;
    if (!["claude", "codex", "cursor"].includes(target)) {
      console.error(`Error: Invalid target "${target}". Must be: claude, codex, or cursor`);
      Deno.exit(1);
    }
    targets.push(target as DeployTarget);
  } else {
    console.error("Error: Must specify --target or --all");
    printHelp();
    Deno.exit(1);
  }

  // Validate skill first
  console.log(`Validating skill: ${dir}`);
  const validation = await validateSkillDir(dir);

  if (!validation.valid) {
    console.error("\n✗ Validation failed:\n");
    console.error(formatErrors(validation.errors));
    Deno.exit(1);
  }

  console.log("✓ Validation passed\n");

  // Deploy options
  const options: DeployOptions = {
    targets,
    force: !!args.force,
    dryRun: !!args["dry-run"],
    projectPath: args["project-path"] as string | undefined,
  };

  if (options.dryRun) {
    console.log("(Dry run mode - no files will be written)\n");
  }

  // Deploy
  console.log(`Deploying to: ${targets.join(", ")}\n`);
  const results = await deploySkill(dir, options);

  // Print results
  let hasErrors = false;
  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.target}: ${result.path}`);
    } else {
      console.error(`✗ ${result.target}: ${result.error}`);
      hasErrors = true;
    }
  }

  Deno.exit(hasErrors ? 1 : 0);
}

async function commandList(args: ReturnType<typeof parse>) {
  const targets: DeployTarget[] = [];

  if (args.all) {
    targets.push("claude", "codex");
  } else if (args.target) {
    const target = args.target as string;
    if (target === "cursor") {
      console.error("Error: Cursor doesn't support listing (uses single .cursorrules file)");
      Deno.exit(1);
    }
    if (!["claude", "codex"].includes(target)) {
      console.error(`Error: Invalid target "${target}". Must be: claude or codex`);
      Deno.exit(1);
    }
    targets.push(target as DeployTarget);
  } else {
    targets.push("claude", "codex");
  }

  console.log("Deployed skills:\n");

  for (const target of targets) {
    const targetPath = target === "claude" ? TARGET_PATHS.claude.user : TARGET_PATHS.codex.user;
    const skills = await listSkills(targetPath);

    console.log(`${target.toUpperCase()}:`);
    if (skills.length === 0) {
      console.log("  (none)");
    } else {
      skills.forEach((skill) => console.log(`  - ${skill}`));
    }
    console.log();
  }
}

async function commandRemove(name: string, args: ReturnType<typeof parse>) {
  if (!args.target) {
    console.error("Error: --target is required for remove command");
    Deno.exit(1);
  }

  const target = args.target as string;
  if (!["claude", "codex", "cursor"].includes(target)) {
    console.error(`Error: Invalid target "${target}". Must be: claude, codex, or cursor`);
    Deno.exit(1);
  }

  console.log(`Removing skill "${name}" from ${target}...`);

  const result = await removeSkill(name, target as DeployTarget);

  if (result.success) {
    console.log("✓ Skill removed successfully");
    Deno.exit(0);
  } else {
    console.error(`✗ Failed to remove skill: ${result.error}`);
    Deno.exit(1);
  }
}

async function commandBatchDeploy(dir: string, args: ReturnType<typeof parse>) {
  // Parse targets
  const targets: DeployTarget[] = [];

  if (args.all) {
    targets.push("claude", "codex", "cursor");
  } else if (args.target) {
    const target = args.target as string;
    if (!["claude", "codex", "cursor"].includes(target)) {
      console.error(`Error: Invalid target "${target}". Must be: claude, codex, or cursor`);
      Deno.exit(1);
    }
    targets.push(target as DeployTarget);
  } else {
    console.error("Error: Must specify --target or --all");
    printHelp();
    Deno.exit(1);
  }

  // Discover skills
  console.log(`Discovering skills in: ${dir}\n`);

  let skillDirs: string[];
  try {
    skillDirs = await discoverSkills(dir);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }

  if (skillDirs.length === 0) {
    console.error(`No skills found in ${dir}`);
    Deno.exit(1);
  }

  console.log(`Found ${skillDirs.length} skill(s):\n`);
  for (const skillDir of skillDirs) {
    const skillName = skillDir.split("/").pop() || skillDir;
    console.log(`  - ${skillName}`);
  }
  console.log();

  // Deploy options
  const options: DeployOptions = {
    targets,
    force: !!args.force,
    dryRun: !!args["dry-run"],
    projectPath: args["project-path"] as string | undefined,
  };

  if (options.dryRun) {
    console.log("(Dry run mode - no files will be written)\n");
  }

  // Batch deploy
  console.log(`Deploying to: ${targets.join(", ")}\n`);
  console.log("─".repeat(50));

  const batchResults = await batchDeploySkills(dir, options);

  // Print results
  let hasErrors = false;
  let successCount = 0;
  let failCount = 0;

  for (const batchResult of batchResults) {
    console.log(`\n[${batchResult.skillName}]`);

    if (batchResult.validationError) {
      console.error(`  ✗ Validation error: ${batchResult.validationError}`);
      hasErrors = true;
      failCount++;
      continue;
    }

    let skillHasError = false;
    for (const result of batchResult.results) {
      if (result.success) {
        console.log(`  ✓ ${result.target}: ${result.path}`);
      } else {
        console.error(`  ✗ ${result.target}: ${result.error}`);
        skillHasError = true;
      }
    }

    if (skillHasError) {
      hasErrors = true;
      failCount++;
    } else {
      successCount++;
    }
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  console.log(`\nSummary: ${successCount} succeeded, ${failCount} failed`);

  Deno.exit(hasErrors ? 1 : 0);
}

// Main
async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "version", "all", "force", "dry-run"],
    string: ["target", "project-path"],
    alias: {
      h: "help",
      v: "version",
    },
  });

  const command = args._[0] as string;

  // Handle global flags
  if (args.version) {
    console.log(`v${VERSION}`);
    Deno.exit(0);
  }

  if (args.help || !command) {
    printHelp();
    Deno.exit(0);
  }

  // Route commands
  switch (command) {
    case "validate": {
      const dir = args._[1] as string;
      if (!dir) {
        console.error("Error: Directory path required");
        printHelp();
        Deno.exit(1);
      }
      await commandValidate(dir);
      break;
    }

    case "deploy": {
      const dir = args._[1] as string;
      if (!dir) {
        console.error("Error: Directory path required");
        printHelp();
        Deno.exit(1);
      }
      await commandDeploy(dir, args);
      break;
    }

    case "batch-deploy": {
      const dir = args._[1] as string;
      if (!dir) {
        console.error("Error: Directory path required");
        printHelp();
        Deno.exit(1);
      }
      await commandBatchDeploy(dir, args);
      break;
    }

    case "list": {
      await commandList(args);
      break;
    }

    case "remove": {
      const name = args._[1] as string;
      if (!name) {
        console.error("Error: Skill name required");
        printHelp();
        Deno.exit(1);
      }
      await commandRemove(name, args);
      break;
    }

    case "help": {
      printHelp();
      Deno.exit(0);
      break;
    }

    case "version": {
      console.log(`v${VERSION}`);
      Deno.exit(0);
      break;
    }

    default: {
      console.error(`Error: Unknown command "${command}"`);
      printHelp();
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  main();
}
