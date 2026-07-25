import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
} from "docx";
import {
  formatDate,
  formatDateTime,
  statusLabel,
  type RelatorioData,
} from "@/lib/reports/data";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function buildDocx(data: RelatorioData): Promise<Buffer> {
  const titulo =
    data.tipo === "PARCIAL" ? "Relatório Parcial" : "Relatório Completo do Dia";
  const children: Paragraph[] = [];

  children.push(new Paragraph({ text: titulo, heading: HeadingLevel.TITLE }));
  children.push(new Paragraph({ text: `Obra — ${formatDate(data.data)}` }));

  if (data.tipo === "PARCIAL") {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `PARCIAL — gerado em ${formatDateTime(data.geradoEm)}. Não substitui o relatório completo do dia.`,
            bold: true,
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({ text: "Atividades", heading: HeadingLevel.HEADING_1 }),
  );
  if (data.atividades.length === 0) {
    children.push(new Paragraph({ text: "Nenhuma atividade registrada." }));
  }
  for (const a of data.atividades) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${a.etapaNome} — ${a.atividadePlanejada} (${statusLabel(a.status)})`,
            bold: true,
          }),
        ],
      }),
    );
    if (a.oQueFoiFeito) {
      children.push(new Paragraph({ text: `O que foi feito: ${a.oQueFoiFeito}` }));
    }
    if (a.motivoImpacto) {
      children.push(new Paragraph({ text: `Motivo/impacto: ${a.motivoImpacto}` }));
    }
    for (const m of a.midias) {
      if (m.tipo === "FOTO" && m.url) {
        const buf = await fetchImageBuffer(m.url);
        if (buf) {
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  type: "png",
                  data: buf,
                  transformation: { width: 150, height: 150 },
                }),
              ],
            }),
          );
        }
      }
    }
  }

  children.push(
    new Paragraph({ text: "Material usado", heading: HeadingLevel.HEADING_1 }),
  );
  if (data.materiaisUsados.length === 0) {
    children.push(new Paragraph({ text: "Nenhum material registrado." }));
  }
  for (const m of data.materiaisUsados) {
    children.push(
      new Paragraph({ text: `${m.nome}: ${m.quantidade} ${m.unidade}` }),
    );
  }

  children.push(
    new Paragraph({ text: "Imprevistos", heading: HeadingLevel.HEADING_1 }),
  );
  if (data.imprevistos.length === 0) {
    children.push(new Paragraph({ text: "Nenhum imprevisto registrado." }));
  }
  for (const imp of data.imprevistos) {
    children.push(new Paragraph({ text: imp.descricao }));
    children.push(
      new Paragraph({
        text: `Gravidade: ${imp.gravidade} · Urgência: ${imp.urgencia} · Precisa: ${imp.oQuePrecisa} · ${formatDateTime(imp.dataHora)}`,
      }),
    );
  }

  if (data.avaliacao) {
    children.push(
      new Paragraph({ text: "Avaliação do dia", heading: HeadingLevel.HEADING_1 }),
    );
    children.push(new Paragraph({ text: `Nota: ${data.avaliacao.nota} / 5` }));
    if (data.avaliacao.aderencia) {
      children.push(
        new Paragraph({ text: `Aderência ao planejado: ${data.avaliacao.aderencia}` }),
      );
    }
    if (data.avaliacao.qualidade) {
      children.push(new Paragraph({ text: `Qualidade: ${data.avaliacao.qualidade}` }));
    }
    if (data.avaliacao.organizacao) {
      children.push(
        new Paragraph({ text: `Organização: ${data.avaliacao.organizacao}` }),
      );
    }
    if (data.avaliacao.seguranca) {
      children.push(new Paragraph({ text: `Segurança: ${data.avaliacao.seguranca}` }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
