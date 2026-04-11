// SkillTool -- allows agents to execute skills
// Inspired by Claude Code's SkillTool

import { Tool } from '@/lib/swarm/types';
import { globalSkillRegistry } from './skill-registry';

export const skillTool: Tool = {
  type: 'function',
  function: {
    name: 'skill',
    description: 'Execute a skill (predefined workflow) by name. Use this to run structured workflows like code-review, debug, architect, security-audit, etc. List available skills with "list" as the skill name.',
    parameters: {
      type: 'object',
      properties: {
        skill: {
          type: 'string',
          description: 'Name of the skill to execute (e.g., "code-review", "debug", "architect"). Use "list" to see available skills.',
        },
        args: {
          type: 'object',
          description: 'Arguments to pass to the skill (replaces {{placeholders}} in the skill content)',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['skill'],
    },
  },
  execute: async (args: { skill: string; args?: Record<string, string> }) => {
    if (args.skill === 'list') {
      const skills = globalSkillRegistry.list();
      return skills.map(s => {
        const hint = s.frontmatter.argumentHint ? ` ${s.frontmatter.argumentHint}` : '';
        const context = s.frontmatter.context === 'fork' ? ' [fork]' : '';
        return `- **${s.frontmatter.name}**${context}: ${s.frontmatter.description}${hint}`;
      }).join('\n');
    }

    const result = await globalSkillRegistry.execute(args.skill, args.args || {});

    if (!result.success) {
      return `Skill execution failed: ${result.error}`;
    }

    return result.output;
  },
  isEnabled: () => true,
  isConcurrencySafe: () => false,
  getActivityDescription: (args: any) => `Running skill: ${args.skill}...`,
  shouldDefer: false,
  alwaysLoad: true,
};
