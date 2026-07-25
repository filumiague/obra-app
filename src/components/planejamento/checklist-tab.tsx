import type { ChecklistData } from "@/components/planejamento/semana-detail";

const SEMAFORO_COLOR: Record<string, string> = {
  verde: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  amarelo: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  vermelho: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const SEMAFORO_LABEL: Record<string, string> = {
  verde: "Etapa e pagamento em dia",
  amarelo: "Etapa concluída, pagamento pendente",
  vermelho: "Em andamento",
};

export function ChecklistTab({ checklist }: { checklist: ChecklistData }) {
  return (
    <div className="space-y-2 pt-4">
      <p className="text-xs text-muted-foreground">
        Calculado automaticamente a partir das atividades concluídas no Diário e do
        status de pagamento da mão de obra — não editável diretamente.
      </p>
      {checklist.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>
      ) : (
        checklist.map((c) => (
          <div
            key={c.etapaId}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <p className="font-medium">{c.etapaNome}</p>
              <p className="text-xs text-muted-foreground">
                {c.diasConcluidos}/{c.totalDias} atividades concluídas ·{" "}
                {c.pagamentoPago}/{c.pagamentoTotal} pagamentos feitos
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${SEMAFORO_COLOR[c.semaforo]}`}
            >
              {SEMAFORO_LABEL[c.semaforo]}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
