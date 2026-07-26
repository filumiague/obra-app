import { getDiarioHoje } from "@/actions/diario.actions";
import { ImprevistoForm } from "@/components/diario/imprevisto-form";
import { ImprevistosList } from "@/components/diario/diario-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function ImprevistoPage() {
  const { diario, imprevistos } = await getDiarioHoje();

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
          <ImprevistoForm diarioObraId={diario.id} />
        </CardContent>
      </Card>

      {imprevistos.length > 0 && <ImprevistosList imprevistos={imprevistos} />}
    </div>
  );
}
