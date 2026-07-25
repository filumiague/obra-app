import { prisma } from "@/lib/prisma";
import { getSignedMidiaUrl } from "@/lib/supabase/admin";

export type RelatorioData = {
  tipo: "PARCIAL" | "COMPLETO";
  geradoEm: Date;
  data: Date;
  atividades: {
    etapaNome: string;
    atividadePlanejada: string;
    status: string;
    oQueFoiFeito: string | null;
    motivoImpacto: string | null;
    midias: { url: string | null; tipo: string; legenda: string | null }[];
  }[];
  materiaisUsados: { nome: string; unidade: string; quantidade: number }[];
  imprevistos: {
    descricao: string;
    gravidade: string;
    urgencia: string;
    oQuePrecisa: string;
    dataHora: Date;
    fotoUrl: string | null;
  }[];
  avaliacao: {
    nota: number | null;
    aderencia: string | null;
    qualidade: string | null;
    organizacao: string | null;
    seguranca: string | null;
  } | null;
};

export async function getRelatorioData(
  diarioObraId: string,
  tipo: "PARCIAL" | "COMPLETO",
): Promise<RelatorioData> {
  const diario = await prisma.diarioObra.findUniqueOrThrow({
    where: { id: diarioObraId },
    include: {
      materiaisUsados: { include: { material: true } },
      imprevistos: { orderBy: { dataHora: "asc" } },
    },
  });

  // Pulls every activity planned for the day (not just the ones the field
  // user already touched), so the report shows the full picture — "não
  // iniciado" activities included — same as the Diário checklist itself.
  const itensPlanejados = await prisma.etapaDiaPlanejado.findMany({
    where: { data: diario.data, etapa: { regraOuro: { status: "LIBERADA" } } },
    include: {
      etapa: true,
      atividadeDiario: {
        where: { diarioObraId },
        include: { midias: { orderBy: { timestamp: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const atividades = await Promise.all(
    itensPlanejados.map(async (item) => {
      const execucao = item.atividadeDiario[0];
      return {
        etapaNome: item.etapa.nome,
        atividadePlanejada: item.atividadePlanejada,
        status: execucao?.status ?? "NAO_INICIADO",
        oQueFoiFeito: execucao?.oQueFoiFeito ?? null,
        motivoImpacto: execucao?.motivoImpacto ?? null,
        midias: execucao
          ? await Promise.all(
              execucao.midias.map(async (m) => ({
                url: await getSignedMidiaUrl(m.storagePath),
                tipo: m.tipo,
                legenda: m.legenda,
              })),
            )
          : [],
      };
    }),
  );

  const imprevistos = await Promise.all(
    diario.imprevistos.map(async (i) => ({
      descricao: i.descricao,
      gravidade: i.gravidade,
      urgencia: i.urgencia,
      oQuePrecisa: i.oQuePrecisa,
      dataHora: i.dataHora,
      fotoUrl: i.fotoStoragePath ? await getSignedMidiaUrl(i.fotoStoragePath) : null,
    })),
  );

  return {
    tipo,
    geradoEm: new Date(),
    data: diario.data,
    atividades,
    materiaisUsados: diario.materiaisUsados.map((m) => ({
      nome: m.material.nome,
      unidade: m.material.unidade,
      quantidade: m.quantidade.toNumber(),
    })),
    imprevistos,
    avaliacao:
      diario.avaliacaoNota !== null
        ? {
            nota: diario.avaliacaoNota,
            aderencia: diario.avaliacaoAderencia,
            qualidade: diario.avaliacaoQualidade,
            organizacao: diario.avaliacaoOrganizacao,
            seguranca: diario.avaliacaoSeguranca,
          }
        : null,
  };
}

const STATUS_LABELS: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  PARCIAL: "Parcial",
  NAO_REALIZADO: "Não realizado",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("pt-BR");
}
