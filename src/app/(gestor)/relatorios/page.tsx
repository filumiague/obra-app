import { getDiarioHoje } from "@/actions/diario.actions";
import { RelatorioExport } from "@/components/relatorios/relatorio-export";

export default async function RelatoriosPage() {
  const { diario } = await getDiarioHoje();

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerados a partir do que já foi registrado no Diário de hoje — nunca
          precisa redigitar nada.
        </p>
      </div>
      <RelatorioExport completoDisponivel={diario.avaliacaoNota !== null} />
    </div>
  );
}
