"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { addMaterialUso, setAvaliacaoDia } from "@/actions/diario.actions";
import { AtividadeCard } from "@/components/diario/atividade-card";
import { ImprevistoForm } from "@/components/diario/imprevisto-form";
import { RelatorioExport } from "@/components/relatorios/relatorio-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { getDiarioHoje } from "@/actions/diario.actions";

type DiarioData = Awaited<ReturnType<typeof getDiarioHoje>>;

const CRITERIOS = [
  { key: "aderencia", label: "Aderência ao planejado" },
  { key: "qualidade", label: "Qualidade" },
  { key: "organizacao", label: "Organização" },
  { key: "seguranca", label: "Segurança" },
] as const;

export function DiarioClient({ data }: { data: DiarioData }) {
  const [imprevistoOpen, setImprevistoOpen] = useState(false);

  const hoje = new Date(data.diario.data).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold capitalize">{hoje}</h1>
        <p className="text-sm text-muted-foreground">
          {data.itensPlanejados.length} atividade(s) prevista(s) para hoje
        </p>
      </div>

      {data.itensPlanejados.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nenhuma atividade liberada prevista para hoje.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.itensPlanejados.map((item) => (
          <AtividadeCard key={item.id} item={item} />
        ))}
      </div>

      <MaterialUsoSection data={data} />

      {data.imprevistos.length > 0 && (
        <ImprevistosList imprevistos={data.imprevistos} />
      )}

      <AvaliacaoSection data={data} />

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Relatórios</h2>
        </CardHeader>
        <CardContent>
          <RelatorioExport
            completoDisponivel={data.diario.avaliacaoNota !== null}
          />
        </CardContent>
      </Card>

      <Dialog open={imprevistoOpen} onOpenChange={setImprevistoOpen}>
        <DialogTrigger
          render={
            <Button
              size="lg"
              variant="destructive"
              className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg"
            />
          }
        >
          <AlertTriangle className="mr-1.5 size-4" />
          Imprevisto
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar imprevisto</DialogTitle>
          </DialogHeader>
          <ImprevistoForm onSuccess={() => setImprevistoOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaterialUsoSection({ data }: { data: DiarioData }) {
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    const qtd = Number(quantidade.replace(",", "."));
    if (!materialId || !qtd || qtd <= 0) {
      toast.error("Selecione um material e informe uma quantidade válida.");
      return;
    }
    startTransition(async () => {
      const result = await addMaterialUso({ materialId, quantidade: qtd });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Uso de material registrado.");
      setMaterialId("");
      setQuantidade("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Material usado hoje</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.materiaisUsados.length > 0 && (
          <ul className="space-y-1 text-sm">
            {data.materiaisUsados.map((m) => (
              <li key={m.id} className="flex justify-between text-muted-foreground">
                <span>{m.material.nome}</span>
                <span>
                  {m.quantidade.toString()} {m.material.unidade}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Select value={materialId} onValueChange={(v) => setMaterialId(v ?? "")}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Material">
                {(value: string | null) =>
                  data.materiais.find((m) => m.id === value)?.nome ?? "Material"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {data.materiais.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome} ({m.unidade})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="w-24"
            placeholder="Qtd"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <Button type="button" disabled={isPending} onClick={handleAdd}>
            +
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ImprevistosList({
  imprevistos,
}: {
  imprevistos: DiarioData["imprevistos"];
}) {
  return (
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
            {i.fotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={i.fotoUrl}
                alt=""
                className="mt-2 h-20 w-20 rounded-md object-cover"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AvaliacaoSection({ data }: { data: DiarioData }) {
  const [nota, setNota] = useState(data.diario.avaliacaoNota ?? 0);
  const [criterios, setCriterios] = useState<Record<string, string>>({
    aderencia: data.diario.avaliacaoAderencia ?? "",
    qualidade: data.diario.avaliacaoQualidade ?? "",
    organizacao: data.diario.avaliacaoOrganizacao ?? "",
    seguranca: data.diario.avaliacaoSeguranca ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (!nota) {
      toast.error("Escolha uma nota de 1 a 5.");
      return;
    }
    startTransition(async () => {
      const result = await setAvaliacaoDia({
        nota,
        aderencia: criterios.aderencia,
        qualidade: criterios.qualidade,
        organizacao: criterios.organizacao,
        seguranca: criterios.seguranca,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Avaliação do dia salva.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Avaliação do dia</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              className={`flex size-10 items-center justify-center rounded-full border text-sm font-medium ${
                nota === n
                  ? "border-foreground bg-foreground text-background"
                  : "border-input"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {CRITERIOS.map((c) => (
          <div key={c.key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{c.label}</label>
            <Input
              value={criterios[c.key]}
              onChange={(e) =>
                setCriterios((prev) => ({ ...prev, [c.key]: e.target.value }))
              }
            />
          </div>
        ))}
        <Button type="button" disabled={isPending} onClick={handleSave} className="w-full">
          {isPending ? "Salvando..." : "Salvar avaliação"}
        </Button>
      </CardContent>
    </Card>
  );
}
