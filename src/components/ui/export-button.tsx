"use client";

import { Download } from 'lucide-react';

export function ExportButton({ memories, agentName }: { memories: any[], agentName: string }) {
  
  const handleExport = () => {
     let markdown = `# Cortisolboard Audit Export - Agent: ${agentName}\n\n`;
     markdown += `*Export time: ${new Date().toISOString()}*\n\n---\n`;

     memories.forEach(msg => {
         markdown += `**${msg.role.toUpperCase()}** ${msg.name ? `(${msg.name})` : ''}:\n\`\`\`\n${msg.content}\n\`\`\`\n\n`;
     });

     const blob = new Blob([markdown], { type: 'text/markdown' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `cortisol_${agentName.toLowerCase()}_export.md`;
     a.click();
     URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleExport}
      className="p-1.5 border border-red-900 text-red-700 hover:text-red-500 hover:border-red-500 transition-colors bg-black"
      title="Export Memory to Markdown"
    >
       <Download size={14} />
    </button>
  );
}
