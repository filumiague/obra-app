import ExcelJS from "exceljs";
import {
  formatDate,
  formatDateTime,
  statusLabel,
  type RelatorioData,
} from "@/lib/reports/data";

export async function buildXlsx(data: RelatorioData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Controle de Obra";
  wb.created = new Date();

  const resumo = wb.addWorksheet("Resumo");
  resumo.addRow([
    data.tipo === "PARCIAL" ? "Relatório Parcial" : "Relatório Completo do Dia",
  ]);
  resumo.addRow([`Obra — ${formatDate(data.data)}`]);
  if (data.tipo === "PARCIAL") {
    resumo.addRow([
      `PARCIAL — gerado em ${formatDateTime(data.geradoEm)}. Não substitui o relatório completo do dia.`,
    ]);
  }

  const atividades = wb.addWorksheet("Atividades");
  atividades.columns = [
    { header: "Etapa", key: "etapa", width: 20 },
    { header: "Atividade", key: "atividade", width: 40 },
    { header: "Status", key: "status", width: 16 },
    { header: "O que foi feito", key: "oQueFoiFeito", width: 40 },
    { header: "Motivo/Impacto", key: "motivoImpacto", width: 40 },
  ];
  for (const a of data.atividades) {
    atividades.addRow({
      etapa: a.etapaNome,
      atividade: a.atividadePlanejada,
      status: statusLabel(a.status),
      oQueFoiFeito: a.oQueFoiFeito ?? "",
      motivoImpacto: a.motivoImpacto ?? "",
    });
  }

  const materiais = wb.addWorksheet("Material usado");
  materiais.columns = [
    { header: "Material", key: "nome", width: 30 },
    { header: "Quantidade", key: "quantidade", width: 15 },
    { header: "Unidade", key: "unidade", width: 15 },
  ];
  for (const m of data.materiaisUsados) {
    materiais.addRow({
      nome: m.nome,
      quantidade: m.quantidade,
      unidade: m.unidade,
    });
  }

  const imprevistos = wb.addWorksheet("Imprevistos");
  imprevistos.columns = [
    { header: "Descrição", key: "descricao", width: 50 },
    { header: "Gravidade", key: "gravidade", width: 12 },
    { header: "Urgência", key: "urgencia", width: 12 },
    { header: "O que precisa", key: "oQuePrecisa", width: 16 },
    { header: "Data/hora", key: "dataHora", width: 20 },
  ];
  for (const imp of data.imprevistos) {
    imprevistos.addRow({
      descricao: imp.descricao,
      gravidade: imp.gravidade,
      urgencia: imp.urgencia,
      oQuePrecisa: imp.oQuePrecisa,
      dataHora: formatDateTime(imp.dataHora),
    });
  }

  if (data.avaliacao) {
    const aval = wb.addWorksheet("Avaliação");
    aval.addRow(["Nota", data.avaliacao.nota]);
    aval.addRow(["Aderência ao planejado", data.avaliacao.aderencia ?? ""]);
    aval.addRow(["Qualidade", data.avaliacao.qualidade ?? ""]);
    aval.addRow(["Organização", data.avaliacao.organizacao ?? ""]);
    aval.addRow(["Segurança", data.avaliacao.seguranca ?? ""]);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
