import { Tool } from '../swarm/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Safety barrier: Restrict execution to a dedicated sandbox directory
const SAFE_DIR = process.env.SAFE_DIR || "/tmp_swarm_files/";

export const terminalOpsTool: Tool = {
  type: "function",
  function: {
    name: "run_bash_command",
    description: "Executes a shell bash command. Strict Sandbox applies: operations are jailed inside /tmp_swarm_files/. Use this for compilation, data fetching, or advanced file manipulation.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The bash command to run (e.g. 'ls -la', 'python script.py', 'curl...'). Restricted. DO NOT try to navigate out of the safe directory."
        }
      },
      required: ["command"]
    }
  },
  execute: async (args: any) => {
    try {
      const { command } = args;
      if (!command) throw new Error("No command provided.");

      // Very rudimentary static checks to block obvious escape attempts
      if (command.includes('cd /') || command.includes(' cd ..') || command.includes('~')) {
         return `[TERMINAL ERROR]: Command rejected by Security Sandbox. Navigating outside ${SAFE_DIR} is strictly forbidden.`;
      }

      const { stdout, stderr } = await execAsync(command, { 
          cwd: SAFE_DIR,
          timeout: 10000 // 10 second limit to prevent hanging 
      });
      
      let output = "";
      if (stdout) output += `[STDOUT]:\n${stdout}\n`;
      if (stderr) output += `[STDERR]:\n${stderr}\n`;
      
      return output.trim() || "[SUCCESS] Command executed with no output.";
    } catch (err: any) {
      if (err.killed) {
         return `[TERMINAL ERROR]: Command killed upon reaching 10-second timeout limit.`;
      }
      return `[TERMINAL ERROR]: ${err.message}`;
    }
  }
};
