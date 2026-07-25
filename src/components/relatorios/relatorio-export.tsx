"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FORMATO_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "Word (.docx)",
  xlsx: "Excel (.xlsx)",
};

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function RelatorioExport({
  completoDisponivel,
}: {
  completoDisponivel: boolean;
}) {
  const [formato, setFormato] = useState("pdf");
  const [pendingTipo, setPendingTipo] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function gerar(tipo: "parcial" | "completo") {
    setPendingTipo(tipo);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/relatorios?tipo=${tipo}&formato=${formato}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Falha ao gerar relatório.");
          return;
        }
        const blob = await res.blob();
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const match = disposition.match(/filename="(.+)"/);
        const filename = match?.[1] ?? `relatorio-${tipo}.${formato}`;
        const file = new File([blob], filename, { type: MIME_TYPES[formato] });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: filename });
            return;
          } catch {
            // user cancelled the share sheet — fall through to download
          }
        }
        downloadBlob(blob, filename);
      } catch {
        toast.error("Falha ao gerar relatório.");
      } finally {
        setPendingTipo(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Formato</span>
        <Select value={formato} onValueChange={(v) => setFormato(v ?? "pdf")}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v: string | null) => FORMATO_LABELS[v ?? "pdf"]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="docx">Word (.docx)</SelectItem>
            <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pendingTipo !== null}
          onClick={() => gerar("parcial")}
        >
          {pendingTipo === "parcial" ? "Gerando..." : "Relatório Parcial"}
        </Button>
        <Button
          type="button"
          disabled={pendingTipo !== null || !completoDisponivel}
          onClick={() => gerar("completo")}
          title={
            completoDisponivel
              ? undefined
              : "Feche o dia (avaliação) para liberar o relatório completo"
          }
        >
          {pendingTipo === "completo" ? "Gerando..." : "Relatório Completo do Dia"}
        </Button>
      </div>
      {!completoDisponivel && (
        <p className="text-xs text-muted-foreground">
          O Relatório Completo libera depois que a avaliação do dia for salva
          no Diário.
        </p>
      )}
    </div>
  );
}
