"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEtapaDia, createRisco } from "@/actions/planejamento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SemanaData } from "@/components/planejamento/semana-detail";
import { RegraOuroForm } from "@/components/planejamento/regra-ouro-form";

type Etapa = SemanaData["etapas"][number];

const REGRA_STATUS_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  LIBERADA: "Liberada",
  BLOQUEADA: "Bloqueada",
};

const REGRA_STATUS_COLOR: Record<string, string> = {
  RASCUNHO: "bg-muted text-muted-foreground",
  LIBERADA: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  BLOQUEADA: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function EtapaCard({
  etapa,
  semanaId,
  isEngenheiro,
}: {
  etapa: Etapa;
  semanaId: string;
  isEngenheiro: boolean;
}) {
  const status = etapa.regraOuro?.status ?? "RASCUNHO";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <h3 className="font-semibold">{etapa.nome}</h3>
          {etapa.descricao && (
            <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${REGRA_STATUS_COLOR[status]}`}
        >
          Regra de Ouro: {REGRA_STATUS_LABEL[status]}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <RegraOuroForm etapa={etapa} semanaId={semanaId} isEngenheiro={isEngenheiro} />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Riscos</h4>
            <NovoRiscoForm etapaId={etapa.id} semanaId={semanaId} />
          </div>
          {etapa.riscos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum risco cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {etapa.riscos.map((r) => (
                <div key={r.id} className="rounded-md border p-2 text-xs">
                  <p className="font-medium">{r.risco}</p>
                  <p className="text-muted-foreground">
                    Probabilidade: {r.probabilidade} · Impacto: {r.impacto}
                  </p>
                  <p className="text-muted-foreground">Ação preventiva: {r.acaoPreventiva}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Detalhamento dia a dia</h4>
            <NovoDiaForm etapaId={etapa.id} semanaId={semanaId} />
          </div>
          {etapa.diasPlanejados.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum dia planejado ainda.</p>
          ) : (
            <div className="space-y-2">
              {etapa.diasPlanejados.map((d) => (
                <div key={d.id} className="rounded-md border p-2 text-xs">
                  <div className="flex justify-between font-medium">
                    <span>{d.atividadePlanejada}</span>
                    <span className="text-muted-foreground">{formatDate(d.data)}</span>
                  </div>
                  {(d.responsavel || d.preRequisito) && (
                    <p className="text-muted-foreground">
                      {d.responsavel && <>Responsável: {d.responsavel} </>}
                      {d.preRequisito && <>· Pré-requisito: {d.preRequisito}</>}
                    </p>
                  )}
                  {d.subEtapas.length > 0 && (
                    <ul className="list-disc pl-4 text-muted-foreground">
                      {d.subEtapas.map((s) => (
                        <li key={s.id}>{s.descricao}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NovoRiscoForm({ etapaId, semanaId }: { etapaId: string; semanaId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRisco({
        etapaId,
        semanaId,
        risco: String(formData.get("risco")),
        probabilidade: String(formData.get("probabilidade")),
        impacto: String(formData.get("impacto")),
        acaoPreventiva: String(formData.get("acaoPreventiva")),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Risco adicionado.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        + Risco
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo risco</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="risco">Risco</Label>
            <Input id="risco" name="risco" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="probabilidade">Probabilidade</Label>
              <Input id="probabilidade" name="probabilidade" placeholder="Baixa/Média/Alta" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="impacto">Impacto se ocorrer</Label>
              <Input id="impacto" name="impacto" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acaoPreventiva">Ação preventiva</Label>
            <Textarea id="acaoPreventiva" name="acaoPreventiva" rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Adicionar risco"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovoDiaForm({ etapaId, semanaId }: { etapaId: string; semanaId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [subEtapas, setSubEtapas] = useState([""]);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEtapaDia({
        etapaId,
        semanaId,
        data: String(formData.get("data")),
        atividadePlanejada: String(formData.get("atividadePlanejada")),
        responsavel: String(formData.get("responsavel") ?? ""),
        preRequisito: String(formData.get("preRequisito") ?? ""),
        subEtapas,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Dia planejado adicionado.");
      formRef.current?.reset();
      setSubEtapas([""]);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        + Dia planejado
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo dia planejado</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="atividadePlanejada">Atividade prevista</Label>
            <Input id="atividadePlanejada" name="atividadePlanejada" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" name="responsavel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preRequisito">Pré-requisito</Label>
              <Input id="preRequisito" name="preRequisito" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-etapas / detalhamento</Label>
            {subEtapas.map((v, i) => (
              <Input
                key={i}
                value={v}
                onChange={(e) => {
                  const next = [...subEtapas];
                  next[i] = e.target.value;
                  setSubEtapas(next);
                }}
                placeholder={`Sub-etapa ${i + 1}`}
                className="mb-1.5"
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSubEtapas([...subEtapas, ""])}
            >
              + sub-etapa
            </Button>
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Adicionar dia planejado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
