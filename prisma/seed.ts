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

  const existing = await prisma.etapaDiaPlanejado.findFirst({
    where: { data: hoje },
  });
  if (existing) {
    console.log("Seed já existe para hoje, nada a fazer.");
    return;
  }

  const semana = await prisma.semanaPlanejamento.create({
    data: {
      dataInicio: segunda,
      dataFim: sexta,
      preenchidoPorId: gestor.id,
      descricaoAtividadePrincipal: "Fundação e infraestrutura",
      objetivo: "Concluir escavação e armação da fundação",
    },
  });

  const etapa = await prisma.etapa.create({
    data: {
      semanaId: semana.id,
      nome: "Fundação",
      descricao: "Escavação, forma e armação da fundação",
      ordem: 1,
    },
  });

  await prisma.regraOuro.create({
    data: {
      etapaId: etapa.id,
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

  const diaPlanejado = await prisma.etapaDiaPlanejado.create({
    data: {
      etapaId: etapa.id,
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

  const diaPlanejado2 = await prisma.etapaDiaPlanejado.create({
    data: {
      etapaId: etapa.id,
      data: hoje,
      atividadePlanejada: "Montagem de forma para concretagem",
      responsavel: "Equipe Gabriel",
      preRequisito: "Escavação concluída",
    },
  });

  const materiais = await Promise.all([
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

  console.log("Seed concluído:", {
    semana: semana.id,
    etapa: etapa.id,
    diasPlanejados: [diaPlanejado.id, diaPlanejado2.id],
    materiais: materiais.map((m) => m.nome),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
