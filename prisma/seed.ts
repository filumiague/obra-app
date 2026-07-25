import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function startOfDayUTC(d: Date) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

async function main() {
  const gestor = await prisma.user.findUniqueOrThrow({
    where: { email: "felipefilu@gmail.com" },
  });

  const hoje = startOfDayUTC(new Date());
  const segunda = new Date(hoje);
  segunda.setUTCDate(hoje.getUTCDate() - ((hoje.getUTCDay() + 6) % 7));
  const sexta = new Date(segunda);
  sexta.setUTCDate(segunda.getUTCDate() + 4);

  const semana =
    (await prisma.semanaPlanejamento.findFirst({ where: { dataInicio: segunda } })) ??
    (await prisma.semanaPlanejamento.create({
      data: {
        dataInicio: segunda,
        dataFim: sexta,
        preenchidoPorId: gestor.id,
        descricaoAtividadePrincipal: "Fundação e infraestrutura",
        objetivo: "Concluir escavação e armação da fundação",
      },
    }));

  // ---------- Etapa 1: Fundação (liberada, é a que aparece no Diário) ----------

  const etapaFundacao =
    (await prisma.etapa.findFirst({ where: { semanaId: semana.id, nome: "Fundação" } })) ??
    (await prisma.etapa.create({
      data: {
        semanaId: semana.id,
        nome: "Fundação",
        descricao: "Escavação, forma e armação da fundação",
        ordem: 1,
      },
    }));

  await prisma.regraOuro.upsert({
    where: { etapaId: etapaFundacao.id },
    update: {},
    create: {
      etapaId: etapaFundacao.id,
      atividade: "Fundação",
      escopoDetalhado:
        "Escavar, montar forma e armar a fundação conforme projeto estrutural",
      tempoEstimado: "5 dias úteis",
      valorFechado: 8000,
      condicaoMeta: "Revisão do engenheiro responsável",
      dataLiberacao: hoje,
      status: "LIBERADA",
      criadoPorId: gestor.id,
      aprovadoPorId: gestor.id,
      aprovadoPorNome: gestor.nome,
      aprovadoPorData: hoje,
    },
  });

  await prisma.etapaRisco.createMany({
    data: [
      {
        etapaId: etapaFundacao.id,
        risco: "Solo com umidade acima do esperado",
        probabilidade: "Média",
        impacto: "Atraso de 1-2 dias na escavação",
        acaoPreventiva: "Verificar previsão do tempo e preparar sistema de drenagem provisório",
      },
      {
        etapaId: etapaFundacao.id,
        risco: "Divergência entre projeto estrutural e terreno real",
        probabilidade: "Baixa",
        impacto: "Necessidade de revisão do engenheiro antes de concretar",
        acaoPreventiva: "Conferir cotas do projeto contra o levantamento topográfico antes de escavar",
      },
    ],
    skipDuplicates: true,
  });

  const diasExistentes = await prisma.etapaDiaPlanejado.count({
    where: { etapaId: etapaFundacao.id, data: hoje },
  });
  if (diasExistentes === 0) {
    await prisma.etapaDiaPlanejado.create({
      data: {
        etapaId: etapaFundacao.id,
        data: hoje,
        atividadePlanejada: "Escavação e preparo do solo para a fundação",
        responsavel: "Equipe Gabriel",
        preRequisito: "Terreno limpo e nivelado",
        subEtapas: {
          create: [
            { descricao: "Marcação dos eixos", ordem: 1 },
            { descricao: "Escavação manual/mecânica", ordem: 2 },
            { descricao: "Compactação do fundo da vala", ordem: 3 },
          ],
        },
      },
    });
    await prisma.etapaDiaPlanejado.create({
      data: {
        etapaId: etapaFundacao.id,
        data: hoje,
        atividadePlanejada: "Montagem de forma para concretagem",
        responsavel: "Equipe Gabriel",
        preRequisito: "Escavação concluída",
      },
    });
  }

  const [cimento, areia, brita, aco] = await Promise.all([
    prisma.material.upsert({
      where: { nome: "Cimento CP-II" },
      update: {},
      create: { nome: "Cimento CP-II", unidade: "saco 50kg" },
    }),
    prisma.material.upsert({
      where: { nome: "Areia média" },
      update: {},
      create: { nome: "Areia média", unidade: "m3" },
    }),
    prisma.material.upsert({
      where: { nome: "Brita 1" },
      update: {},
      create: { nome: "Brita 1", unidade: "m3" },
    }),
    prisma.material.upsert({
      where: { nome: "Aço CA-50 10mm" },
      update: {},
      create: { nome: "Aço CA-50 10mm", unidade: "barra 12m" },
    }),
  ]);

  const materiaisFundacaoExistentes = await prisma.materialPlanejado.count({
    where: { etapaId: etapaFundacao.id },
  });
  let materialCimentoPlanejado = null;
  if (materiaisFundacaoExistentes === 0) {
    materialCimentoPlanejado = await prisma.materialPlanejado.create({
      data: {
        materialId: cimento.id,
        etapaId: etapaFundacao.id,
        qtdPlanejada: 40,
        ondeUsado: "Concreto da fundação (sapatas e baldrame)",
        memorialCalculo:
          "Traço 1:2:3 — volume estimado de concreto 8m³ x consumo médio de 5 sacos/m³ = 40 sacos",
        valorUnitario: 32.9,
        valorTotal: 40 * 32.9,
        fornecedor: "Depósito São João",
        dataCompraPrevista: segunda,
        dataEntregaPrevista: hoje,
      },
    });
    await prisma.materialPlanejado.create({
      data: {
        materialId: areia.id,
        etapaId: etapaFundacao.id,
        qtdPlanejada: 6,
        ondeUsado: "Concreto da fundação",
        memorialCalculo: "8m³ de concreto x 0,75m³ de areia por m³ de traço ≈ 6m³",
        valorUnitario: 120,
        valorTotal: 6 * 120,
        fornecedor: "Depósito São João",
        dataCompraPrevista: segunda,
      },
    });
    await prisma.materialPlanejado.create({
      data: {
        materialId: brita.id,
        etapaId: etapaFundacao.id,
        qtdPlanejada: 8,
        ondeUsado: "Concreto da fundação",
        memorialCalculo: "8m³ de concreto x 1m³ de brita por m³ de traço = 8m³",
        valorUnitario: 135,
        valorTotal: 8 * 135,
        fornecedor: "Depósito São João",
        dataCompraPrevista: segunda,
      },
    });
    await prisma.materialPlanejado.create({
      data: {
        materialId: aco.id,
        etapaId: etapaFundacao.id,
        qtdPlanejada: 25,
        ondeUsado: "Armação das sapatas e baldrame",
        memorialCalculo: "Conforme projeto estrutural, 25 barras de 12m de aço CA-50 10mm",
        valorUnitario: 68.5,
        valorTotal: 25 * 68.5,
        fornecedor: "Aços Vitória",
        dataCompraPrevista: segunda,
        dataEntregaPrevista: hoje,
      },
    });
  }

  // Registrar compra de cimento (com sobra), demonstrando o fluxo completo
  if (materialCimentoPlanejado) {
    await prisma.$transaction(async (tx) => {
      await tx.materialPlanejado.update({
        where: { id: materialCimentoPlanejado.id },
        data: { qtdComprada: 45, qtdSobra: 5 },
      });
      await tx.movimentoEstoque.upsert({
        where: { origemCompraId: materialCimentoPlanejado.id },
        update: {},
        create: {
          materialId: cimento.id,
          tipo: "ENTRADA",
          quantidade: 45,
          origemTipo: "COMPRA_PLANEJAMENTO",
          origemCompraId: materialCimentoPlanejado.id,
        },
      });
    });
  }

  const maoDeObraExistente = await prisma.maoDeObra.count({
    where: { etapaId: etapaFundacao.id },
  });
  if (maoDeObraExistente === 0) {
    await prisma.maoDeObra.create({
      data: {
        semanaId: semana.id,
        etapaId: etapaFundacao.id,
        equipeOuEmpreiteiro: "Equipe Gabriel",
        servico: "Escavação, forma e armação da fundação",
        valorAcordado: 3500,
        formaPagamento: "Pix, ao final da etapa",
        dataPagamentoPrevista: sexta,
        status: "PENDENTE",
      },
    });
  }

  // ---------- Etapa 2: Alvenaria (Regra de Ouro ainda em rascunho) ----------

  const etapaAlvenaria =
    (await prisma.etapa.findFirst({ where: { semanaId: semana.id, nome: "Alvenaria" } })) ??
    (await prisma.etapa.create({
      data: {
        semanaId: semana.id,
        nome: "Alvenaria",
        descricao: "Levantamento das paredes externas e internas do térreo",
        ordem: 2,
      },
    }));

  await prisma.regraOuro.upsert({
    where: { etapaId: etapaAlvenaria.id },
    update: {},
    create: {
      etapaId: etapaAlvenaria.id,
      atividade: "Alvenaria — térreo",
      escopoDetalhado:
        "Levantar paredes externas e internas do térreo conforme projeto arquitetônico",
      tempoEstimado: "8 dias úteis",
      valorFechado: 6000,
      condicaoMeta: "Fundação concluída e curada (mínimo 7 dias)",
      status: "RASCUNHO",
      criadoPorId: gestor.id,
    },
  });

  const diaAlvenariaExistente = await prisma.etapaDiaPlanejado.count({
    where: { etapaId: etapaAlvenaria.id },
  });
  if (diaAlvenariaExistente === 0) {
    const proximaSegunda = new Date(segunda);
    proximaSegunda.setUTCDate(segunda.getUTCDate() + 7);
    await prisma.etapaDiaPlanejado.create({
      data: {
        etapaId: etapaAlvenaria.id,
        data: proximaSegunda,
        atividadePlanejada: "Marcação e primeira fiada das paredes externas",
        responsavel: "Equipe Gabriel",
        preRequisito: "Fundação curada, Regra de Ouro liberada",
      },
    });
  }

  // ---------- Visita técnica + pendência ----------

  const visitaExistente = await prisma.visitaTecnica.count({ where: { semanaId: semana.id } });
  if (visitaExistente === 0) {
    const visita = await prisma.visitaTecnica.create({
      data: {
        semanaId: semana.id,
        data: hoje,
        hora: new Date("1970-01-01T09:30:00.000Z"),
        motivo: "Vistoria de rotina do engenheiro responsável",
        problemasEncontrados:
          "Pequena divergência no nível do terreno próximo ao eixo C",
        solicitacoesFeitas: "Conferir nível antes de concretar o eixo C",
      },
    });

    await prisma.correcaoPendencia.create({
      data: {
        dataIdentificacao: hoje,
        origemTipo: "VISITA",
        visitaId: visita.id,
        etapaId: etapaFundacao.id,
        problemaOuSolicitacao: "Nível do terreno no eixo C fora da cota do projeto",
        correcaoAprovada: "Regularizar com compactação adicional antes da concretagem",
        status: "ABERTA",
      },
    });
  }

  console.log("Seed concluído:", {
    semana: semana.id,
    etapaFundacao: etapaFundacao.id,
    etapaAlvenaria: etapaAlvenaria.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
