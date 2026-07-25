"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createVisita,
  createPendencia,
  updatePendenciaStatus,
} from "@/actions/planejamento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SemanaData } from "@/components/planejamento/semana-detail";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};
const STATUS_COLOR: Record<string, string> = {
  ABERTA: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  EM_ANDAMENTO: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};

export function VisitasPendenciasTab({ semana }: { semana: SemanaData }) {
  const pendenciasMap = new Map<
    string,
    SemanaData["etapas"][number]["correcoesPendencias"][number]
  >();
  for (const etapa of semana.etapas) {
    for (const p of etapa.correcoesPendencias) pendenciasMap.set(p.id, p);
  }
  for (const visita of semana.visitasTecnicas) {
    for (const p of visita.correcoesPendencias) pendenciasMap.set(p.id, p);
  }
  const pendencias = [...pendenciasMap.values()].sort((a, b) => a.numero - b.numero);

  return (
    <div className="space-y-6 pt-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Visitas técnicas</h2>
          <NovaVisitaForm semanaId={semana.id} />
        </div>
        {semana.visitasTecnicas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
        ) : (
          <div className="space-y-2">
            {semana.visitasTecnicas.map((v) => (
              <Card key={v.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
                  <h3 className="text-sm font-medium">{v.motivo}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(v.data)} às {formatTime(v.hora)}
                  </span>
                </CardHeader>
                {(v.problemasEncontrados || v.solicitacoesFeitas) && (
                  <CardContent className="space-y-1 pt-0 text-xs text-muted-foreground">
                    {v.problemasEncontrados && (
                      <p>Problemas encontrados: {v.problemasEncontrados}</p>
                    )}
                    {v.solicitacoesFeitas && (
                      <p>Solicitações feitas: {v.solicitacoesFeitas}</p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Correções e pendências</h2>
          <NovaPendenciaForm semana={semana} />
        </div>
        {pendencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência registrada.</p>
        ) : (
          <div className="space-y-2">
            {pendencias.map((p) => (
              <PendenciaCard key={p.id} pendencia={p} semanaId={semana.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NovaVisitaForm({ semanaId }: { semanaId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createVisita({
        semanaId,
        data: String(formData.get("data")),
        hora: String(formData.get("hora")),
        motivo: String(formData.get("motivo")),
        problemasEncontrados: String(formData.get("problemasEncontrados") ?? ""),
        solicitacoesFeitas: String(formData.get("solicitacoesFeitas") ?? ""),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Visita registrada.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nova visita</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova visita técnica</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hora">Horário</Label>
              <Input id="hora" name="hora" type="time" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="motivo">Motivo da visita</Label>
            <Input id="motivo" name="motivo" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="problemasEncontrados">Problemas identificados</Label>
            <Textarea id="problemasEncontrados" name="problemasEncontrados" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="solicitacoesFeitas">Solicitações feitas</Label>
            <Textarea id="solicitacoesFeitas" name="solicitacoesFeitas" rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Registrar visita"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovaPendenciaForm({ semana }: { semana: SemanaData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [origemTipo, setOrigemTipo] = useState<"VISITA" | "DIARIO">("VISITA");
  const [visitaId, setVisitaId] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPendencia({
        semanaId: semana.id,
        origemTipo,
        visitaId: origemTipo === "VISITA" ? visitaId : undefined,
        etapaId: etapaId || undefined,
        dataIdentificacao: String(formData.get("dataIdentificacao")),
        problemaOuSolicitacao: String(formData.get("problemaOuSolicitacao")),
        correcaoAprovada: String(formData.get("correcaoAprovada") ?? ""),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Pendência registrada.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nova pendência</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova correção/pendência</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Origem</Label>
            <Select
              value={origemTipo}
              onValueChange={(v) => setOrigemTipo((v as "VISITA" | "DIARIO") ?? "VISITA")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) => (v === "DIARIO" ? "Diário de obra" : "Visita técnica")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISITA">Visita técnica</SelectItem>
                <SelectItem value="DIARIO">Diário de obra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {origemTipo === "VISITA" && semana.visitasTecnicas.length > 0 && (
            <div className="space-y-1.5">
              <Label>Qual visita</Label>
              <Select value={visitaId} onValueChange={(v) => setVisitaId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a visita">
                    {(v: string | null) =>
                      semana.visitasTecnicas.find((vt) => vt.id === v)?.motivo ??
                      "Selecione a visita"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {semana.visitasTecnicas.map((vt) => (
                    <SelectItem key={vt.id} value={vt.id}>
                      {vt.motivo} — {formatDate(vt.data)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {semana.etapas.length > 0 && (
            <div className="space-y-1.5">
              <Label>Etapa relacionada (opcional)</Label>
              <Select value={etapaId} onValueChange={(v) => setEtapaId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Nenhuma">
                    {(v: string | null) =>
                      semana.etapas.find((e) => e.id === v)?.nome ?? "Nenhuma"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {semana.etapas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="dataIdentificacao">Data de identificação</Label>
            <Input id="dataIdentificacao" name="dataIdentificacao" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="problemaOuSolicitacao">Problema/solicitação</Label>
            <Textarea id="problemaOuSolicitacao" name="problemaOuSolicitacao" rows={2} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="correcaoAprovada">Correção aprovada</Label>
            <Textarea id="correcaoAprovada" name="correcaoAprovada" rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Registrar pendência"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendenciaCard({
  pendencia,
  semanaId,
}: {
  pendencia: SemanaData["etapas"][number]["correcoesPendencias"][number];
  semanaId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatus(status: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA") {
    startTransition(async () => {
      const result = await updatePendenciaStatus({ id: pendencia.id, semanaId, status });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-medium">#{pendencia.numero}</span>{" "}
            {pendencia.problemaOuSolicitacao}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[pendencia.status]}`}
          >
            {STATUS_LABEL[pendencia.status]}
          </span>
        </div>
        {pendencia.correcaoAprovada && (
          <p className="text-xs text-muted-foreground">
            Correção aprovada: {pendencia.correcaoAprovada}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Identificado em {formatDate(pendencia.dataIdentificacao)}
          {pendencia.dataConclusao && ` · Concluída em ${formatDate(pendencia.dataConclusao)}`}
        </p>
        <div className="flex gap-1.5">
          {(["ABERTA", "EM_ANDAMENTO", "CONCLUIDA"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={isPending}
              onClick={() => handleStatus(s)}
              className={`rounded-full border px-2 py-0.5 text-xs ${
                pendencia.status === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-input"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
