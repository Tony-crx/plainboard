// Prompt Templates -- pre-built prompts per use case

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'coding' | 'analysis' | 'debugging' | 'documentation' | 'testing' | 'devops' | 'security';
  description: string;
  prompt: string;
  suggestedAgent: string;
  tags: string[];
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    category: 'coding',
    description: 'Review a file or module for bugs, style, and best practices',
    prompt: 'Review the following code for bugs, security issues, performance problems, and style violations. Provide specific line-by-line feedback with suggested fixes:\n\n```{{language}}\n{{code}}\n```',
    suggestedAgent: 'Coder',
    tags: ['review', 'code', 'quality'],
  },
  {
    id: 'debug-error',
    name: 'Debug Error',
    category: 'debugging',
    description: 'Diagnose and fix an error or exception',
    prompt: 'I\'m getting this error:\n\n```\n{{error_message}}\n```\n\nStack trace:\n```\n{{stack_trace}}\n```\n\nAnalyze the root cause and provide a fix with explanation.',
    suggestedAgent: 'Coder',
    tags: ['debug', 'error', 'fix'],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    category: 'security',
    description: 'Comprehensive security audit of codebase',
    prompt: 'Perform a security audit of the following code. Check for:\n1. Input validation (XSS, SQL injection, command injection)\n2. Authentication/authorization issues\n3. Secret exposure\n4. CSRF vulnerabilities\n5. Insecure dependencies\n\nCode:\n```\n{{code}}\n```',
    suggestedAgent: 'Cyn',
    tags: ['security', 'audit', 'vulnerability'],
  },
  {
    id: 'write-tests',
    name: 'Write Tests',
    category: 'testing',
    description: 'Generate test suite for a module',
    prompt: 'Write comprehensive tests for the following module. Cover:\n- Happy path\n- Edge cases (empty, null, boundary)\n- Error paths\n- Integration scenarios\n\nModule:\n```\n{{code}}\n```',
    suggestedAgent: 'Coder',
    tags: ['test', 'coverage', 'unit'],
  },
  {
    id: 'write-docs',
    name: 'Write Documentation',
    category: 'documentation',
    description: 'Generate documentation for code or API',
    prompt: 'Write clear, comprehensive documentation for the following:\n\nCode:\n```\n{{code}}\n```\n\nInclude:\n- Purpose and overview\n- API reference\n- Usage examples\n- Edge cases',
    suggestedAgent: 'Adso',
    tags: ['documentation', 'api', 'reference'],
  },
  {
    id: 'architecture-design',
    name: 'Architecture Design',
    category: 'coding',
    description: 'Design system architecture for a feature',
    prompt: 'Design the architecture for the following feature:\n\nFeature: {{feature_description}}\n\nInclude:\n- Component hierarchy\n- Data flow\n- API contracts\n- State management\n- File structure\n- Trade-offs considered',
    suggestedAgent: 'Coordinator',
    tags: ['architecture', 'design', 'planning'],
  },
  {
    id: 'math-analysis',
    name: 'Mathematical Analysis',
    category: 'analysis',
    description: 'Solve a mathematical problem or analyze an algorithm',
    prompt: 'Analyze and solve the following problem:\n\n{{problem}}\n\nShow step-by-step solution with formulas and reasoning.',
    suggestedAgent: 'Math',
    tags: ['math', 'algorithm', 'complexity'],
  },
  {
    id: 'deploy-pipeline',
    name: 'CI/CD Pipeline',
    category: 'devops',
    description: 'Set up CI/CD pipeline for a project',
    prompt: 'Set up a CI/CD pipeline for this project. Include:\n- Build steps\n- Test execution\n- Linting and type checking\n- Deployment configuration\n- Environment variables\n\nProject type: {{project_type}}\nTarget platform: {{platform}}',
    suggestedAgent: 'Coder',
    tags: ['ci-cd', 'devops', 'deployment'],
  },
  {
    id: 'performance-opt',
    name: 'Performance Optimization',
    category: 'coding',
    description: 'Identify and fix performance bottlenecks',
    prompt: 'Analyze the following code for performance issues:\n\n```\n{{code}}\n```\n\nIdentify:\n- Time complexity issues\n- Memory leaks\n- Unnecessary re-renders\n- N+1 queries\n- Network bottlenecks\n\nProvide optimized code with explanations.',
    suggestedAgent: 'Coder',
    tags: ['performance', 'optimization', 'bottleneck'],
  },
  {
    id: 'network-scan',
    name: 'Network Scan',
    category: 'security',
    description: 'Scan network for vulnerabilities or open ports',
    prompt: 'Analyze the network configuration and identify potential vulnerabilities:\n\nTarget: {{target}}\nScan type: {{scan_type}}\n\nReport findings with severity levels.',
    suggestedAgent: 'Cyn',
    tags: ['network', 'scan', 'security'],
  },
];

export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return promptTemplates.filter(t => t.category === category);
}

export function searchTemplates(query: string): PromptTemplate[] {
  const lower = query.toLowerCase();
  return promptTemplates.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.includes(lower))
  );
}
