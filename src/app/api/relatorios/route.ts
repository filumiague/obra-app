import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRelatorioData } from "@/lib/reports/data";
import { buildPdf } from "@/lib/reports/pdf/build";
import { buildDocx } from "@/lib/reports/docx/build";
import { buildXlsx } from "@/lib/reports/xlsx/build";
import { startOfDayUTC } from "@/lib/date";

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const tipoParam = (searchParams.get("tipo") ?? "parcial").toUpperCase();
  const formatoParam = (searchParams.get("formato") ?? "pdf").toLowerCase();
  const diarioObraIdParam = searchParams.get("diarioObraId");

  if (tipoParam !== "PARCIAL" && tipoParam !== "COMPLETO") {
    return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
  }
  if (!["pdf", "docx", "xlsx"].includes(formatoParam)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  let diarioObraId = diarioObraIdParam;
  if (!diarioObraId) {
    const hoje = startOfDayUTC(new Date());
    const diarioHoje = await prisma.diarioObra.findUnique({ where: { data: hoje } });
    if (!diarioHoje) {
      return NextResponse.json(
        { error: "Nenhum diário encontrado para hoje." },
        { status: 404 },
      );
    }
    diarioObraId = diarioHoje.id;
  }

  const diario = await prisma.diarioObra.findUnique({ where: { id: diarioObraId } });
  if (!diario) {
    return NextResponse.json({ error: "Diário não encontrado." }, { status: 404 });
  }

  if (tipoParam === "COMPLETO" && diario.avaliacaoNota === null) {
    return NextResponse.json(
      { error: "Feche o dia (avaliação) antes de gerar o relatório completo." },
      { status: 400 },
    );
  }

  const tipo = tipoParam;
  const reportData = await getRelatorioData(diarioObraId, tipo);

  let buffer: Buffer;
  if (formatoParam === "pdf") buffer = await buildPdf(reportData);
  else if (formatoParam === "docx") buffer = await buildDocx(reportData);
  else buffer = await buildXlsx(reportData);

  const dateStr = reportData.data.toISOString().slice(0, 10);
  const filename = `relatorio-${tipo.toLowerCase()}-${dateStr}.${formatoParam}`;

  const admin = createAdminClient();
  const storagePath = `${diarioObraId}/${Date.now()}-${filename}`;
  await admin.storage.from("relatorios").upload(storagePath, buffer, {
    contentType: CONTENT_TYPES[formatoParam],
  });

  await prisma.relatorio.create({
    data: {
      tipo,
      formato: formatoParam.toUpperCase() as "PDF" | "DOCX" | "XLSX",
      diarioObraId,
      geradoPorId: user.id,
      storagePath,
    },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[formatoParam],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
