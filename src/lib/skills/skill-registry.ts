// Skill Registry -- singleton for managing all skills

import { Skill, SkillRegistry, SkillExecutionResult, SkillFrontmatter } from './types';
import { parseFrontmatter, validateSkill, processSkillContent } from './frontmatter-parser';

class DefaultSkillRegistry implements SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill): void {
    this.skills.set(skill.frontmatter.name.toLowerCase(), skill);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name.toLowerCase());
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  search(query: string): Skill[] {
    const lower = query.toLowerCase();
    return this.list().filter(skill =>
      skill.frontmatter.name.toLowerCase().includes(lower) ||
      skill.frontmatter.description.toLowerCase().includes(lower) ||
      (skill.frontmatter.whenToUse || '').toLowerCase().includes(lower)
    );
  }

  async loadFromDirectory(dirPath: string, source: Skill['source']): Promise<void> {
    // In browser environment, we use bundled skills or localStorage-based user skills
    // This is a stub for server-side file system loading
    if (typeof window !== 'undefined') return;

    const fs = await import('fs');
    const path = await import('path');

    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(dirPath, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf-8');
          const { frontmatter, body } = parseFrontmatter(content);
          const validation = validateSkill(frontmatter);

          if (validation.valid && frontmatter.name) {
            this.register({
              id: `${source}-${frontmatter.name}`,
              frontmatter: frontmatter as SkillFrontmatter,
              content: body,
              source,
              filePath: skillFile,
            });
          }
        }
      }
    }
  }

  async execute(skillName: string, args: Record<string, string> = {}): Promise<SkillExecutionResult> {
    const skill = this.get(skillName);

    if (!skill) {
      return {
        success: false,
        skillName,
        output: '',
        messages: [],
        error: `Skill '${skillName}' not found. Available skills: ${this.list().map(s => s.frontmatter.name).join(', ')}`,
      };
    }

    try {
      const { output } = processSkillContent(
        skill.content,
        args,
        skill.filePath ? skill.filePath.substring(0, skill.filePath.lastIndexOf('/')) : process.cwd()
      );

      const messages = [{
        role: 'user' as const,
        content: `[SKILL: ${skill.frontmatter.name}]\n\n${output}`,
      }];

      return {
        success: true,
        skillName: skill.frontmatter.name,
        output,
        messages,
        allowedTools: skill.frontmatter.allowedTools,
        model: skill.frontmatter.model,
      };
    } catch (error: any) {
      return {
        success: false,
        skillName: skill.frontmatter.name,
        output: '',
        messages: [],
        error: error.message || 'Unknown error executing skill',
      };
    }
  }

  activateForPath(path: string): Skill[] {
    // Activate conditional skills based on their `paths` glob patterns
    return this.list().filter(skill => {
      if (!skill.frontmatter.paths || skill.frontmatter.paths.length === 0) return false;
      return skill.frontmatter.paths.some(pattern => {
        // Simple glob matching
        const regex = new RegExp(
          '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
        );
        return regex.test(path);
      });
    });
  }
}

export const globalSkillRegistry: SkillRegistry = new DefaultSkillRegistry();
