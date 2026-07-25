import { getDiarioHoje } from "@/actions/diario.actions";
import { ImprevistoForm } from "@/components/diario/imprevisto-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function ImprevistoPage() {
  const { imprevistos } = await getDiarioHoje();

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold">Reportar imprevisto</h1>
        <p className="text-sm text-muted-foreground">
          Registre rapidamente qualquer imprevisto do dia.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ImprevistoForm />
        </CardContent>
      </Card>

      {imprevistos.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Imprevistos de hoje</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {imprevistos.map((i) => (
              <div key={i.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{i.descricao}</span>
                  <span className="text-xs text-muted-foreground">
                    {i.gravidade} · {i.urgencia}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
