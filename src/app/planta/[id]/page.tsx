import { getPlanta } from "@/actions/planta.actions";
import { PlantaDetailClient } from "@/components/planta/planta-detail-client";

export const dynamic = "force-dynamic";

export default async function PlantaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlanta(id);
  return <PlantaDetailClient data={data} />;
}
