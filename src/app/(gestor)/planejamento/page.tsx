import Link from "next/link";
import { getSemanas } from "@/actions/planejamento.actions";
import { NovaSemanaForm } from "@/components/planejamento/nova-semana-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default async function PlanejamentoPage() {
  const semanas = await getSemanas();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Planejamento Semanal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Semanas cadastradas, do mais recente para o mais antigo.
          </p>
        </div>
        <NovaSemanaForm />
      </div>

      {semanas.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nenhuma semana cadastrada ainda.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {semanas.map((s) => (
          <Link key={s.id} href={`/planejamento/${s.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <h2 className="font-semibold">{s.descricaoAtividadePrincipal}</h2>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.dataInicio)} — {formatDate(s.dataFim)}
                  </p>
                </div>
              </CardHeader>
              {s.objetivo && (
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {s.objetivo}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
