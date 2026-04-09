import { NextResponse } from 'next/server';
import { globalMemoryStore } from '@/lib/memory/memory-store';
import { InputValidator } from '@/lib/security/input-validator';

export async function GET(req: Request) {
   const url = new URL(req.url);
   const query = url.searchParams.get('q') || '';
   const agent = url.searchParams.get('agent') || '';

   let results: any[] = [];
   if (query) {
       const saneQuery = InputValidator.sanitize(query);
       results = await globalMemoryStore.search(saneQuery, 50);
   } else if (agent) {
       const saneAgent = InputValidator.sanitize(agent);
       results = await globalMemoryStore.getByAgent(saneAgent, 50);
   } else {
       // if no filter, just fetch a generic search to show everything
       results = await globalMemoryStore.search("", 100);
   }

   return NextResponse.json({ success: true, memories: results });
}

export async function DELETE() {
   // Danger wipe operation for Memory Control
   await globalMemoryStore.clear();
   return NextResponse.json({ success: true, message: "Memory core totally purged." });
}
