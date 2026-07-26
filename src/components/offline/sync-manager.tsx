"use client";

import { useEffect } from "react";
import { flush } from "@/lib/offline/sync";

// Mounted once in the campo layout — owns every trigger that can flush the
// offline outbox. No UI of its own; see SyncIndicator for that.
export function SyncManager() {
  useEffect(() => {
    flush();

    const onOnline = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "visible") flush();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    // iOS Safari has no Background Sync API, so a foreground interval is the
    // fallback that actually works there.
    const interval = setInterval(flush, 30_000);

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, []);

  return null;
}
