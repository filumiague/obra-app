"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertRegraOuro, liberarRegraOuro } from "@/actions/planejamento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SemanaData } from "@/components/planejamento/semana-detail";

type Etapa = SemanaData["etapas"][number];

function formatDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function RegraOuroForm({
  etapa,
  semanaId,
  isEngenheiro,
}: {
  etapa: Etapa;
  semanaId: string;
  isEngenheiro: boolean;
}) {
  const regra = etapa.regraOuro;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLiberando, startLiberar] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [materiaisSelecionados, setMateriaisSelecionados] = useState<string[]>(
    regra?.materiaisNecessarios.map((m) => m.materialPlanejadoId) ?? [],
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await upsertRegraOuro({
        etapaId: etapa.id,
        semanaId,
        atividade: String(formData.get("atividade") ?? ""),
        escopoDetalhado: String(formData.get("escopoDetalhado") ?? ""),
        tempoEstimado: String(formData.get("tempoEstimado") ?? ""),
        valorFechado: Number(formData.get("valorFechado") ?? 0),
        condicaoMeta: String(formData.get("condicaoMeta") ?? ""),
        metodoConstrutivo: String(formData.get("metodoConstrutivo") ?? ""),
        materiaisPlanejadosIds: materiaisSelecionados,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Regra de Ouro salva.");
      setOpen(false);
      router.refresh();
    });
  }

  function handleLiberar() {
    startLiberar(async () => {
      const result = await liberarRegraOuro({ etapaId: etapa.id, semanaId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Atividade liberada — já aparece no Diário de Obra.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-md border p-3">
      <div className="flex-1 text-xs text-muted-foreground">
        {regra?.status === "LIBERADA" ? (
          <span>
            Liberada em {formatDate(regra.dataLiberacao)} por {regra.aprovadoPorNome}.
          </span>
        ) : (
          <span>
            Preencha a Regra de Ouro e libere para que a atividade apareça no Diário
            de Obra.
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          {regra ? "Editar Regra de Ouro" : "Preencher Regra de Ouro"}
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regra de Ouro — {etapa.nome}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="atividade">Atividade</Label>
              <Input
                id="atividade"
                name="atividade"
                defaultValue={regra?.atividade ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="escopoDetalhado">Escopo detalhado passo a passo</Label>
              <Textarea
                id="escopoDetalhado"
                name="escopoDetalhado"
                rows={3}
                defaultValue={regra?.escopoDetalhado ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tempoEstimado">Tempo estimado</Label>
                <Input
                  id="tempoEstimado"
                  name="tempoEstimado"
                  defaultValue={regra?.tempoEstimado ?? ""}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorFechado">Valor fechado (R$)</Label>
                <Input
                  id="valorFechado"
                  name="valorFechado"
                  type="number"
                  step="0.01"
                  defaultValue={regra ? Number(regra.valorFechado) : ""}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condicaoMeta">
                Meta que condiciona a liberação
              </Label>
              <Input
                id="condicaoMeta"
                name="condicaoMeta"
                placeholder="Ex: revisão com engenheiro"
                defaultValue={regra?.condicaoMeta ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metodoConstrutivo">
                Método construtivo{" "}
                {!isEngenheiro && (
                  <span className="text-muted-foreground">(restrito a engenheiro)</span>
                )}
              </Label>
              <Textarea
                id="metodoConstrutivo"
                name="metodoConstrutivo"
                rows={2}
                disabled={!isEngenheiro}
                defaultValue={regra?.metodoConstrutivo ?? ""}
              />
            </div>

            {etapa.materiaisPlanejados.length > 0 && (
              <div className="space-y-1.5">
                <Label>Materiais necessários</Label>
                <div className="space-y-1 rounded-md border p-2">
                  {etapa.materiaisPlanejados.map((mp) => (
                    <label key={mp.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={materiaisSelecionados.includes(mp.id)}
                        onCheckedChange={(checked) => {
                          setMateriaisSelecionados((prev) =>
                            checked
                              ? [...prev, mp.id]
                              : prev.filter((id) => id !== mp.id),
                          );
                        }}
                      />
                      {mp.material.nome} — {Number(mp.qtdPlanejada)} {mp.material.unidade}{" "}
                      ({mp.ondeUsado})
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Salvando..." : "Salvar Regra de Ouro"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {regra?.status !== "LIBERADA" && (
        <Button size="sm" disabled={isLiberando} onClick={handleLiberar}>
          {isLiberando ? "Liberando..." : "Liberar"}
        </Button>
      )}
    </div>
  );
}
