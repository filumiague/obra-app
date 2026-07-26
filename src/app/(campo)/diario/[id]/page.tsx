import { getDiarioPorId } from "@/actions/diario.actions";
import { DiarioClient } from "@/components/diario/diario-client";

export const dynamic = "force-dynamic";

export default async function DiarioPorIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDiarioPorId(id);
  return <DiarioClient data={data} />;
}
