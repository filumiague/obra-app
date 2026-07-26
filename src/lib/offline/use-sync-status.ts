"use client";

import { useEffect, useState } from "react";
import { offlineDb } from "@/lib/offline/db";

export function useSyncStatus() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function update() {
      const count = await offlineDb.outbox.count();
      if (mounted) setPending(count);
    }
    update();
    const interval = setInterval(update, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return pending;
}
