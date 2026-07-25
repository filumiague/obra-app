"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

// ---------- Semana ----------

export async function getSemanas() {
  return prisma.semanaPlanejamento.findMany({ orderBy: { dataInicio: "desc" } });
}

export async function getSemana(semanaId: string) {
  return prisma.semanaPlanejamento.findUniqueOrThrow({
    where: { id: semanaId },
    include: {
      etapas: {
        orderBy: { ordem: "asc" },
        include: {
          regraOuro: {
            include: {
              materiaisNecessarios: {
                include: { materialPlanejado: { include: { material: true } } },
              },
            },
          },
          diasPlanejados: {
            orderBy: { data: "asc" },
            include: { subEtapas: { orderBy: { ordem: "asc" } } },
          },
          riscos: true,
          materiaisPlanejados: {
            include: { material: true, sobraParaEtapa: true },
          },
          maoDeObra: true,
          correcoesPendencias: true,
        },
      },
      visitasTecnicas: {
        orderBy: { data: "asc" },
        include: { correcoesPendencias: true },
      },
    },
  });
}

export async function createSemana(input: {
  dataInicio: string;
  dataFim: string;
  descricaoAtividadePrincipal: string;
  objetivo: string;
}) {
  const user = await requireUser();
  if (!input.dataInicio || !input.dataFim || !input.descricaoAtividadePrincipal) {
    return { error: "Preencha data de início, fim e a descrição da atividade principal." };
  }
  const semana = await prisma.semanaPlanejamento.create({
    data: {
      dataInicio: new Date(input.dataInicio),
      dataFim: new Date(input.dataFim),
      preenchidoPorId: user.id,
      descricaoAtividadePrincipal: input.descricaoAtividadePrincipal,
      objetivo: input.objetivo,
    },
  });
  revalidatePath("/planejamento");
  redirect(`/planejamento/${semana.id}`);
}

// ---------- Etapa ----------

export async function createEtapa(input: {
  semanaId: string;
  nome: string;
  descricao?: string;
  ordem: number;
}) {
  await requireUser();
  if (!input.nome.trim()) return { error: "Dê um nome para a etapa." };
  await prisma.etapa.create({
    data: {
      semanaId: input.semanaId,
      nome: input.nome,
      descricao: input.descricao || null,
      ordem: input.ordem,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function createEtapaDia(input: {
  etapaId: string;
  semanaId: string;
  data: string;
  atividadePlanejada: string;
  responsavel?: string;
  preRequisito?: string;
  subEtapas: string[];
}) {
  await requireUser();
  if (!input.data || !input.atividadePlanejada.trim()) {
    return { error: "Informe a data e a atividade planejada." };
  }
  await prisma.etapaDiaPlanejado.create({
    data: {
      etapaId: input.etapaId,
      data: new Date(input.data),
      atividadePlanejada: input.atividadePlanejada,
      responsavel: input.responsavel || null,
      preRequisito: input.preRequisito || null,
      subEtapas: {
        create: input.subEtapas
          .filter((s) => s.trim())
          .map((descricao, i) => ({ descricao, ordem: i })),
      },
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function createRisco(input: {
  etapaId: string;
  semanaId: string;
  risco: string;
  probabilidade: string;
  impacto: string;
  acaoPreventiva: string;
}) {
  await requireUser();
  if (!input.risco.trim()) return { error: "Descreva o risco." };
  await prisma.etapaRisco.create({
    data: {
      etapaId: input.etapaId,
      risco: input.risco,
      probabilidade: input.probabilidade,
      impacto: input.impacto,
      acaoPreventiva: input.acaoPreventiva,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

// ---------- Visitas técnicas ----------

export async function createVisita(input: {
  semanaId: string;
  data: string;
  hora: string;
  motivo: string;
  problemasEncontrados?: string;
  solicitacoesFeitas?: string;
}) {
  await requireUser();
  if (!input.data || !input.hora || !input.motivo.trim()) {
    return { error: "Informe data, horário e motivo da visita." };
  }
  await prisma.visitaTecnica.create({
    data: {
      semanaId: input.semanaId,
      data: new Date(input.data),
      hora: new Date(`1970-01-01T${input.hora}:00.000Z`),
      motivo: input.motivo,
      problemasEncontrados: input.problemasEncontrados || null,
      solicitacoesFeitas: input.solicitacoesFeitas || null,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

// ---------- Correções / pendências ----------

export async function createPendencia(input: {
  semanaId: string;
  origemTipo: "VISITA" | "DIARIO";
  visitaId?: string;
  etapaId?: string;
  dataIdentificacao: string;
  problemaOuSolicitacao: string;
  correcaoAprovada?: string;
  dependeDeId?: string;
}) {
  await requireUser();
  if (!input.dataIdentificacao || !input.problemaOuSolicitacao.trim()) {
    return { error: "Informe a data e o problema/solicitação." };
  }
  await prisma.correcaoPendencia.create({
    data: {
      dataIdentificacao: new Date(input.dataIdentificacao),
      origemTipo: input.origemTipo,
      visitaId: input.visitaId || null,
      etapaId: input.etapaId || null,
      problemaOuSolicitacao: input.problemaOuSolicitacao,
      correcaoAprovada: input.correcaoAprovada || null,
      dependeDeId: input.dependeDeId || null,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function updatePendenciaStatus(input: {
  id: string;
  semanaId: string;
  status: "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA";
}) {
  await requireUser();
  await prisma.correcaoPendencia.update({
    where: { id: input.id },
    data: {
      status: input.status,
      dataConclusao: input.status === "CONCLUIDA" ? new Date() : null,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

// ---------- Material planejado ----------

export async function createMaterialPlanejado(input: {
  semanaId: string;
  etapaId: string;
  materialNome: string;
  unidade: string;
  qtdPlanejada: number;
  ondeUsado: string;
  memorialCalculo?: string;
  valorUnitario: number;
  fornecedor?: string;
  dataCompraPrevista?: string;
  dataEntregaPrevista?: string;
}) {
  await requireUser();
  if (!input.materialNome.trim() || !input.ondeUsado.trim() || !(input.qtdPlanejada > 0)) {
    return { error: "Informe material, quantidade e onde será usado." };
  }
  const material = await prisma.material.upsert({
    where: { nome: input.materialNome },
    update: {},
    create: { nome: input.materialNome, unidade: input.unidade },
  });
  const valorTotal = input.qtdPlanejada * input.valorUnitario;
  await prisma.materialPlanejado.create({
    data: {
      materialId: material.id,
      etapaId: input.etapaId,
      qtdPlanejada: input.qtdPlanejada,
      ondeUsado: input.ondeUsado,
      memorialCalculo: input.memorialCalculo || null,
      valorUnitario: input.valorUnitario,
      valorTotal,
      fornecedor: input.fornecedor || null,
      dataCompraPrevista: input.dataCompraPrevista ? new Date(input.dataCompraPrevista) : null,
      dataEntregaPrevista: input.dataEntregaPrevista
        ? new Date(input.dataEntregaPrevista)
        : null,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function registrarCompraMaterial(input: {
  id: string;
  semanaId: string;
  qtdComprada: number;
  qtdSobra?: number;
  sobraParaEtapaId?: string;
}) {
  await requireUser();
  if (!(input.qtdComprada > 0)) {
    return { error: "Informe a quantidade efetivamente comprada." };
  }
  const planejado = await prisma.materialPlanejado.findUniqueOrThrow({
    where: { id: input.id },
  });

  await prisma.$transaction(async (tx) => {
    await tx.materialPlanejado.update({
      where: { id: input.id },
      data: {
        qtdComprada: input.qtdComprada,
        qtdSobra: input.qtdSobra ?? null,
        sobraParaEtapaId: input.sobraParaEtapaId || null,
      },
    });
    await tx.movimentoEstoque.upsert({
      where: { origemCompraId: input.id },
      update: { quantidade: input.qtdComprada },
      create: {
        materialId: planejado.materialId,
        tipo: "ENTRADA",
        quantidade: input.qtdComprada,
        origemTipo: "COMPRA_PLANEJAMENTO",
        origemCompraId: input.id,
      },
    });
  });

  revalidatePath(`/planejamento/${input.semanaId}`);
  revalidatePath("/estoque");
  return { error: null };
}

// ---------- Mão de obra ----------

export async function createMaoDeObra(input: {
  semanaId: string;
  etapaId: string;
  equipeOuEmpreiteiro: string;
  servico: string;
  valorAcordado: number;
  formaPagamento: string;
  dataPagamentoPrevista?: string;
}) {
  await requireUser();
  if (!input.equipeOuEmpreiteiro.trim() || !input.servico.trim()) {
    return { error: "Informe a equipe/empreiteiro e o serviço." };
  }
  await prisma.maoDeObra.create({
    data: {
      semanaId: input.semanaId,
      etapaId: input.etapaId,
      equipeOuEmpreiteiro: input.equipeOuEmpreiteiro,
      servico: input.servico,
      valorAcordado: input.valorAcordado,
      formaPagamento: input.formaPagamento,
      dataPagamentoPrevista: input.dataPagamentoPrevista
        ? new Date(input.dataPagamentoPrevista)
        : null,
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function updateMaoDeObraStatus(input: {
  id: string;
  semanaId: string;
  status: "PENDENTE" | "PAGO";
}) {
  await requireUser();
  await prisma.maoDeObra.update({
    where: { id: input.id },
    data: { status: input.status },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

// ---------- Regra de Ouro ----------

export async function upsertRegraOuro(input: {
  etapaId: string;
  semanaId: string;
  atividade: string;
  escopoDetalhado: string;
  tempoEstimado: string;
  valorFechado: number;
  condicaoMeta: string;
  metodoConstrutivo?: string;
  materiaisPlanejadosIds: string[];
}) {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  const existing = await prisma.regraOuro.findUnique({ where: { etapaId: input.etapaId } });

  const data = {
    atividade: input.atividade,
    escopoDetalhado: input.escopoDetalhado,
    tempoEstimado: input.tempoEstimado,
    valorFechado: input.valorFechado,
    condicaoMeta: input.condicaoMeta,
    metodoConstrutivo: dbUser.isEngenheiro
      ? input.metodoConstrutivo || null
      : (existing?.metodoConstrutivo ?? null),
  };

  const regra = existing
    ? await prisma.regraOuro.update({ where: { id: existing.id }, data })
    : await prisma.regraOuro.create({
        data: { ...data, etapaId: input.etapaId, criadoPorId: user.id },
      });

  await prisma.regraOuroMaterial.deleteMany({ where: { regraOuroId: regra.id } });
  if (input.materiaisPlanejadosIds.length > 0) {
    await prisma.regraOuroMaterial.createMany({
      data: input.materiaisPlanejadosIds.map((materialPlanejadoId) => ({
        regraOuroId: regra.id,
        materialPlanejadoId,
      })),
    });
  }

  revalidatePath(`/planejamento/${input.semanaId}`);
  return { error: null };
}

export async function liberarRegraOuro(input: { etapaId: string; semanaId: string }) {
  const user = await requireUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const regra = await prisma.regraOuro.findUnique({ where: { etapaId: input.etapaId } });

  if (!regra) {
    return { error: "Preencha o formulário da Regra de Ouro antes de liberar." };
  }
  const camposObrigatorios = [
    regra.atividade,
    regra.escopoDetalhado,
    regra.tempoEstimado,
    regra.condicaoMeta,
  ];
  if (camposObrigatorios.some((c) => !c?.trim()) || !regra.valorFechado) {
    return { error: "Preencha todos os campos obrigatórios antes de liberar." };
  }

  await prisma.regraOuro.update({
    where: { id: regra.id },
    data: {
      status: "LIBERADA",
      dataLiberacao: new Date(),
      aprovadoPorId: user.id,
      aprovadoPorNome: dbUser.nome,
      aprovadoPorData: new Date(),
    },
  });
  revalidatePath(`/planejamento/${input.semanaId}`);
  revalidatePath("/diario");
  return { error: null };
}

// ---------- Checklist derivado etapa x pagamento ----------

export async function getChecklistEtapaPagamento(semanaId: string) {
  const etapas = await prisma.etapa.findMany({
    where: { semanaId },
    orderBy: { ordem: "asc" },
    include: {
      diasPlanejados: { include: { atividadeDiario: true } },
      maoDeObra: true,
    },
  });

  return etapas.map((etapa) => {
    const totalDias = etapa.diasPlanejados.length;
    const diasConcluidos = etapa.diasPlanejados.filter((d) =>
      d.atividadeDiario.some((a) => a.status === "CONCLUIDO"),
    ).length;
    const etapaCompleta = totalDias > 0 && diasConcluidos === totalDias;

    const pagamentoTotal = etapa.maoDeObra.length;
    const pagamentoPago = etapa.maoDeObra.filter((m) => m.status === "PAGO").length;
    const pagamentoCompleto = pagamentoTotal > 0 && pagamentoPago === pagamentoTotal;

    let semaforo: "verde" | "amarelo" | "vermelho";
    if (etapaCompleta && pagamentoCompleto) semaforo = "verde";
    else if (etapaCompleta && !pagamentoCompleto) semaforo = "amarelo";
    else semaforo = "vermelho";

    return {
      etapaId: etapa.id,
      etapaNome: etapa.nome,
      diasConcluidos,
      totalDias,
      pagamentoPago,
      pagamentoTotal,
      semaforo,
    };
  });
}
