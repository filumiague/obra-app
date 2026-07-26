"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addImprevisto } from "@/actions/diario.actions";
import { tryOrQueue } from "@/lib/offline/sync";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ImprevistoForm({
  diarioObraId,
  onSuccess,
  onCancel,
}: {
  diarioObraId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [gravidade, setGravidade] = useState("MEDIA");
  const [urgencia, setUrgencia] = useState("MEDIA");
  const [oQuePrecisa, setOQuePrecisa] = useState("DECISAO");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    formData.set("gravidade", gravidade);
    formData.set("urgencia", urgencia);
    formData.set("oQuePrecisa", oQuePrecisa);
    formData.set("diarioObraId", diarioObraId);

    const file = formData.get("file");
    const payload = {
      diarioObraId,
      descricao: String(formData.get("descricao") ?? ""),
      gravidade,
      urgencia,
      oQuePrecisa,
    };

    startTransition(async () => {
      const { queued, result } = await tryOrQueue(() => addImprevisto(formData), {
        kind: "imprevisto",
        payload,
        fileBlob: file instanceof File && file.size > 0 ? file : undefined,
        fileName: file instanceof File ? file.name : undefined,
      });
      if (queued) {
        toast.success(
          "Imprevisto salvo localmente — será enviado quando a conexão voltar.",
        );
        formRef.current?.reset();
        onSuccess?.();
        return;
      }
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Imprevisto registrado.");
      formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">O que aconteceu?</Label>
        <Textarea
          id="descricao"
          name="descricao"
          required
          placeholder="Descreva rapidamente o imprevisto"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="gravidade">Gravidade</Label>
          <select
            id="gravidade"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            value={gravidade}
            onChange={(e) => setGravidade(e.target.value)}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgencia">Urgência</Label>
          <select
            id="urgencia"
            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            value={urgencia}
            onChange={(e) => setUrgencia(e.target.value)}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="oQuePrecisa">O que precisa</Label>
        <select
          id="oQuePrecisa"
          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
          value={oQuePrecisa}
          onChange={(e) => setOQuePrecisa(e.target.value)}
        >
          <option value="MATERIAL">Material</option>
          <option value="DECISAO">Decisão</option>
          <option value="MAO_DE_OBRA">Mão de obra</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Foto (opcional)</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          className="block w-full text-sm"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="flex-1" size="lg">
          {isPending ? "Enviando..." : "Reportar imprevisto"}
        </Button>
      </div>
    </form>
  );
}
