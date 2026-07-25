import {
  getSemana,
  getChecklistEtapaPagamento,
} from "@/actions/planejamento.actions";
import { getCurrentUser } from "@/actions/auth.actions";
import { serializeDecimals } from "@/lib/serialize";
import { SemanaDetail } from "@/components/planejamento/semana-detail";

export default async function SemanaPage({
  params,
}: {
  params: Promise<{ semanaId: string }>;
}) {
  const { semanaId } = await params;
  const semana = await getSemana(semanaId);
  const checklist = await getChecklistEtapaPagamento(semanaId);
  const user = await getCurrentUser();

  return (
    <SemanaDetail
      semana={serializeDecimals(semana)}
      checklist={checklist}
      isEngenheiro={user.isEngenheiro}
    />
  );
}
