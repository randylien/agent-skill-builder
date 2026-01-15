/**
 * Type definitions for Agent Skill Builder
 */

export interface SkillMetadata {
  name: string;
  description: string;
  "allowed-tools"?: string[];
  model?: string;
  skills?: string[];
}

export interface SkillFile {
  metadata: SkillMetadata;
  content: string; // Markdown content after frontmatter
  raw: string; // Full file content
}

export type DeployTarget = "claude" | "codex" | "cursor";

export interface DeployOptions {
  targets: DeployTarget[];
  force?: boolean; // Overwrite existing skills
  dryRun?: boolean; // Simulate deployment without writing files
  projectPath?: string; // Custom project path for project-level deployment
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface DeployResult {
  target: DeployTarget;
  success: boolean;
  path?: string;
  error?: string;
}

export interface BatchDeployResult {
  skillName: string;
  skillDir: string;
  results: DeployResult[];
  validationError?: string;
}

export const TARGET_PATHS = {
  claude: {
    user: "~/.claude/skills",
    project: ".claude/skills",
  },
  codex: {
    user: "~/.codex/skills",
    project: ".codex/skills",
  },
  cursor: {
    project: ".cursorrules",
  },
} as const;

export const LIMITS = {
  name: 64, // Claude Code limit (more strict than Codex's 100)
  description: 500, // Codex limit (more strict than Claude's 1024)
} as const;

/**
 * External skill linking types
 */
export type LinkType = "local" | "git" | "web";

export interface SkillLink {
  name: string; // Unique identifier for the link
  type: LinkType;
  source: string; // Path, URL, or Git repository URL
  path?: string; // Subdirectory path within the source (for git/web)
  branch?: string; // Git branch (for git type)
  enabled: boolean; // Whether this link is active
  description?: string; // Optional description of the linked skill
}

export interface SkillLinkRegistry {
  version: string; // Registry format version
  links: SkillLink[];
}

export interface LinkOptions {
  target: DeployTarget;
  userLevel?: boolean; // Use user-level (~/.claude/) vs project-level (.claude/)
  force?: boolean; // Overwrite existing links
}

export interface LinkResult {
  success: boolean;
  link?: SkillLink;
  error?: string;
}

export interface SyncResult {
  link: SkillLink;
  success: boolean;
  deployResults?: DeployResult[];
  error?: string;
}

export const LINK_REGISTRY_VERSION = "1.0.0";

export const LINK_REGISTRY_PATHS = {
  claude: {
    user: "~/.claude/skill-links.json",
    project: ".claude/skill-links.json",
  },
  codex: {
    user: "~/.codex/skill-links.json",
    project: ".codex/skill-links.json",
  },
  cursor: {
    user: "~/.cursor/skill-links.json",
    project: ".cursor/skill-links.json",
  },
} as const;
