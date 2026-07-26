"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSignedMidiaUrl } from "@/lib/supabase/admin";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function listPlantas() {
  await requireUser();
  const plantas = await prisma.plantaObra.findMany({ orderBy: { createdAt: "desc" } });
  return Promise.all(
    plantas.map(async (p) => ({
      ...p,
      url: await getSignedMidiaUrl(p.storagePath),
    })),
  );
}

export async function getPlanta(plantaId: string) {
  await requireUser();
  const planta = await prisma.plantaObra.findUniqueOrThrow({ where: { id: plantaId } });
  const anotacoesRaw = await prisma.anotacaoPlanta.findMany({
    where: { plantaId },
    orderBy: { createdAt: "desc" },
    include: { etapa: true, imprevisto: true, criadoPor: true },
  });
  const anotacoes = await Promise.all(
    anotacoesRaw.map(async (a) => ({ ...a, url: await getSignedMidiaUrl(a.storagePath) })),
  );

  const etapas = await prisma.etapa.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });
  const imprevistos = await prisma.imprevisto.findMany({
    select: { id: true, descricao: true, dataHora: true },
    orderBy: { dataHora: "desc" },
    take: 30,
  });

  return {
    planta: { ...planta, url: await getSignedMidiaUrl(planta.storagePath) },
    anotacoes,
    etapas,
    imprevistos,
  };
}

export async function uploadPlanta(formData: FormData) {
  await requireUser();
  const nome = String(formData.get("nome") ?? "").trim();
  const file = formData.get("file") as File | null;
  if (!nome) return { error: "Informe um nome para a planta." };
  if (!file || file.size === 0) return { error: "Selecione um arquivo de imagem." };

  const ext = file.name.split(".").pop() || "png";
  const path = `plantas/${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("midias")
    .upload(path, file, { contentType: file.type });
  if (uploadError) return { error: `Falha no upload: ${uploadError.message}` };

  const planta = await prisma.plantaObra.create({ data: { nome, storagePath: path } });
  revalidatePath("/planta");
  return { error: null, plantaId: planta.id };
}

export async function apagarPlanta(plantaId: string) {
  await requireUser();
  const planta = await prisma.plantaObra.findUniqueOrThrow({ where: { id: plantaId } });
  const anotacoes = await prisma.anotacaoPlanta.findMany({ where: { plantaId } });

  const admin = createAdminClient();
  const paths = [planta.storagePath, ...anotacoes.map((a) => a.storagePath)];
  if (paths.length) await admin.storage.from("midias").remove(paths);

  await prisma.plantaObra.delete({ where: { id: plantaId } });
  revalidatePath("/planta");
  redirect("/planta");
}

export async function addAnotacao(input: {
  plantaId: string;
  imageDataUrl: string;
  etapaId?: string | null;
  imprevistoId?: string | null;
}) {
  const user = await requireUser();
  const matches = /^data:(image\/png);base64,(.+)$/.exec(input.imageDataUrl);
  if (!matches) return { error: "Imagem inválida." };
  const buffer = Buffer.from(matches[2], "base64");

  const path = `plantas/${input.plantaId}/anotacoes/${randomUUID()}.png`;
  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("midias")
    .upload(path, buffer, { contentType: "image/png" });
  if (uploadError) return { error: `Falha no upload: ${uploadError.message}` };

  await prisma.anotacaoPlanta.create({
    data: {
      plantaId: input.plantaId,
      storagePath: path,
      etapaId: input.etapaId || null,
      imprevistoId: input.imprevistoId || null,
      criadoPorId: user.id,
    },
  });

  revalidatePath("/planta");
  return { error: null };
}

export async function apagarAnotacao(id: string) {
  await requireUser();
  const anotacao = await prisma.anotacaoPlanta.findUniqueOrThrow({ where: { id } });
  const admin = createAdminClient();
  await admin.storage.from("midias").remove([anotacao.storagePath]);
  await prisma.anotacaoPlanta.delete({ where: { id } });
  revalidatePath("/planta");
  return { error: null };
}
