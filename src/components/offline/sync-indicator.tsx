"use client";

import { useSyncStatus } from "@/lib/offline/use-sync-status";

export function SyncIndicator() {
  const pending = useSyncStatus();
  if (pending === 0) return null;

  return (
    <div className="bg-amber-100 px-3 py-1.5 text-center text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {pending} {pending === 1 ? "item pendente" : "itens pendentes"} de
      sincronização — será enviado assim que a conexão voltar.
    </div>
  );
}
