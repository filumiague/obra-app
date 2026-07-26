/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Mutations and the offline sync endpoint must always hit the network —
    // the Dexie outbox owns retry/queueing, never the service worker cache.
    {
      matcher: ({ url }) => url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    // Already-viewed photos/videos stay available offline.
    {
      matcher: ({ url }) =>
        url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/"),
      handler: new CacheFirst({
        cacheName: "obra-midias",
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
