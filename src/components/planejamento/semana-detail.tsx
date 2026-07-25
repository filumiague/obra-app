"use client";

import type { getSemana, getChecklistEtapaPagamento } from "@/actions/planejamento.actions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EtapasTab } from "@/components/planejamento/etapas-tab";
import { VisitasPendenciasTab } from "@/components/planejamento/visitas-pendencias-tab";
import { MaterialMaoObraTab } from "@/components/planejamento/material-mao-obra-tab";
import { ChecklistTab } from "@/components/planejamento/checklist-tab";

export type SemanaData = Awaited<ReturnType<typeof getSemana>>;
export type ChecklistData = Awaited<ReturnType<typeof getChecklistEtapaPagamento>>;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function SemanaDetail({
  semana,
  checklist,
  isEngenheiro,
}: {
  semana: SemanaData;
  checklist: ChecklistData;
  isEngenheiro: boolean;
}) {
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{semana.descricaoAtividadePrincipal}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(semana.dataInicio)} — {formatDate(semana.dataFim)}
        </p>
        {semana.objetivo && (
          <p className="mt-1 text-sm text-muted-foreground">{semana.objetivo}</p>
        )}
      </div>

      <Tabs defaultValue="etapas">
        <TabsList>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="visitas">Visitas e Pendências</TabsTrigger>
          <TabsTrigger value="material">Material e Mão de Obra</TabsTrigger>
          <TabsTrigger value="checklist">Etapa × Pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="etapas">
          <EtapasTab semana={semana} isEngenheiro={isEngenheiro} />
        </TabsContent>
        <TabsContent value="visitas">
          <VisitasPendenciasTab semana={semana} />
        </TabsContent>
        <TabsContent value="material">
          <MaterialMaoObraTab semana={semana} />
        </TabsContent>
        <TabsContent value="checklist">
          <ChecklistTab checklist={checklist} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
