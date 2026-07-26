"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  History,
  Trash2,
  CalendarPlus,
  Pencil,
} from "lucide-react";
import {
  addMaterialUso,
  editarMaterialUso,
  apagarMaterialUso,
  setAvaliacaoDia,
  criarMaterial,
  apagarDiario,
  criarDiario,
  apagarImprevisto,
} from "@/actions/diario.actions";
import { tryOrQueue } from "@/lib/offline/sync";
import { AtividadeCard } from "@/components/diario/atividade-card";
import { ImprevistoForm } from "@/components/diario/imprevisto-form";
import { RelatorioExport } from "@/components/relatorios/relatorio-export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const [isDeleting, startDeleting] = useTransition();

  const dataFormatada = new Date(data.diario.data).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });

  function handleApagar() {
    if (!confirm("Apagar este diário? Essa ação não pode ser desfeita.")) return;
    startDeleting(async () => {
      await apagarDiario(data.diario.id);
    });
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold capitalize">{dataFormatada}</h1>
          <ProgressoChecklist itensPlanejados={data.itensPlanejados} />
        </div>
        <div className="flex shrink-0 gap-1.5">
          <NovoDiarioButton />
          <Button variant="outline" size="icon" title="Histórico de diários" render={
            <Link href="/diario/historico" />
          }>
            <History className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Apagar diário"
            disabled={isDeleting}
            onClick={handleApagar}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
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
          <AtividadeCard key={item.id} item={item} diarioObraId={data.diario.id} />
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
          <ImprevistoForm
            diarioObraId={data.diario.id}
            onSuccess={() => setImprevistoOpen(false)}
            onCancel={() => setImprevistoOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgressoChecklist({
  itensPlanejados,
}: {
  itensPlanejados: DiarioData["itensPlanejados"];
}) {
  const total = itensPlanejados.length;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade prevista</p>;
  }
  const concluidas = itensPlanejados.filter(
    (item) => item.atividadeDiario[0]?.status === "CONCLUIDO",
  ).length;
  const pct = Math.round((concluidas / total) * 100);

  return (
    <div className="mt-1 space-y-1">
      <p className="text-sm text-muted-foreground">
        {concluidas} de {total} concluídas — <span className="font-semibold text-primary">{pct}%</span>
      </p>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const VISIVEIS_SEM_EXPANDIR = 10;

function MaterialUsoSection({ data }: { data: DiarioData }) {
  const [materiais, setMateriais] = useState(data.materiais);
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [novoMaterialOpen, setNovoMaterialOpen] = useState(false);
  const [verTodosOpen, setVerTodosOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoUnidade, setNovoUnidade] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCreating, startCreating] = useTransition();
  const router = useRouter();

  function handleAdd() {
    const qtd = Number(quantidade.replace(",", "."));
    if (!materialId) {
      toast.error("Selecione um material na lista antes de adicionar.");
      return;
    }
    if (!qtd || qtd <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    const payload = { diarioObraId: data.diario.id, materialId, quantidade: qtd };
    startTransition(async () => {
      const { queued, result } = await tryOrQueue(
        () => addMaterialUso(payload),
        { kind: "material", payload },
      );
      if (queued) {
        toast.success("Salvo localmente — será sincronizado quando a conexão voltar.");
        setMaterialId("");
        setQuantidade("");
        return;
      }
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Uso de material registrado.");
      setMaterialId("");
      setQuantidade("");
      router.refresh();
    });
  }

  function handleCriarMaterial() {
    if (!novoNome.trim() || !novoUnidade.trim()) {
      toast.error("Informe nome e unidade do novo material.");
      return;
    }
    startCreating(async () => {
      const result = await criarMaterial({ nome: novoNome, unidade: novoUnidade });
      if (result.error || !result.material) {
        toast.error(result.error ?? "Erro ao criar material.");
        return;
      }
      setMateriais((prev) =>
        [...prev, result.material!].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setMaterialId(result.material.id);
      setNovoNome("");
      setNovoUnidade("");
      setNovoMaterialOpen(false);
      toast.success("Material cadastrado.");
      router.refresh();
    });
  }

  const usados = data.materiaisUsados;
  const visiveis = usados.slice(0, VISIVEIS_SEM_EXPANDIR);

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Material usado hoje</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {usados.length > 0 && (
          <ul className="space-y-1 text-sm">
            {visiveis.map((m) => (
              <li key={m.id} className="flex justify-between text-muted-foreground">
                <span>{m.material.nome}</span>
                <span>
                  {m.quantidade.toString()} {m.material.unidade}
                </span>
              </li>
            ))}
          </ul>
        )}

        {usados.length > VISIVEIS_SEM_EXPANDIR && (
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setVerTodosOpen(true)}
          >
            Ver mais ({usados.length} itens)
          </button>
        )}

        <div className="flex gap-2">
          <select
            className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            <option value="">Selecione o material</option>
            {materiais.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} ({m.unidade})
              </option>
            ))}
          </select>
          <Input
            className="w-20"
            placeholder="Qtd"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <Button type="button" disabled={isPending} onClick={handleAdd} title="Adicionar">
            <Plus className="size-4" />
          </Button>
        </div>

        <button
          type="button"
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => setNovoMaterialOpen(true)}
        >
          + Cadastrar novo material
        </button>
      </CardContent>

      <Dialog open={novoMaterialOpen} onOpenChange={setNovoMaterialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Areia média"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Unidade</label>
              <Input
                value={novoUnidade}
                onChange={(e) => setNovoUnidade(e.target.value)}
                placeholder="Ex: m3, un, saco, kg"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setNovoMaterialOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={isCreating}
                onClick={handleCriarMaterial}
              >
                {isCreating ? "Criando..." : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={verTodosOpen} onOpenChange={setVerTodosOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Materiais usados hoje ({usados.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {usados.map((m) => (
              <MaterialUsoRow key={m.id} item={m} materiais={materiais} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function MaterialUsoRow({
  item,
  materiais,
}: {
  item: DiarioData["materiaisUsados"][number];
  materiais: DiarioData["materiais"];
}) {
  const [editing, setEditing] = useState(false);
  const [materialId, setMaterialId] = useState(item.materialId);
  const [quantidade, setQuantidade] = useState(String(item.quantidade));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSalvar() {
    const qtd = Number(quantidade.replace(",", "."));
    if (!qtd || qtd <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    startTransition(async () => {
      const result = await editarMaterialUso({ id: item.id, materialId, quantidade: qtd });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Atualizado.");
      setEditing(false);
      router.refresh();
    });
  }

  function handleApagar() {
    if (!confirm(`Apagar o uso de "${item.material.nome}"?`)) return;
    startTransition(async () => {
      const result = await apagarMaterialUso(item.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Item apagado.");
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-2">
        <select
          className="h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
        >
          {materiais.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome} ({m.unidade})
            </option>
          ))}
        </select>
        <Input
          className="w-20"
          inputMode="decimal"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <Button size="sm" disabled={isPending} onClick={handleSalvar}>
          Salvar
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
      <div>
        <span className="font-medium">{item.material.nome}</span>{" "}
        <span className="text-muted-foreground">
          {item.quantidade.toString()} {item.material.unidade}
        </span>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="icon-sm" variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="outline" disabled={isPending} onClick={handleApagar}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ImprevistosList({
  imprevistos,
}: {
  imprevistos: DiarioData["imprevistos"];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleApagar(id: string, descricao: string) {
    if (!confirm(`Apagar o imprevisto "${descricao}"?`)) return;
    startTransition(async () => {
      const result = await apagarImprevisto(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Imprevisto apagado.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Imprevistos de hoje</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {imprevistos.map((i) => (
          <div key={i.id} className="rounded-md border p-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{i.descricao}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {i.gravidade} · {i.urgencia}
                </span>
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleApagar(i.id, i.descricao)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
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
        diarioObraId: data.diario.id,
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

function NovoDiarioButton() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPending, startTransition] = useTransition();

  function handleCriar() {
    startTransition(async () => {
      await criarDiario(data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" title="Novo diário" />}>
        <CalendarPlus className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo diário</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <Button type="button" className="w-full" disabled={isPending} onClick={handleCriar}>
            {isPending ? "Criando..." : "Criar / abrir diário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
