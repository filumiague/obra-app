"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addImprevisto } from "@/actions/diario.actions";
import { tryOrQueue } from "@/lib/offline/sync";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GRAVIDADE_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

const O_QUE_PRECISA_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  DECISAO: "Decisão",
  MAO_DE_OBRA: "Mão de obra",
  OUTRO: "Outro",
};

export function ImprevistoForm({
  diarioObraId,
  onSuccess,
}: {
  diarioObraId: string;
  onSuccess?: () => void;
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
          <Label>Gravidade</Label>
          <Select value={gravidade} onValueChange={(v) => setGravidade(v ?? "MEDIA")}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => GRAVIDADE_LABELS[v ?? ""] ?? ""}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Urgência</Label>
          <Select value={urgencia} onValueChange={(v) => setUrgencia(v ?? "MEDIA")}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => GRAVIDADE_LABELS[v ?? ""] ?? ""}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>O que precisa</Label>
        <Select value={oQuePrecisa} onValueChange={(v) => setOQuePrecisa(v ?? "DECISAO")}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string | null) => O_QUE_PRECISA_LABELS[v ?? ""] ?? ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MATERIAL">Material</SelectItem>
            <SelectItem value="DECISAO">Decisão</SelectItem>
            <SelectItem value="MAO_DE_OBRA">Mão de obra</SelectItem>
            <SelectItem value="OUTRO">Outro</SelectItem>
          </SelectContent>
        </Select>
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

      <Button type="submit" disabled={isPending} className="w-full" size="lg">
        {isPending ? "Enviando..." : "Reportar imprevisto"}
      </Button>
    </form>
  );
}
