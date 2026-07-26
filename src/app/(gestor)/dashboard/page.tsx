import { getDashboardData } from "@/actions/dashboard.actions";
import { serializeDecimals } from "@/lib/serialize";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

// Aggregates live data from every module — never prerender this.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardClient data={serializeDecimals(data)} />;
}
