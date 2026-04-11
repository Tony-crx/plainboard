// Coordinator mode -- the orchestrator that manages workers
// Inspired by Claude Code's coordinatorMode.ts

import { Agent, Message, SwarmContext, Tool } from '../swarm/types';
import { globalTaskStore } from '../tasks/task-store';
import { globalPermissionEngine } from '../permissions/engine';
import { COORDINATOR_ALLOWED_TOOLS } from '../permissions/types';

/**
 * Check if coordinator mode is enabled
 */
export function isCoordinatorMode(): boolean {
  return process.env.COORDINATOR_MODE === 'true';
}

/**
 * Get the coordinator system prompt
 * This replaces the normal agent prompt with an orchestrator-specific one.
 */
export function getCoordinatorSystemPrompt(baseInstructions: string): string {
  return `${baseInstructions}

## COORDINATOR MODE -- YOU ARE AN ORCHESTRATOR

Kamu adalah Master Coordinator. Tugasmu bukan mengeksekusi langsung, tapi mengoordinasi pekerja (worker agents).

### Task Workflow Phases:
1. **RESEARCH** -- Spawn parallel workers untuk mengumpulkan informasi
2. **SYNTHESIS** -- Analisis hasil dari workers, buat keputusan
3. **IMPLEMENTATION** -- Delegate ke worker untuk eksekusi
4. **VERIFICATION** -- Review hasil, pastikan benar

### Aturan:
- JANGAN eksekusi tool langsung (kecuali delegate_task, system_info, log_writer)
- SELALU delegate ke spesialis agent yang tepat
- Gunakan \`run_in_background: true\` untuk task yang bisa berjalan paralel
- Gunakan \`run_in_background: false\` untuk task yang harus selesai sebelum lanjut
- Setelah worker selesai, kamu akan menerima <task-notification> XML block
- Sintesis hasil dari semua worker sebelum memberikan jawaban final

### Format Task Notification (yang akan kamu terima):
<task-notification>
  <task-id>task-xxx</task-id>
  <agent-name>AgentName</agent-name>
  <status>completed|failed|stopped</status>
  <summary>Ringkasan hasil</summary>
  <result>Detail hasil kerja</result>
</task-notification>

### Decision: Spawn Fresh vs Continue
- **Spawn Fresh**: Buat worker baru jika task berbeda dari yang sebelumnya
- **Continue**: Kirim pesan lanjutan ke worker yang sudah berjalan via send_message

### Kapan Parallelize:
- Task yang independent satu sama lain --> spawn parallel
- Task yang bergantung pada hasil lain --> spawn sequential
- Research tasks --> hampir selalu parallel
`;
}

/**
 * Filter tools available to the coordinator
 * In coordinator mode, the orchestrator can only use management tools.
 */
export function getCoordinatorTools(allTools: Tool[]): Tool[] {
  return allTools.filter(tool => {
    const name = tool.function.name;
    // Always allow delegate_task and management tools
    if (name === 'delegate_task') return true;
    if (name === 'system_info') return true;
    if (name === 'resource_monitor') return true;
    if (name === 'env_info') return true;
    if (name === 'log_writer') return true;
    if (name === 'uuid_generator') return true;
    if (name === 'pipeline_builder') return true;
    if (name === 'file_explorer') return true;
    if (name === 'disk_usage') return true;
    // Block all execution tools
    if (name === 'script_executor' || name === 'file_write' || name === 'bash') return false;
    return true;
  });
}

/**
 * Build a task notification XML from worker result
 */
export function buildTaskNotificationXml(
  taskId: string,
  agentName: string,
  status: string,
  summary: string,
  result: string
): string {
  return `<task-notification>
<task-id>${taskId}</task-id>
<agent-name>${agentName}</agent-name>
<status>${status}</status>
<summary>${summary}</summary>
<result>${result}</result>
</task-notification>`;
}

/**
 * Parse task notifications from message content
 */
export function parseTaskNotifications(content: string): Array<{
  taskId: string;
  agentName: string;
  status: string;
  summary: string;
  result: string;
}> {
  const notifications: Array<{ taskId: string; agentName: string; status: string; summary: string; result: string }> = [];
  const regex = /<task-notification>([\s\S]*?)<\/task-notification>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const taskId = block.match(/<task-id>(.*?)<\/task-id>/)?.[1] || '';
    const agentName = block.match(/<agent-name>(.*?)<\/agent-name>/)?.[1] || '';
    const status = block.match(/<status>(.*?)<\/status>/)?.[1] || '';
    const summary = block.match(/<summary>(.*?)<\/summary>/)?.[1] || '';
    const result = block.match(/<result>([\s\S]*?)<\/result>/)?.[1] || '';
    notifications.push({ taskId, agentName, status, summary, result });
  }

  return notifications;
}

/**
 * Create a worker agent with proper permission context and tool filtering
 */
export function createWorkerAgent(
  baseAgent: Agent,
  options: {
    runInBackground?: boolean;
    permissionMode?: any;
    allowedTools?: string[];
    workingDirectories?: string[];
    avoidPermissionPrompts?: boolean;
  }
): Agent {
  return {
    ...baseAgent,
    runInBackground: options.runInBackground ?? false,
    permissionMode: options.permissionMode ?? 'default',
    allowedTools: options.allowedTools,
    workingDirectories: options.workingDirectories,
    avoidPermissionPrompts: options.avoidPermissionPrompts ?? false,
    // Build permission context for this worker
    tools: options.allowedTools
      ? baseAgent.tools?.filter(t => options.allowedTools!.includes(t.function.name))
      : baseAgent.tools,
  };
}
