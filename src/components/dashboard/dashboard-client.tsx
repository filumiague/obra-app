"use client";

import { useState } from "react";
import Link from "next/link";
import type { getDashboardData } from "@/actions/dashboard.actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("pt-BR");
}

const URGENCIA_LABEL: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Painel Geral</h1>
        <p className="text-sm text-muted-foreground">
          Consolidado de todos os módulos — nenhum dado é lançado aqui.
        </p>
      </div>

      <IndicadorFinanceiro financeiro={data.financeiro} />
      <PlanejadoRealizado semanas={data.planejadoRealizado} />
      <PendenciasImprevistos pendencias={data.pendencias} imprevistos={data.imprevistos} />
      <Timeline dias={data.timeline} />
    </div>
  );
}

function IndicadorFinanceiro({
  financeiro,
}: {
  financeiro: DashboardData["financeiro"];
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Indicador financeiro</h2>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Material planejado</p>
          <p className="text-lg font-semibold">{brl(financeiro.totalMaterial)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mão de obra</p>
          <p className="text-lg font-semibold">{brl(financeiro.totalMaoDeObra)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total comprometido</p>
          <p className="text-lg font-semibold">{brl(financeiro.totalComprometido)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Pago / pendente</p>
          <p className="text-lg font-semibold">
            {brl(financeiro.totalPago)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / {brl(financeiro.totalPendente)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanejadoRealizado({
  semanas,
}: {
  semanas: DashboardData["planejadoRealizado"];
}) {
  const todasEtapas = semanas.flatMap((s) => s.etapas);
  const totalGeral = todasEtapas.reduce((sum, e) => sum + e.total, 0);
  const concluidosGeral = todasEtapas.reduce((sum, e) => sum + e.concluidos, 0);
  const pctGeral = totalGeral > 0 ? Math.round((concluidosGeral / totalGeral) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Andamento geral da obra</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalGeral > 0 && (
          <div className="flex items-center gap-4 rounded-lg border bg-accent/50 p-4">
            <p className="text-3xl font-bold text-primary">{pctGeral}%</p>
            <div className="flex-1">
              <p className="text-sm font-medium">Realizado</p>
              <p className="text-xs text-muted-foreground">
                {concluidosGeral} de {totalGeral} atividades planejadas concluídas
              </p>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pctGeral}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {semanas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma semana cadastrada.</p>
        )}
        {semanas.map((semana) => (
          <div key={semana.semanaId}>
            <Link
              href={`/planejamento/${semana.semanaId}`}
              className="text-sm font-medium hover:underline"
            >
              {semana.descricao}
            </Link>
            <p className="mb-2 text-xs text-muted-foreground">
              {formatDate(semana.dataInicio)} — {formatDate(semana.dataFim)}
            </p>
            <div className="space-y-1.5">
              {semana.etapas.map((etapa) => {
                const pct = etapa.total > 0 ? (etapa.concluidos / etapa.total) * 100 : 0;
                return (
                  <div key={etapa.etapaId} className="text-xs">
                    <div className="flex justify-between">
                      <span>{etapa.nome}</span>
                      <span className="text-muted-foreground">
                        {etapa.concluidos}/{etapa.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PendenciasImprevistos({
  pendencias,
  imprevistos,
}: {
  pendencias: DashboardData["pendencias"];
  imprevistos: DashboardData["imprevistos"];
}) {
  const [urgencia, setUrgencia] = useState("TODAS");

  const imprevistosFiltrados =
    urgencia === "TODAS" ? imprevistos : imprevistos.filter((i) => i.urgencia === urgencia);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <h2 className="font-semibold">Pendências e imprevistos</h2>
        <Select value={urgencia} onValueChange={(v) => setUrgencia(v ?? "TODAS")}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v: string | null) =>
                v === "TODAS" || !v ? "Toda urgência" : URGENCIA_LABEL[v]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Toda urgência</SelectItem>
            <SelectItem value="BAIXA">Baixa</SelectItem>
            <SelectItem value="MEDIA">Média</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">
            Pendências abertas ({pendencias.length})
          </h3>
          {pendencias.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma pendência aberta.</p>
          ) : (
            <div className="space-y-1.5">
              {pendencias.map((p) => (
                <div key={p.id} className="rounded-md border p-2 text-xs">
                  <p className="font-medium">
                    #{p.numero} {p.problemaOuSolicitacao}
                  </p>
                  <p className="text-muted-foreground">
                    {p.etapa && <>Etapa: {p.etapa.nome} · </>}
                    Identificado em {formatDate(p.dataIdentificacao)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">
            Imprevistos ({imprevistosFiltrados.length})
          </h3>
          {imprevistosFiltrados.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum imprevisto.</p>
          ) : (
            <div className="space-y-1.5">
              {imprevistosFiltrados.map((i) => (
                <div key={i.id} className="rounded-md border p-2 text-xs">
                  <p className="font-medium">{i.descricao}</p>
                  <p className="text-muted-foreground">
                    Gravidade: {i.gravidade} · Urgência: {i.urgencia} ·{" "}
                    {formatDateTime(i.dataHora)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Timeline({ dias }: { dias: DashboardData["timeline"] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Linha do tempo</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {dias.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum diário registrado ainda.</p>
        )}
        {dias.map((d) => (
          <div key={d.id} className="flex gap-3 border-b pb-3 last:border-0">
            <div className="w-24 shrink-0 text-xs text-muted-foreground">
              {formatDate(d.data)}
              {d.avaliacaoNota && <p>Nota: {d.avaliacaoNota}/5</p>}
            </div>
            <div className="flex-1">
              {d.etapas.length > 0 && (
                <p className="mb-1 text-xs text-muted-foreground">
                  {d.etapas.join(", ")}
                </p>
              )}
              {d.fotos.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {d.fotos.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.id}
                      src={f.url ?? undefined}
                      alt=""
                      className="h-14 w-14 rounded-md object-cover"
                    />
                  ))}
                  {d.totalFotos > d.fotos.length && (
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      +{d.totalFotos - d.fotos.length}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sem fotos.</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
