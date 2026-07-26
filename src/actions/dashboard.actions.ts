"use server";

import { prisma } from "@/lib/prisma";
import { getSignedMidiaUrl } from "@/lib/supabase/admin";

export async function getPlanejadoRealizado() {
  const semanas = await prisma.semanaPlanejamento.findMany({
    orderBy: { dataInicio: "desc" },
    include: {
      etapas: {
        orderBy: { ordem: "asc" },
        include: {
          diasPlanejados: { include: { atividadeDiario: true } },
          regraOuro: true,
        },
      },
    },
  });

  return semanas.map((semana) => ({
    semanaId: semana.id,
    descricao: semana.descricaoAtividadePrincipal,
    dataInicio: semana.dataInicio,
    dataFim: semana.dataFim,
    etapas: semana.etapas.map((etapa) => {
      const total = etapa.diasPlanejados.length;
      const concluidos = etapa.diasPlanejados.filter((d) =>
        d.atividadeDiario.some((a) => a.status === "CONCLUIDO"),
      ).length;
      return {
        etapaId: etapa.id,
        nome: etapa.nome,
        total,
        concluidos,
        regraOuroStatus: etapa.regraOuro?.status ?? "RASCUNHO",
      };
    }),
  }));
}

export async function getPendenciasAbertas() {
  return prisma.correcaoPendencia.findMany({
    where: { status: { not: "CONCLUIDA" } },
    include: { etapa: true, visita: true },
    orderBy: { dataIdentificacao: "desc" },
  });
}

export async function getImprevistos() {
  return prisma.imprevisto.findMany({
    orderBy: { dataHora: "desc" },
    include: { diarioObra: true },
    take: 50,
  });
}

export async function getTimeline() {
  const dias = await prisma.diarioObra.findMany({
    orderBy: { data: "desc" },
    take: 30,
    include: {
      atividades: {
        include: { midias: true, etapaDiaPlanejado: { include: { etapa: true } } },
      },
    },
  });

  return Promise.all(
    dias.map(async (d) => {
      const fotos = d.atividades.flatMap((a) => a.midias.filter((m) => m.tipo === "FOTO"));
      const fotosComUrl = await Promise.all(
        fotos.slice(0, 4).map(async (f) => ({
          id: f.id,
          url: await getSignedMidiaUrl(f.storagePath),
        })),
      );
      const etapas = [
        ...new Set(d.atividades.map((a) => a.etapaDiaPlanejado.etapa.nome)),
      ];
      return {
        id: d.id,
        data: d.data,
        avaliacaoNota: d.avaliacaoNota,
        etapas,
        totalFotos: fotos.length,
        fotos: fotosComUrl,
      };
    }),
  );
}

export async function getIndicadorFinanceiro() {
  const [materiais, maoDeObra] = await Promise.all([
    prisma.materialPlanejado.findMany(),
    prisma.maoDeObra.findMany(),
  ]);

  const totalMaterial = materiais.reduce((sum, m) => sum + m.valorTotal.toNumber(), 0);
  const totalMaoDeObra = maoDeObra.reduce((sum, m) => sum + m.valorAcordado.toNumber(), 0);
  const totalPago = maoDeObra
    .filter((m) => m.status === "PAGO")
    .reduce((sum, m) => sum + m.valorAcordado.toNumber(), 0);

  return {
    totalMaterial,
    totalMaoDeObra,
    totalComprometido: totalMaterial + totalMaoDeObra,
    totalPago,
    totalPendente: totalMaoDeObra - totalPago,
  };
}

export async function getDashboardData() {
  const [planejadoRealizado, pendencias, imprevistos, timeline, financeiro] =
    await Promise.all([
      getPlanejadoRealizado(),
      getPendenciasAbertas(),
      getImprevistos(),
      getTimeline(),
      getIndicadorFinanceiro(),
    ]);

  return { planejadoRealizado, pendencias, imprevistos, timeline, financeiro };
}
