import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listDiarios } from "@/actions/diario.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HistoricoDiariosPage() {
  const diarios = await listDiarios();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" render={<Link href="/diario" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-semibold">Diários anteriores</h1>
      </div>

      {diarios.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nenhum diário registrado ainda.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {diarios.map((d) => {
          const dataFormatada = new Date(d.data).toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC",
          });
          const horaFormatada = new Date(d.updatedAt).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <Link key={d.id} href={`/diario/${d.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold capitalize">
                      {dataFormatada} · {horaFormatada}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.etapas.length > 0 ? d.etapas.join(", ") : "Sem atividade registrada"}
                    </p>
                  </div>
                  {d.avaliacaoNota && (
                    <div className="shrink-0 text-xs font-medium text-muted-foreground">
                      Nota {d.avaliacaoNota}/5
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
