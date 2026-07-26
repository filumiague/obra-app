import { redirect } from "next/navigation";
import { getDiarioHoje } from "@/actions/diario.actions";

export const dynamic = "force-dynamic";

export default async function DiarioPage() {
  const data = await getDiarioHoje();
  redirect(`/diario/${data.diario.id}`);
}
