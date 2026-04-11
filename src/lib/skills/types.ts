// Skill system types -- inspired by Claude Code's skill format

/**
 * Skill frontmatter parsed from YAML in .md files
 */
export interface SkillFrontmatter {
  /** Unique skill identifier */
  name: string;
  /** Short description shown in SkillTool listing */
  description: string;
  /** When the model should invoke this skill */
  whenToUse?: string;
  /** Tools the skill auto-allows */
  allowedTools?: string[];
  /** Usage hint for the model */
  argumentHint?: string;
  /** Override model for this skill */
  model?: string;
  /** Whether user can trigger via /skill-name */
  userInvocable?: boolean;
  /** Execution context: inline (default) or fork (sub-agent) */
  context?: 'inline' | 'fork';
  /** Effort level */
  effort?: 'low' | 'medium' | 'high' | 'max';
  /** Gitignore-style glob patterns for conditional activation */
  paths?: string[];
}

/**
 * A loaded skill ready for use
 */
export interface Skill {
  id: string;
  frontmatter: SkillFrontmatter;
  /** The markdown content (body) of the skill */
  content: string;
  /** Source: bundled, user, project */
  source: 'bundled' | 'user' | 'project';
  /** Absolute path to the skill file */
  filePath: string;
}

/**
 * Result of executing a skill
 */
export interface SkillExecutionResult {
  success: boolean;
  skillName: string;
  /** Expanded prompt/instructions from the skill */
  output: string;
  /** Additional messages to inject */
  messages: Array<{ role: string; content: string }>;
  /** Tool overrides */
  allowedTools?: string[];
  /** Model override */
  model?: string;
  /** Error if failed */
  error?: string;
}

/**
 * Skill registry interface
 */
export interface SkillRegistry {
  /** Register a skill */
  register(skill: Skill): void;
  /** Get a skill by name */
  get(name: string): Skill | undefined;
  /** List all available skills */
  list(): Skill[];
  /** Search skills by query */
  search(query: string): Skill[];
  /** Load skills from directory */
  loadFromDirectory(dirPath: string, source: Skill['source']): Promise<void>;
  /** Execute a skill with arguments */
  execute(skillName: string, args?: Record<string, string>): Promise<SkillExecutionResult>;
  /** Check if a skill is conditional (has paths) and should be activated */
  activateForPath(path: string): Skill[];
}
