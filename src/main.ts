#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-net
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
import { importFromGitHub, type ImportOptions } from "./importer.ts";
import {
  addLink,
  listLinks,
  removeLink,
  syncAllLinks,
  syncLink,
  toggleLink,
} from "./linker.ts";

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
  import <url>       Import skills from GitHub repository
  validate <dir>     Validate SKILL.md format
  list               List deployed skills
  remove <name>      Remove deployed skill
  link               Manage external skill links (see 'link help' for details)
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

IMPORT OPTIONS:
  --branch <b>       Git branch to clone (default: main)
  --skills-path <p>  Path within repo where skills are located (default: skills)
  --target-dir <d>   Local directory to import skills into (default: ./skills)
  --force            Overwrite existing skills
  --dry-run          Preview import without copying files

LIST OPTIONS:
  --target <t>     List skills from specific target
  --all            List skills from all platforms

REMOVE OPTIONS:
  --target <t>     Remove from specific target (required)

LINK COMMANDS:
  link add <source>    Add a skill link
  link list            List all skill links
  link remove <name>   Remove a skill link
  link enable <name>   Enable a skill link
  link disable <name>  Disable a skill link
  link sync <name>     Sync a specific linked skill
  link sync-all        Sync all enabled linked skills
  link help            Show detailed link help

LINK OPTIONS:
  --target <t>         Target platform: claude, codex, cursor (required)
  --user               Use user-level config (default)
  --project            Use project-level config
  --name <n>           Link name (for 'add', defaults to source name)
  --type <t>           Link type: local, git, web (auto-detected if not specified)
  --path <p>           Path within source (for git/web links)
  --branch <b>         Git branch (for git links)
  --description <d>    Link description
  --force              Overwrite existing links

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

  # Import skills from GitHub
  skill-builder import https://github.com/owner/repo
  skill-builder import owner/repo --branch develop
  skill-builder import owner/repo --skills-path my-skills --target-dir ./imported

  # Preview import without copying
  skill-builder import owner/repo --dry-run

  # Import and overwrite existing skills
  skill-builder import owner/repo --force

  # List all deployed skills
  skill-builder list --all

  # Remove a skill
  skill-builder remove my-skill --target claude

  # Add a local skill link
  skill-builder link add /path/to/skill --target claude --name my-linked-skill

  # Add a git skill link
  skill-builder link add https://github.com/user/repo --target claude --path skills/my-skill

  # List all skill links
  skill-builder link list --target claude

  # Sync a linked skill
  skill-builder link sync my-linked-skill --target claude

  # Sync all enabled linked skills
  skill-builder link sync-all --target claude --project
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

async function commandImport(url: string, args: ReturnType<typeof parse>) {
  console.log(`Importing skills from GitHub: ${url}\n`);

  // Parse import options
  const options: ImportOptions = {
    branch: args.branch as string | undefined,
    skillsPath: args["skills-path"] as string | undefined,
    targetDir: args["target-dir"] as string | undefined,
    force: !!args.force,
    dryRun: !!args["dry-run"],
  };

  if (options.dryRun) {
    console.log("(Dry run mode - no files will be copied)\n");
  }

  try {
    // Perform import
    const summary = await importFromGitHub(url, options);

    // Print summary
    console.log("\n" + "─".repeat(50));
    console.log(`\nImport Summary:`);
    console.log(`  Repository: ${summary.repoUrl}`);
    console.log(`  Branch: ${summary.branch}`);
    console.log(`  Total found: ${summary.totalFound}`);
    console.log(`  Imported: ${summary.imported}`);
    console.log(`  Failed: ${summary.failed}`);
    console.log(`  Skipped: ${summary.skipped}`);

    // Show failed skills details
    if (summary.failed > 0) {
      console.log("\nFailed skills:");
      for (const result of summary.results) {
        if (!result.success && !result.alreadyExists) {
          console.log(`  ✗ ${result.skillName}:`);
          if (result.validationErrors) {
            result.validationErrors.forEach((err) => console.log(`      - ${err}`));
          } else if (result.error) {
            console.log(`      - ${result.error}`);
          }
        }
      }
    }

    // Show security review reminder
    if (summary.imported > 0 && !options.dryRun) {
      console.log("\n⚠️  IMPORTANT: Security Review Required");
      console.log("   Please review the imported skills before deployment:");
      console.log(`   - Check SKILL.md for security concerns`);
      console.log(`   - Review any scripts in the scripts/ folder`);
      console.log(`   - Validate behavior matches expected functionality`);
      console.log(`\n   After review, deploy with:`);
      console.log(`   skill-builder batch-deploy ${options.targetDir || "./skills"} --target <platform>`);
    }

    Deno.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`\n✗ Import failed: ${error.message}`);
    Deno.exit(1);
  }
}

function printLinkHelp() {
  console.log(`
Agent Skill Builder - Link Management

Link external skills from other platforms to your Claude Code configuration.
Supports both user-level and project-level linking.

USAGE:
  skill-builder link <subcommand> [options]

SUBCOMMANDS:
  add <source>     Add a new skill link
  list             List all skill links
  remove <name>    Remove a skill link
  enable <name>    Enable a disabled link
  disable <name>   Disable a link without removing it
  sync <name>      Sync (download/copy and deploy) a specific linked skill
  sync-all         Sync all enabled linked skills
  help             Show this help message

COMMON OPTIONS:
  --target <t>     Target platform: claude, codex, cursor (required)
  --user           Use user-level configuration (default: ~/.claude/skill-links.json)
  --project        Use project-level configuration (.claude/skill-links.json)

ADD OPTIONS:
  --name <n>       Link name (defaults to inferred from source)
  --type <t>       Link type: local, git, web (auto-detected if not specified)
  --path <p>       Subdirectory path within source (for git/web)
  --branch <b>     Git branch to use (for git links, default: main)
  --description <d> Description of the linked skill
  --force          Overwrite existing link with same name

SYNC OPTIONS:
  --force          Force overwrite when deploying linked skills

LINK TYPES:
  local            Local filesystem path to a skill directory
  git              Git repository URL (GitHub, GitLab, etc.)
  web              Web URL to a skill (not yet supported for sync)

EXAMPLES:
  # Add a local skill link at user level
  skill-builder link add /path/to/my-skill --target claude --name my-skill

  # Add a git skill link from GitHub
  skill-builder link add https://github.com/user/repo --target claude \\
    --name github-skill --path skills/awesome-skill --branch main

  # Add a link at project level
  skill-builder link add ~/shared-skills/productivity --target claude \\
    --name productivity --project

  # List all user-level links
  skill-builder link list --target claude --user

  # List all project-level links
  skill-builder link list --target claude --project

  # Disable a link temporarily
  skill-builder link disable my-skill --target claude

  # Re-enable a link
  skill-builder link enable my-skill --target claude

  # Sync a specific linked skill
  skill-builder link sync my-skill --target claude

  # Sync all enabled links
  skill-builder link sync-all --target claude --user

  # Remove a link
  skill-builder link remove my-skill --target claude

NOTES:
  - Links are stored in .skill-links.json files
  - User-level: ~/.claude/skill-links.json (applies to all projects)
  - Project-level: .claude/skill-links.json (applies to current project only)
  - Syncing copies/clones the skill and deploys it to the target platform
  - For git links, the repository is cloned temporarily during sync
  - Disabled links are not synced but remain in the registry
`);
}

async function commandLink(args: ReturnType<typeof parse>) {
  const subcommand = args._[1] as string;

  if (!subcommand || subcommand === "help") {
    printLinkHelp();
    Deno.exit(0);
  }

  // Validate target
  if (!args.target) {
    console.error("Error: --target is required for link commands");
    console.error("Use one of: claude, codex, cursor");
    Deno.exit(1);
  }

  const target = args.target as string;
  if (!["claude", "codex", "cursor"].includes(target)) {
    console.error(`Error: Invalid target "${target}". Must be: claude, codex, or cursor`);
    Deno.exit(1);
  }

  const userLevel = !args.project; // Default to user level

  switch (subcommand) {
    case "add": {
      const source = args._[2] as string;
      if (!source) {
        console.error("Error: Source path or URL required");
        printLinkHelp();
        Deno.exit(1);
      }

      // Infer name from source if not provided
      const name = args.name as string ||
        basename(source.replace(/\.git$/, "").replace(/\/$/, ""));

      const result = await addLink(name, source, {
        target: target as DeployTarget,
        userLevel,
        force: !!args.force,
      }, {
        type: args.type as "local" | "git" | "web" | undefined,
        path: args.path as string | undefined,
        branch: args.branch as string | undefined,
        description: args.description as string | undefined,
      });

      if (result.success) {
        const level = userLevel ? "user" : "project";
        console.log(`✓ Link "${name}" added successfully (${level}-level)`);
        console.log(`  Type: ${result.link?.type}`);
        console.log(`  Source: ${result.link?.source}`);
        if (result.link?.path) console.log(`  Path: ${result.link.path}`);
        if (result.link?.branch) console.log(`  Branch: ${result.link.branch}`);
        console.log(`\nTo sync this link, run:`);
        console.log(`  skill-builder link sync ${name} --target ${target}${userLevel ? "" : " --project"}`);
      } else {
        console.error(`✗ Failed to add link: ${result.error}`);
        Deno.exit(1);
      }
      break;
    }

    case "list": {
      const level = userLevel ? "user" : "project";
      console.log(`Skill links (${level}-level, ${target}):\n`);

      const links = await listLinks({
        target: target as DeployTarget,
        userLevel,
      });

      if (links.length === 0) {
        console.log("  (no links configured)");
      } else {
        for (const link of links) {
          const status = link.enabled ? "✓" : "✗";
          console.log(`  ${status} ${link.name}`);
          console.log(`      Type: ${link.type}`);
          console.log(`      Source: ${link.source}`);
          if (link.path) console.log(`      Path: ${link.path}`);
          if (link.branch) console.log(`      Branch: ${link.branch}`);
          if (link.description) console.log(`      Description: ${link.description}`);
          console.log();
        }
      }
      break;
    }

    case "remove": {
      const name = args._[2] as string;
      if (!name) {
        console.error("Error: Link name required");
        printLinkHelp();
        Deno.exit(1);
      }

      const result = await removeLink(name, {
        target: target as DeployTarget,
        userLevel,
      });

      if (result.success) {
        console.log(`✓ Link "${name}" removed successfully`);
      } else {
        console.error(`✗ Failed to remove link: ${result.error}`);
        Deno.exit(1);
      }
      break;
    }

    case "enable": {
      const name = args._[2] as string;
      if (!name) {
        console.error("Error: Link name required");
        printLinkHelp();
        Deno.exit(1);
      }

      const result = await toggleLink(name, true, {
        target: target as DeployTarget,
        userLevel,
      });

      if (result.success) {
        console.log(`✓ Link "${name}" enabled`);
      } else {
        console.error(`✗ Failed to enable link: ${result.error}`);
        Deno.exit(1);
      }
      break;
    }

    case "disable": {
      const name = args._[2] as string;
      if (!name) {
        console.error("Error: Link name required");
        printLinkHelp();
        Deno.exit(1);
      }

      const result = await toggleLink(name, false, {
        target: target as DeployTarget,
        userLevel,
      });

      if (result.success) {
        console.log(`✓ Link "${name}" disabled`);
      } else {
        console.error(`✗ Failed to disable link: ${result.error}`);
        Deno.exit(1);
      }
      break;
    }

    case "sync": {
      const name = args._[2] as string;
      if (!name) {
        console.error("Error: Link name required");
        printLinkHelp();
        Deno.exit(1);
      }

      console.log(`Syncing link "${name}"...\n`);

      const result = await syncLink(name, {
        target: target as DeployTarget,
        userLevel,
        force: !!args.force,
      });

      if (result.success) {
        console.log(`✓ Link "${name}" synced successfully`);
        if (result.deployResults) {
          for (const deployResult of result.deployResults) {
            if (deployResult.success) {
              console.log(`  ✓ ${deployResult.target}: ${deployResult.path}`);
            } else {
              console.log(`  ✗ ${deployResult.target}: ${deployResult.error}`);
            }
          }
        }
      } else {
        console.error(`✗ Failed to sync link: ${result.error}`);
        Deno.exit(1);
      }
      break;
    }

    case "sync-all": {
      console.log(`Syncing all enabled links...\n`);

      const results = await syncAllLinks({
        target: target as DeployTarget,
        userLevel,
        force: !!args.force,
      });

      if (results.length === 0) {
        console.log("No enabled links to sync");
        Deno.exit(0);
      }

      let hasErrors = false;
      for (const result of results) {
        if (result.success) {
          console.log(`✓ ${result.link.name}`);
          if (result.deployResults) {
            for (const deployResult of result.deployResults) {
              if (deployResult.success) {
                console.log(`    ✓ ${deployResult.target}: ${deployResult.path}`);
              } else {
                console.log(`    ✗ ${deployResult.target}: ${deployResult.error}`);
                hasErrors = true;
              }
            }
          }
        } else {
          console.error(`✗ ${result.link.name}: ${result.error}`);
          hasErrors = true;
        }
        console.log();
      }

      console.log(`Synced ${results.length} link(s)`);
      Deno.exit(hasErrors ? 1 : 0);
      break;
    }

    default: {
      console.error(`Error: Unknown link subcommand "${subcommand}"`);
      printLinkHelp();
      Deno.exit(1);
    }
  }
}

// Main
async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "version", "all", "force", "dry-run", "user", "project"],
    string: ["target", "project-path", "branch", "skills-path", "target-dir", "name", "type", "path", "description"],
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

    case "import": {
      const url = args._[1] as string;
      if (!url) {
        console.error("Error: GitHub URL required");
        printHelp();
        Deno.exit(1);
      }
      await commandImport(url, args);
      break;
    }

    case "link": {
      await commandLink(args);
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
