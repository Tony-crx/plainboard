// Skill Auto-Discovery -- scan project for .claude/skills/ directories
// Discovers skills from project root, home directory, and managed skills

import { Skill, SkillFrontmatter } from '@/lib/skills/types';
import { parseFrontmatter, validateSkill } from '@/lib/skills/frontmatter-parser';

export interface SkillDiscoveryResult {
  discovered: Skill[];
  errors: string[];
}

export class SkillAutoDiscoverer {
  async discoverSkills(): Promise<SkillDiscoveryResult> {
    const discovered: Skill[] = [];
    const errors: string[] = [];

    // In browser, we can't access filesystem directly
    // Use API endpoint for server-side discovery
    try {
      const res = await fetch('/api/skills/discover', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        discovered.push(...(data.skills || []));
        errors.push(...(data.errors || []));
      }
    } catch {
      // API not available or failed
    }

    return { discovered, errors };
  }

  async registerDiscoveredSkills(skills: Skill[]): Promise<void> {
    const { globalSkillRegistry } = await import('@/lib/skills/skill-registry');
    for (const skill of skills) {
      globalSkillRegistry.register(skill);
    }
  }
}

export const skillAutoDiscoverer = new SkillAutoDiscoverer();
