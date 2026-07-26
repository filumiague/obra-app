import { type NextRequest, NextResponse } from "next/server";
import {
  updateAtividadeStatus,
  addMaterialUso,
  addImprevisto,
  addMidia,
} from "@/actions/diario.actions";

// Replays a single queued offline mutation. Called directly by fetch from
// the browser tab (not a service worker background event), so the incoming
// request carries the same session cookies as any other same-origin call —
// no separate auth handling needed here.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const payloadRaw = formData.get("payload");
  const payload = payloadRaw ? JSON.parse(String(payloadRaw)) : {};

  try {
    let result: { error: string | null };

    switch (kind) {
      case "status": {
        result = await updateAtividadeStatus(payload);
        break;
      }
      case "material": {
        result = await addMaterialUso({ ...payload, id });
        break;
      }
      case "imprevisto": {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("descricao", payload.descricao ?? "");
        fd.set("gravidade", payload.gravidade ?? "");
        fd.set("urgencia", payload.urgencia ?? "");
        fd.set("oQuePrecisa", payload.oQuePrecisa ?? "");
        const file = formData.get("file");
        if (file instanceof File) fd.set("file", file);
        result = await addImprevisto(fd);
        break;
      }
      case "midia": {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("etapaDiaPlanejadoId", payload.etapaDiaPlanejadoId ?? "");
        fd.set("legenda", payload.legenda ?? "");
        const file = formData.get("file");
        if (file instanceof File) fd.set("file", file);
        result = await addMidia(fd);
        break;
      }
      default:
        return NextResponse.json(
          { error: "Tipo de sincronização desconhecido." },
          { status: 400 },
        );
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao sincronizar." },
      { status: 500 },
    );
  }
}
