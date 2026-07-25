"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAtividadeStatus, addMidia } from "@/actions/diario.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/diario/status-badge";
import { cn } from "@/lib/utils";

type Status =
  | "NAO_INICIADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "PARCIAL"
  | "NAO_REALIZADO";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "NAO_INICIADO", label: "Não iniciado" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "PARCIAL", label: "Parcial" },
  { value: "NAO_REALIZADO", label: "Não realizado" },
];

type Midia = { id: string; tipo: string; url: string | null; legenda: string | null };

type Item = {
  id: string;
  atividadePlanejada: string;
  responsavel: string | null;
  preRequisito: string | null;
  etapa: { nome: string };
  subEtapas: { id: string; descricao: string }[];
  atividadeDiario: {
    id: string;
    status: Status;
    oQueFoiFeito: string | null;
    motivoImpacto: string | null;
    midias: Midia[];
  }[];
};

export function AtividadeCard({ item }: { item: Item }) {
  const existing = item.atividadeDiario[0];
  const [status, setStatus] = useState<Status>(existing?.status ?? "NAO_INICIADO");
  const [oQueFoiFeito, setOQueFoiFeito] = useState(existing?.oQueFoiFeito ?? "");
  const [motivoImpacto, setMotivoImpacto] = useState(existing?.motivoImpacto ?? "");
  const [isPending, startTransition] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const requiresMotivo = status === "PARCIAL" || status === "NAO_REALIZADO";

  function handleSave() {
    if (requiresMotivo && !motivoImpacto.trim()) {
      toast.error("Descreva o motivo/impacto antes de salvar.");
      return;
    }
    startTransition(async () => {
      const result = await updateAtividadeStatus({
        etapaDiaPlanejadoId: item.id,
        status,
        oQueFoiFeito: oQueFoiFeito || null,
        motivoImpacto: requiresMotivo ? motivoImpacto : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Atividade atualizada.");
      router.refresh();
    });
  }

  function handleFileChange() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("etapaDiaPlanejadoId", item.id);
    formData.set("file", file);
    startUpload(async () => {
      const result = await addMidia(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Mídia adicionada.");
        router.refresh();
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{item.etapa.nome}</p>
            <h3 className="font-semibold leading-snug">{item.atividadePlanejada}</h3>
          </div>
          <StatusBadge status={status} />
        </div>
        {(item.responsavel || item.preRequisito) && (
          <p className="text-xs text-muted-foreground">
            {item.responsavel && <>Responsável: {item.responsavel} </>}
            {item.preRequisito && <>· Pré-requisito: {item.preRequisito}</>}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {item.subEtapas.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
            {item.subEtapas.map((s) => (
              <li key={s.id}>{s.descricao}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                status === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-transparent text-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            O que foi feito
          </label>
          <Textarea
            value={oQueFoiFeito}
            onChange={(e) => setOQueFoiFeito(e.target.value)}
            placeholder="Descreva o que foi executado (pode usar ditado por voz)"
            rows={2}
          />
        </div>

        {requiresMotivo && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-destructive">
              Motivo/impacto (obrigatório)
            </label>
            <Textarea
              value={motivoImpacto}
              onChange={(e) => setMotivoImpacto(e.target.value)}
              placeholder="Por que ficou parcial ou não foi realizado?"
              rows={2}
            />
          </div>
        )}

        {existing && existing.midias.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existing.midias.map((m) => (
              <div key={m.id} className="w-20 shrink-0">
                {m.tipo === "VIDEO" ? (
                  <video src={m.url ?? undefined} className="h-20 w-20 rounded-md object-cover" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url ?? undefined}
                    alt={m.legenda ?? ""}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
          >
            {isUploading ? "Enviando..." : "Adicionar mídia"}
          </Button>
          <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
