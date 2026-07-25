import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  formatDate,
  formatDateTime,
  statusLabel,
  type RelatorioData,
} from "@/lib/reports/data";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 11, color: "#555555", marginBottom: 10 },
  watermark: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: 6,
    marginBottom: 12,
    fontSize: 10,
    fontWeight: 700,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 14,
    marginBottom: 6,
    borderBottom: "1pt solid #cccccc",
    paddingBottom: 3,
  },
  card: {
    border: "1pt solid #dddddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontWeight: 700 },
  muted: { color: "#666666" },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  mediaImg: { width: 80, height: 80, borderRadius: 4, objectFit: "cover" },
});

function RelatorioDocument({ data }: { data: RelatorioData }) {
  const titulo =
    data.tipo === "PARCIAL" ? "Relatório Parcial" : "Relatório Completo do Dia";

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={styles.subtitle}>Obra — {formatDate(data.data)}</Text>

        {data.tipo === "PARCIAL" && (
          <Text style={styles.watermark}>
            PARCIAL — gerado em {formatDateTime(data.geradoEm)}. Não substitui
            o relatório completo do dia.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Atividades</Text>
        {data.atividades.length === 0 && (
          <Text style={styles.muted}>Nenhuma atividade registrada.</Text>
        )}
        {data.atividades.map((a, i) => (
          <View key={i} style={styles.card} wrap={false}>
            <View style={styles.row}>
              <Text style={styles.label}>
                {a.etapaNome} — {a.atividadePlanejada}
              </Text>
              <Text>{statusLabel(a.status)}</Text>
            </View>
            {a.oQueFoiFeito && <Text>O que foi feito: {a.oQueFoiFeito}</Text>}
            {a.motivoImpacto && (
              <Text>Motivo/impacto: {a.motivoImpacto}</Text>
            )}
            {a.midias.length > 0 && (
              <View style={styles.mediaRow}>
                {a.midias
                  .filter((m) => m.tipo === "FOTO" && m.url)
                  .map((m, j) => (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image key={j} style={styles.mediaImg} src={m.url!} />
                  ))}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Material usado</Text>
        {data.materiaisUsados.length === 0 && (
          <Text style={styles.muted}>Nenhum material registrado.</Text>
        )}
        {data.materiaisUsados.map((m, i) => (
          <View key={i} style={styles.row}>
            <Text>{m.nome}</Text>
            <Text>
              {m.quantidade} {m.unidade}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Imprevistos</Text>
        {data.imprevistos.length === 0 && (
          <Text style={styles.muted}>Nenhum imprevisto registrado.</Text>
        )}
        {data.imprevistos.map((imp, i) => (
          <View key={i} style={styles.card} wrap={false}>
            <Text>{imp.descricao}</Text>
            <Text style={styles.muted}>
              Gravidade: {imp.gravidade} · Urgência: {imp.urgencia} · Precisa:{" "}
              {imp.oQuePrecisa} · {formatDateTime(imp.dataHora)}
            </Text>
            {imp.fotoUrl && (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image style={styles.mediaImg} src={imp.fotoUrl} />
            )}
          </View>
        ))}

        {data.avaliacao && (
          <>
            <Text style={styles.sectionTitle}>Avaliação do dia</Text>
            <Text>Nota: {data.avaliacao.nota} / 5</Text>
            {data.avaliacao.aderencia && (
              <Text>Aderência ao planejado: {data.avaliacao.aderencia}</Text>
            )}
            {data.avaliacao.qualidade && (
              <Text>Qualidade: {data.avaliacao.qualidade}</Text>
            )}
            {data.avaliacao.organizacao && (
              <Text>Organização: {data.avaliacao.organizacao}</Text>
            )}
            {data.avaliacao.seguranca && (
              <Text>Segurança: {data.avaliacao.seguranca}</Text>
            )}
          </>
        )}
      </Page>
    </Document>
  );
}

export async function buildPdf(data: RelatorioData): Promise<Buffer> {
  return renderToBuffer(<RelatorioDocument data={data} />);
}
