import { getDiarioHoje } from "@/actions/diario.actions";
import { DiarioClient } from "@/components/diario/diario-client";

export default async function DiarioPage() {
  const data = await getDiarioHoje();
  return <DiarioClient data={data} />;
}
