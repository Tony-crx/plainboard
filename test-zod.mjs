import { z } from 'zod';

const s = z.object({
  code: z.string().describe('Source code to execute').optional(),
  language: z.enum(['bash', 'python'])
});

console.dir(s.toJSONSchema(), { depth: null });
