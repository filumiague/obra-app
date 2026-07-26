import Dexie, { type Table } from "dexie";

export type OutboxKind = "status" | "material" | "imprevisto" | "avaliacao" | "midia";

export interface OutboxItem {
  id: string; // client-generated UUID — becomes the durable PK once synced
  kind: OutboxKind;
  payload: Record<string, unknown>;
  fileBlob?: Blob;
  fileName?: string;
  createdAt: number;
  status: "pending" | "syncing" | "error";
  errorMessage?: string;
  retryCount: number;
}

class ObraOfflineDB extends Dexie {
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super("obra-offline");
    this.version(1).stores({
      outbox: "id, createdAt, status",
    });
  }
}

export const offlineDb = new ObraOfflineDB();
