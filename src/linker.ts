/**
 * External skill linking management
 * Allows linking skills from other platforms/locations
 */

import {
  DeployTarget,
  LINK_REGISTRY_PATHS,
  LINK_REGISTRY_VERSION,
  LinkOptions,
  LinkResult,
  LinkType,
  SkillLink,
  SkillLinkRegistry,
  SyncResult,
} from "./types.ts";
import { expandHome } from "./utils.ts";
import { validateSkillDir } from "./validator.ts";
import { deploySkill } from "./deployer.ts";

/**
 * Get the path to the link registry file
 */
export function getLinkRegistryPath(
  target: DeployTarget,
  userLevel: boolean,
): string {
  const paths = LINK_REGISTRY_PATHS[target];
  const relativePath = userLevel ? paths.user : paths.project;
  return expandHome(relativePath);
}

/**
 * Read the link registry from disk
 */
export async function readLinkRegistry(
  target: DeployTarget,
  userLevel: boolean,
): Promise<SkillLinkRegistry> {
  const registryPath = getLinkRegistryPath(target, userLevel);

  try {
    const content = await Deno.readTextFile(registryPath);
    const registry = JSON.parse(content) as SkillLinkRegistry;

    // Validate registry structure
    if (!registry.version || !Array.isArray(registry.links)) {
      throw new Error("Invalid registry format");
    }

    return registry;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Return empty registry if file doesn't exist
      return {
        version: LINK_REGISTRY_VERSION,
        links: [],
      };
    }
    throw error;
  }
}

/**
 * Write the link registry to disk
 */
export async function writeLinkRegistry(
  target: DeployTarget,
  userLevel: boolean,
  registry: SkillLinkRegistry,
): Promise<void> {
  const registryPath = getLinkRegistryPath(target, userLevel);

  // Ensure directory exists
  const dir = registryPath.substring(0, registryPath.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });

  // Write registry
  await Deno.writeTextFile(
    registryPath,
    JSON.stringify(registry, null, 2) + "\n",
  );
}

/**
 * Detect link type from source string
 */
export function detectLinkType(source: string): LinkType {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    if (source.includes("github.com") || source.endsWith(".git")) {
      return "git";
    }
    return "web";
  }
  return "local";
}

/**
 * Validate a skill link
 */
export async function validateLink(link: SkillLink): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Validate name format (same as skill name)
  const nameRegex = /^[a-z0-9-]+$/;
  if (!nameRegex.test(link.name)) {
    return {
      valid: false,
      error: "Link name must contain only lowercase letters, numbers, and hyphens",
    };
  }

  // Validate source based on type
  if (link.type === "local") {
    const sourcePath = expandHome(link.source);
    try {
      const stat = await Deno.stat(sourcePath);
      if (!stat.isDirectory) {
        return {
          valid: false,
          error: "Local source must be a directory",
        };
      }

      // Check if it's a valid skill directory
      const validation = await validateSkillDir(sourcePath);
      if (!validation.valid) {
        return {
          valid: false,
          error: `Invalid skill directory: ${validation.errors.map((e) => e.message).join(", ")}`,
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Cannot access source: ${error.message}`,
      };
    }
  } else if (link.type === "git") {
    // Basic URL validation for git
    if (
      !link.source.startsWith("http://") &&
      !link.source.startsWith("https://") &&
      !link.source.startsWith("git@")
    ) {
      return {
        valid: false,
        error: "Git source must be a valid URL or SSH address",
      };
    }
  } else if (link.type === "web") {
    // Basic URL validation for web
    if (!link.source.startsWith("http://") && !link.source.startsWith("https://")) {
      return {
        valid: false,
        error: "Web source must be a valid HTTP(S) URL",
      };
    }
  }

  return { valid: true };
}

/**
 * Add a skill link
 */
export async function addLink(
  name: string,
  source: string,
  options: LinkOptions,
  linkOptions?: {
    type?: LinkType;
    path?: string;
    branch?: string;
    description?: string;
    enabled?: boolean;
  },
): Promise<LinkResult> {
  try {
    const registry = await readLinkRegistry(options.target, options.userLevel ?? true);

    // Check if link already exists
    const existingIndex = registry.links.findIndex((l) => l.name === name);
    if (existingIndex >= 0 && !options.force) {
      return {
        success: false,
        error: `Link "${name}" already exists. Use --force to overwrite.`,
      };
    }

    // Detect link type if not provided
    const linkType = linkOptions?.type ?? detectLinkType(source);

    // Create link
    const link: SkillLink = {
      name,
      type: linkType,
      source,
      path: linkOptions?.path,
      branch: linkOptions?.branch,
      enabled: linkOptions?.enabled ?? true,
      description: linkOptions?.description,
    };

    // Validate link
    const validation = await validateLink(link);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Add or update link
    if (existingIndex >= 0) {
      registry.links[existingIndex] = link;
    } else {
      registry.links.push(link);
    }

    // Save registry
    await writeLinkRegistry(options.target, options.userLevel ?? true, registry);

    return {
      success: true,
      link,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Remove a skill link
 */
export async function removeLink(
  name: string,
  options: LinkOptions,
): Promise<LinkResult> {
  try {
    const registry = await readLinkRegistry(options.target, options.userLevel ?? true);

    // Find link
    const index = registry.links.findIndex((l) => l.name === name);
    if (index < 0) {
      return {
        success: false,
        error: `Link "${name}" not found`,
      };
    }

    const link = registry.links[index];

    // Remove link
    registry.links.splice(index, 1);

    // Save registry
    await writeLinkRegistry(options.target, options.userLevel ?? true, registry);

    return {
      success: true,
      link,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all skill links
 */
export async function listLinks(
  options: LinkOptions,
): Promise<SkillLink[]> {
  const registry = await readLinkRegistry(options.target, options.userLevel ?? true);
  return registry.links;
}

/**
 * Toggle a link's enabled status
 */
export async function toggleLink(
  name: string,
  enabled: boolean,
  options: LinkOptions,
): Promise<LinkResult> {
  try {
    const registry = await readLinkRegistry(options.target, options.userLevel ?? true);

    // Find link
    const link = registry.links.find((l) => l.name === name);
    if (!link) {
      return {
        success: false,
        error: `Link "${name}" not found`,
      };
    }

    // Update enabled status
    link.enabled = enabled;

    // Save registry
    await writeLinkRegistry(options.target, options.userLevel ?? true, registry);

    return {
      success: true,
      link,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync a linked skill (download/copy and deploy)
 */
export async function syncLink(
  name: string,
  options: LinkOptions,
): Promise<SyncResult> {
  try {
    const registry = await readLinkRegistry(options.target, options.userLevel ?? true);

    // Find link
    const link = registry.links.find((l) => l.name === name);
    if (!link) {
      return {
        link: {} as SkillLink,
        success: false,
        error: `Link "${name}" not found`,
      };
    }

    if (!link.enabled) {
      return {
        link,
        success: false,
        error: `Link "${name}" is disabled`,
      };
    }

    // Get skill source based on link type
    let skillDir: string;
    let cleanup = false;

    if (link.type === "local") {
      skillDir = expandHome(link.source);
    } else if (link.type === "git") {
      // Clone to temporary directory
      const tempDir = await Deno.makeTempDir({ prefix: "skill-link-" });
      cleanup = true;

      try {
        // Clone repository
        const cloneArgs = [
          "git",
          "clone",
          "--depth",
          "1",
        ];

        if (link.branch) {
          cloneArgs.push("--branch", link.branch);
        }

        cloneArgs.push(link.source, tempDir);

        const cloneProcess = new Deno.Command(cloneArgs[0], {
          args: cloneArgs.slice(1),
          stdout: "piped",
          stderr: "piped",
        });

        const cloneOutput = await cloneProcess.output();
        if (!cloneOutput.success) {
          const error = new TextDecoder().decode(cloneOutput.stderr);
          throw new Error(`Git clone failed: ${error}`);
        }

        // Use subdirectory if specified
        skillDir = link.path ? `${tempDir}/${link.path}` : tempDir;
      } catch (error) {
        if (cleanup) {
          await Deno.remove(tempDir, { recursive: true }).catch(() => {});
        }
        throw error;
      }
    } else if (link.type === "web") {
      return {
        link,
        success: false,
        error: "Web links are not yet supported for syncing",
      };
    } else {
      return {
        link,
        success: false,
        error: `Unknown link type: ${link.type}`,
      };
    }

    // Deploy the skill
    try {
      const deployOptions = {
        targets: [options.target],
        force: options.force,
        projectPath: options.userLevel ? undefined : Deno.cwd(),
      };

      const deployResults = await deploySkill(skillDir, deployOptions);

      return {
        link,
        success: deployResults.every((r) => r.success),
        deployResults,
      };
    } finally {
      if (cleanup) {
        await Deno.remove(skillDir, { recursive: true }).catch(() => {});
      }
    }
  } catch (error) {
    return {
      link: {} as SkillLink,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync all enabled linked skills
 */
export async function syncAllLinks(
  options: LinkOptions,
): Promise<SyncResult[]> {
  const registry = await readLinkRegistry(options.target, options.userLevel ?? true);
  const results: SyncResult[] = [];

  for (const link of registry.links) {
    if (!link.enabled) {
      continue;
    }

    const result = await syncLink(link.name, options);
    results.push(result);
  }

  return results;
}
