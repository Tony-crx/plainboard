import fs from 'fs/promises';
import path from 'path';
import { Tool } from '@/lib/swarm/types';

// Let's create an explicit tmp directory as Safe Dir
const SAFE_DIR = process.env.SAFE_DIR || path.join(process.cwd(), 'tmp_swarm_files');

export const fileOpsTool: Tool = {
  type: 'function',
  function: {
      name: 'file_operations',
      description: 'Read, write, or delete files safely strictly inside the SAFE_DIR sandbox.',
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['read', 'write', 'delete', 'list'],
            description: 'File operation to perform'
          },
          filePath: {
            type: 'string',
            description: 'Relative path to the file inside the sandbox'
          },
          content: {
            type: 'string',
            description: 'Content to write (for write operation)'
          }
        },
        required: ['operation', 'filePath']
      }
  },
  execute: async ({ operation, filePath, content }: {
    operation: string;
    filePath: string;
    content?: string;
  }) => {
    // Security: restrict to safe directory
    const resolvedPath = path.resolve(SAFE_DIR, filePath.replace(/^(\.\.(\/|\\|$))+/, ''));

    if (!resolvedPath.startsWith(SAFE_DIR)) {
        throw new Error(`Security Violation: Path traversal attempted. Escaped SAFE_DIR.`);
    }

    switch (operation) {
      case 'read':
        return await fs.readFile(resolvedPath, 'utf-8');
      case 'write':
        await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
        await fs.writeFile(resolvedPath, content || '', 'utf-8');
        return `File written successfully at: ${resolvedPath}`;
      case 'delete':
        await fs.unlink(resolvedPath);
        return `File deleted successfully: ${resolvedPath}`;
      case 'list':
        const files = await fs.readdir(SAFE_DIR);
        return `Files in sandbox: ${files.join(', ')}`;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
};
