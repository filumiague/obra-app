import { listPlantas } from "@/actions/planta.actions";
import { PlantasListClient } from "@/components/planta/plantas-list-client";

export const dynamic = "force-dynamic";

export default async function PlantaPage() {
  const plantas = await listPlantas();
  return <PlantasListClient plantas={plantas} />;
}
