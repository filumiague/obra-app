"use server";

import { prisma } from "@/lib/prisma";

export async function getEstoque() {
  const materiais = await prisma.material.findMany({
    include: { movimentosEstoque: true },
    orderBy: { nome: "asc" },
  });

  return materiais.map((m) => {
    let entradas = 0;
    let saidas = 0;
    for (const mv of m.movimentosEstoque) {
      const qtd = mv.quantidade.toNumber();
      if (mv.tipo === "ENTRADA") entradas += qtd;
      else saidas += qtd;
    }
    return {
      id: m.id,
      nome: m.nome,
      unidade: m.unidade,
      saldo: entradas - saidas,
      totalEntradas: entradas,
      totalSaidas: saidas,
      totalMovimentos: m.movimentosEstoque.length,
    };
  });
}

export async function getMovimentacoes() {
  const movimentos = await prisma.movimentoEstoque.findMany({
    orderBy: { data: "desc" },
    include: {
      material: true,
      origemCompra: { include: { etapa: true } },
      origemUsoDiario: { include: { diarioObra: true } },
    },
  });

  return movimentos.map((mv) => {
    let origemDescricao = mv.observacao ?? "Ajuste manual";
    if (mv.origemTipo === "COMPRA_PLANEJAMENTO" && mv.origemCompra) {
      origemDescricao = `Compra planejada — etapa ${mv.origemCompra.etapa.nome}`;
    } else if (mv.origemTipo === "USO_DIARIO" && mv.origemUsoDiario) {
      origemDescricao = `Uso registrado no diário de ${mv.origemUsoDiario.diarioObra.data.toISOString().slice(0, 10)}`;
    }

    return {
      id: mv.id,
      materialId: mv.materialId,
      materialNome: mv.material.nome,
      tipo: mv.tipo,
      quantidade: mv.quantidade.toNumber(),
      data: mv.data,
      origemDescricao,
    };
  });
}
