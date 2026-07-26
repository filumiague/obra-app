"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSignedMidiaUrl } from "@/lib/supabase/admin";
import { startOfDayUTC } from "@/lib/date";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

async function getOrCreateDiarioHoje(preenchidoPorId: string) {
  const hoje = startOfDayUTC(new Date());
  return prisma.diarioObra.upsert({
    where: { data: hoje },
    update: {},
    create: { data: hoje, preenchidoPorId },
  });
}

export async function getDiarioHoje() {
  const user = await requireUser();
  const diario = await getOrCreateDiarioHoje(user.id);
  return getDiarioPorId(diario.id);
}

export async function criarDiario(dataStr: string) {
  const user = await requireUser();
  const data = startOfDayUTC(new Date(`${dataStr}T00:00:00Z`));
  const diario = await prisma.diarioObra.upsert({
    where: { data },
    update: {},
    create: { data, preenchidoPorId: user.id },
  });
  revalidatePath("/diario/historico");
  redirect(`/diario/${diario.id}`);
}

export async function apagarDiario(diarioObraId: string) {
  await requireUser();
  await prisma.$transaction(async (tx) => {
    const usos = await tx.materialUsoDiario.findMany({
      where: { diarioObraId },
      select: { id: true },
    });
    const usoIds = usos.map((u) => u.id);
    if (usoIds.length) {
      await tx.movimentoEstoque.deleteMany({ where: { origemUsoDiarioId: { in: usoIds } } });
    }
    await tx.relatorio.deleteMany({ where: { diarioObraId } });
    await tx.diarioObra.delete({ where: { id: diarioObraId } });
  });
  revalidatePath("/diario/historico");
  redirect("/diario/historico");
}

export async function listDiarios() {
  await requireUser();
  const diarios = await prisma.diarioObra.findMany({
    orderBy: { data: "desc" },
    include: {
      atividades: {
        include: { etapaDiaPlanejado: { include: { etapa: true } } },
      },
    },
  });
  return diarios.map((d) => ({
    id: d.id,
    data: d.data,
    updatedAt: d.updatedAt,
    etapas: Array.from(new Set(d.atividades.map((a) => a.etapaDiaPlanejado.etapa.nome))),
    avaliacaoNota: d.avaliacaoNota,
  }));
}

export async function getDiarioPorId(diarioObraId: string) {
  await requireUser();
  const diario = await prisma.diarioObra.findUniqueOrThrow({ where: { id: diarioObraId } });
  const dia = startOfDayUTC(new Date(diario.data));

  const itensPlanejados = await prisma.etapaDiaPlanejado.findMany({
    where: { data: dia, etapa: { regraOuro: { status: "LIBERADA" } } },
    include: {
      etapa: true,
      subEtapas: { orderBy: { ordem: "asc" } },
      atividadeDiario: {
        where: { diarioObraId: diario.id },
        include: { midias: { orderBy: { timestamp: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const itensComMidiaUrl = await Promise.all(
    itensPlanejados.map(async (item) => ({
      ...item,
      atividadeDiario: await Promise.all(
        item.atividadeDiario.map(async (a) => ({
          ...a,
          midias: await Promise.all(
            a.midias.map(async (m) => ({
              ...m,
              url: await getSignedMidiaUrl(m.storagePath),
            })),
          ),
        })),
      ),
    })),
  );

  const materiais = await prisma.material.findMany({ orderBy: { nome: "asc" } });

  const materiaisUsadosRaw = await prisma.materialUsoDiario.findMany({
    where: { diarioObraId: diario.id },
    include: { material: true },
    orderBy: { createdAt: "desc" },
  });
  // Prisma's Decimal isn't a plain object, so it can't cross the RSC boundary as-is.
  const materiaisUsados = materiaisUsadosRaw.map((m) => ({
    ...m,
    quantidade: m.quantidade.toNumber(),
  }));

  const imprevistosRaw = await prisma.imprevisto.findMany({
    where: { diarioObraId: diario.id },
    orderBy: { dataHora: "desc" },
  });
  const imprevistos = await Promise.all(
    imprevistosRaw.map(async (i) => ({
      ...i,
      fotoUrl: i.fotoStoragePath ? await getSignedMidiaUrl(i.fotoStoragePath) : null,
    })),
  );

  return {
    diario,
    itensPlanejados: itensComMidiaUrl,
    materiais,
    materiaisUsados,
    imprevistos,
  };
}

export async function updateAtividadeStatus(input: {
  diarioObraId: string;
  etapaDiaPlanejadoId: string;
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "PARCIAL" | "NAO_REALIZADO";
  oQueFoiFeito: string | null;
  motivoImpacto: string | null;
}) {
  await requireUser();

  const plano = await prisma.etapaDiaPlanejado.findUniqueOrThrow({
    where: { id: input.etapaDiaPlanejadoId },
    include: { etapa: { include: { regraOuro: true } } },
  });
  if (plano.etapa.regraOuro?.status !== "LIBERADA") {
    return { error: "Esta etapa ainda não foi liberada (Regra de Ouro)." };
  }

  if (
    (input.status === "PARCIAL" || input.status === "NAO_REALIZADO") &&
    !input.motivoImpacto?.trim()
  ) {
    return { error: "Motivo/impacto é obrigatório quando o status é parcial ou não realizado." };
  }

  const diario = await prisma.diarioObra.findUniqueOrThrow({ where: { id: input.diarioObraId } });

  await prisma.diarioAtividade.upsert({
    where: {
      diarioObraId_etapaDiaPlanejadoId: {
        diarioObraId: diario.id,
        etapaDiaPlanejadoId: input.etapaDiaPlanejadoId,
      },
    },
    update: {
      status: input.status,
      oQueFoiFeito: input.oQueFoiFeito,
      motivoImpacto: input.motivoImpacto,
    },
    create: {
      diarioObraId: diario.id,
      etapaDiaPlanejadoId: input.etapaDiaPlanejadoId,
      status: input.status,
      oQueFoiFeito: input.oQueFoiFeito,
      motivoImpacto: input.motivoImpacto,
    },
  });

  revalidatePath("/diario");
  return { error: null };
}

export async function addMidia(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? String(formData.get("id")) : randomUUID();
  const diarioObraId = String(formData.get("diarioObraId"));
  const etapaDiaPlanejadoId = String(formData.get("etapaDiaPlanejadoId"));
  const legenda = formData.get("legenda") ? String(formData.get("legenda")) : null;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) return { error: "Nenhum arquivo selecionado." };

  // Idempotent replay: if the offline sync retries this item, don't re-upload.
  const existing = await prisma.midia.findUnique({ where: { id } });
  if (existing) {
    revalidatePath("/diario");
    return { error: null };
  }

  const plano = await prisma.etapaDiaPlanejado.findUniqueOrThrow({
    where: { id: etapaDiaPlanejadoId },
    include: { etapa: { include: { regraOuro: true } } },
  });
  if (plano.etapa.regraOuro?.status !== "LIBERADA") {
    return { error: "Esta etapa ainda não foi liberada (Regra de Ouro)." };
  }

  const diario = await prisma.diarioObra.findUniqueOrThrow({ where: { id: diarioObraId } });

  const atividade = await prisma.diarioAtividade.upsert({
    where: {
      diarioObraId_etapaDiaPlanejadoId: {
        diarioObraId: diario.id,
        etapaDiaPlanejadoId,
      },
    },
    update: {},
    create: {
      diarioObraId: diario.id,
      etapaDiaPlanejadoId,
      status: "NAO_INICIADO",
    },
  });

  const tipo = file.type.startsWith("video") ? "VIDEO" : "FOTO";
  const ext = file.name.split(".").pop() || (tipo === "VIDEO" ? "mp4" : "jpg");
  const path = `${diario.id}/${atividade.id}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("midias")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: `Falha no upload: ${uploadError.message}` };

  await prisma.midia.create({
    data: {
      id,
      diarioAtividadeId: atividade.id,
      tipo,
      storagePath: path,
      legenda,
    },
  });

  revalidatePath("/diario");
  return { error: null };
}

export async function criarMaterial(input: { nome: string; unidade: string }) {
  await requireUser();
  const nome = input.nome.trim();
  const unidade = input.unidade.trim();
  if (!nome || !unidade) {
    return { error: "Informe nome e unidade do material." };
  }
  const material = await prisma.material.upsert({
    where: { nome },
    update: {},
    create: { nome, unidade },
  });
  revalidatePath("/diario");
  return { error: null, material };
}

export async function addMaterialUso(input: {
  id?: string;
  diarioObraId: string;
  materialId: string;
  quantidade: number;
}) {
  await requireUser();
  if (!input.materialId || !(input.quantidade > 0)) {
    return { error: "Selecione um material e uma quantidade válida." };
  }

  const diario = await prisma.diarioObra.findUniqueOrThrow({ where: { id: input.diarioObraId } });
  const id = input.id ?? randomUUID();

  await prisma.$transaction(async (tx) => {
    const uso = await tx.materialUsoDiario.upsert({
      where: { id },
      update: {},
      create: {
        id,
        diarioObraId: diario.id,
        materialId: input.materialId,
        quantidade: input.quantidade,
      },
    });
    await tx.movimentoEstoque.upsert({
      where: { origemUsoDiarioId: uso.id },
      update: {},
      create: {
        materialId: input.materialId,
        tipo: "SAIDA",
        quantidade: input.quantidade,
        origemTipo: "USO_DIARIO",
        origemUsoDiarioId: uso.id,
      },
    });
  });

  revalidatePath("/diario");
  return { error: null };
}

export async function addImprevisto(formData: FormData) {
  await requireUser();
  const id = formData.get("id") ? String(formData.get("id")) : randomUUID();
  const diarioObraId = String(formData.get("diarioObraId"));
  const descricao = String(formData.get("descricao") ?? "").trim();
  const gravidade = String(formData.get("gravidade") ?? "");
  const urgencia = String(formData.get("urgencia") ?? "");
  const oQuePrecisa = String(formData.get("oQuePrecisa") ?? "");
  const file = formData.get("file") as File | null;

  if (!descricao) return { error: "Descreva o imprevisto." };

  // Idempotent replay: if the offline sync retries this item, don't re-upload.
  const existing = await prisma.imprevisto.findUnique({ where: { id } });
  if (existing) {
    revalidatePath("/diario");
    revalidatePath("/imprevisto");
    return { error: null };
  }

  const user = await requireUser();
  const diario = diarioObraId
    ? await prisma.diarioObra.findUniqueOrThrow({ where: { id: diarioObraId } })
    : await getOrCreateDiarioHoje(user.id);

  let fotoStoragePath: string | null = null;
  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `imprevistos/${diario.id}/${randomUUID()}.${ext}`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("midias")
      .upload(path, file, { contentType: file.type });
    if (uploadError) return { error: `Falha no upload: ${uploadError.message}` };
    fotoStoragePath = path;
  }

  await prisma.imprevisto.create({
    data: {
      id,
      diarioObraId: diario.id,
      descricao,
      gravidade: gravidade as "BAIXA" | "MEDIA" | "ALTA",
      urgencia: urgencia as "BAIXA" | "MEDIA" | "ALTA",
      oQuePrecisa: oQuePrecisa as "MATERIAL" | "DECISAO" | "MAO_DE_OBRA" | "OUTRO",
      fotoStoragePath,
    },
  });

  revalidatePath("/diario");
  revalidatePath("/imprevisto");
  return { error: null };
}

export async function setAvaliacaoDia(input: {
  diarioObraId: string;
  nota: number;
  aderencia: string;
  qualidade: string;
  organizacao: string;
  seguranca: string;
}) {
  await requireUser();

  await prisma.diarioObra.update({
    where: { id: input.diarioObraId },
    data: {
      avaliacaoNota: input.nota,
      avaliacaoAderencia: input.aderencia || null,
      avaliacaoQualidade: input.qualidade || null,
      avaliacaoOrganizacao: input.organizacao || null,
      avaliacaoSeguranca: input.seguranca || null,
    },
  });

  revalidatePath("/diario");
  return { error: null };
}
