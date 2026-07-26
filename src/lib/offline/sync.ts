import { offlineDb, type OutboxItem } from "@/lib/offline/db";

export async function enqueue(
  item: Omit<OutboxItem, "id" | "createdAt" | "status" | "retryCount"> & {
    id?: string;
  },
) {
  const id = item.id ?? crypto.randomUUID();
  await offlineDb.outbox.put({
    ...item,
    id,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  });
  return id;
}

let flushing = false;

export async function flush() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const items = await offlineDb.outbox
      .where("status")
      .notEqual("syncing")
      .toArray();

    for (const item of items) {
      await offlineDb.outbox.update(item.id, { status: "syncing" });

      try {
        const formData = new FormData();
        formData.set("id", item.id);
        formData.set("kind", item.kind);
        formData.set("payload", JSON.stringify(item.payload));
        if (item.fileBlob) {
          formData.set("file", item.fileBlob, item.fileName ?? "arquivo");
        }

        const res = await fetch("/api/sync", { method: "POST", body: formData });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          await offlineDb.outbox.update(item.id, {
            status: "error",
            errorMessage: body.error ?? "Falha ao sincronizar.",
            retryCount: item.retryCount + 1,
          });
          continue;
        }

        await offlineDb.outbox.delete(item.id);
      } catch {
        // Still offline or request failed in flight — try again next flush.
        await offlineDb.outbox.update(item.id, { status: "pending" });
      }
    }
  } finally {
    flushing = false;
  }
}

export async function countPending() {
  return offlineDb.outbox.count();
}

export async function tryOrQueue<T>(
  action: () => Promise<T>,
  queueItem: Omit<OutboxItem, "id" | "createdAt" | "status" | "retryCount"> & {
    id?: string;
  },
): Promise<{ queued: boolean; result?: T }> {
  if (navigator.onLine) {
    try {
      const result = await action();
      return { queued: false, result };
    } catch {
      // fetch to the server action failed — fall through to queueing
    }
  }
  await enqueue(queueItem);
  return { queued: true };
}
