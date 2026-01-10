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
