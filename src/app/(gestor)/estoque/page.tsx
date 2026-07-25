import { getEstoque, getMovimentacoes } from "@/actions/estoque.actions";
import { EstoqueTable } from "@/components/estoque/estoque-table";

// Stock levels change on every material use/purchase — never prerender this.
export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const [estoque, movimentacoes] = await Promise.all([
    getEstoque(),
    getMovimentacoes(),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Estoque de Material</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saldo derivado automaticamente das compras do Planejamento e do uso
          registrado no Diário — nada aqui é lançado manualmente.
        </p>
      </div>

      {estoque.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum material cadastrado ainda.
        </p>
      ) : (
        <EstoqueTable estoque={estoque} movimentacoes={movimentacoes} />
      )}
    </div>
  );
}
