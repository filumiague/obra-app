"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createMaterialPlanejado,
  registrarCompraMaterial,
  createMaoDeObra,
  updateMaoDeObraStatus,
} from "@/actions/planejamento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { SemanaData } from "@/components/planejamento/semana-detail";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function MaterialMaoObraTab({ semana }: { semana: SemanaData }) {
  const materiais = semana.etapas.flatMap((etapa) =>
    etapa.materiaisPlanejados.map((m) => ({ ...m, etapaNome: etapa.nome })),
  );
  const maoDeObra = semana.etapas.flatMap((etapa) =>
    etapa.maoDeObra.map((m) => ({ ...m, etapaNome: etapa.nome })),
  );

  return (
    <div className="space-y-6 pt-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Material planejado</h2>
          <NovoMaterialForm semana={semana} />
        </div>
        {materiais.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum material planejado.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Planejado</TableHead>
                  <TableHead>Comprado</TableHead>
                  <TableHead>Sobra</TableHead>
                  <TableHead>Valor total</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {materiais.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.material.nome}</TableCell>
                    <TableCell>{m.etapaNome}</TableCell>
                    <TableCell>
                      {Number(m.qtdPlanejada)} {m.material.unidade}
                    </TableCell>
                    <TableCell>
                      {m.qtdComprada != null ? `${Number(m.qtdComprada)} ${m.material.unidade}` : "—"}
                    </TableCell>
                    <TableCell>
                      {m.qtdSobra != null
                        ? `${Number(m.qtdSobra)} ${m.material.unidade}${m.sobraParaEtapa ? ` → ${m.sobraParaEtapa.nome}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>{brl(Number(m.valorTotal))}</TableCell>
                    <TableCell>{m.fornecedor ?? "—"}</TableCell>
                    <TableCell>
                      <RegistrarCompraForm material={m} semanaId={semana.id} etapas={semana.etapas} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Mão de obra / pagamento</h2>
          <NovaMaoDeObraForm semana={semana} />
        </div>
        {maoDeObra.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma mão de obra cadastrada.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipe/Empreiteiro</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento previsto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maoDeObra.map((m) => (
                  <MaoDeObraRow key={m.id} item={m} semanaId={semana.id} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function NovoMaterialForm({ semana }: { semana: SemanaData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [etapaId, setEtapaId] = useState(semana.etapas[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createMaterialPlanejado({
        semanaId: semana.id,
        etapaId,
        materialNome: String(formData.get("materialNome")),
        unidade: String(formData.get("unidade")),
        qtdPlanejada: Number(formData.get("qtdPlanejada")),
        ondeUsado: String(formData.get("ondeUsado")),
        memorialCalculo: String(formData.get("memorialCalculo") ?? ""),
        valorUnitario: Number(formData.get("valorUnitario") ?? 0),
        fornecedor: String(formData.get("fornecedor") ?? ""),
        dataCompraPrevista: String(formData.get("dataCompraPrevista") ?? ""),
        dataEntregaPrevista: String(formData.get("dataEntregaPrevista") ?? ""),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Material planejado adicionado.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (semana.etapas.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Novo material</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo material planejado</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={etapaId} onValueChange={(v) => setEtapaId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) => semana.etapas.find((e) => e.id === v)?.nome ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {semana.etapas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="materialNome">Material</Label>
              <Input id="materialNome" name="materialNome" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unidade">Unidade</Label>
              <Input id="unidade" name="unidade" placeholder="saco, m3, un..." required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qtdPlanejada">Quantidade planejada</Label>
              <Input id="qtdPlanejada" name="qtdPlanejada" type="number" step="0.001" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valorUnitario">Valor unitário (R$)</Label>
              <Input id="valorUnitario" name="valorUnitario" type="number" step="0.01" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ondeUsado">Onde será usado</Label>
            <Input id="ondeUsado" name="ondeUsado" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="memorialCalculo">Memorial de cálculo</Label>
            <Textarea id="memorialCalculo" name="memorialCalculo" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input id="fornecedor" name="fornecedor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataCompraPrevista">Data compra prevista</Label>
              <Input id="dataCompraPrevista" name="dataCompraPrevista" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataEntregaPrevista">Data entrega prevista</Label>
              <Input id="dataEntregaPrevista" name="dataEntregaPrevista" type="date" />
            </div>
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Adicionar material"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RegistrarCompraForm({
  material,
  semanaId,
  etapas,
}: {
  material: SemanaData["etapas"][number]["materiaisPlanejados"][number];
  semanaId: string;
  etapas: SemanaData["etapas"];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sobraParaEtapaId, setSobraParaEtapaId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const qtdSobraRaw = formData.get("qtdSobra");
      const result = await registrarCompraMaterial({
        id: material.id,
        semanaId,
        qtdComprada: Number(formData.get("qtdComprada")),
        qtdSobra: qtdSobraRaw ? Number(qtdSobraRaw) : undefined,
        sobraParaEtapaId: sobraParaEtapaId || undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Compra registrada.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Registrar compra
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar compra — {material.material.nome}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="qtdComprada">Quantidade comprada</Label>
            <Input id="qtdComprada" name="qtdComprada" type="number" step="0.001" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qtdSobra">Sobra</Label>
            <Input id="qtdSobra" name="qtdSobra" type="number" step="0.001" />
          </div>
          <div className="space-y-1.5">
            <Label>Sobra destinada para etapa</Label>
            <Select value={sobraParaEtapaId} onValueChange={(v) => setSobraParaEtapaId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nenhuma">
                  {(v: string | null) => etapas.find((e) => e.id === v)?.nome ?? "Nenhuma"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {etapas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NovaMaoDeObraForm({ semana }: { semana: SemanaData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [etapaId, setEtapaId] = useState(semana.etapas[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createMaoDeObra({
        semanaId: semana.id,
        etapaId,
        equipeOuEmpreiteiro: String(formData.get("equipeOuEmpreiteiro")),
        servico: String(formData.get("servico")),
        valorAcordado: Number(formData.get("valorAcordado") ?? 0),
        formaPagamento: String(formData.get("formaPagamento")),
        dataPagamentoPrevista: String(formData.get("dataPagamentoPrevista") ?? ""),
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Mão de obra cadastrada.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (semana.etapas.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nova mão de obra</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova mão de obra</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={etapaId} onValueChange={(v) => setEtapaId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) => semana.etapas.find((e) => e.id === v)?.nome ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {semana.etapas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipeOuEmpreiteiro">Equipe/empreiteiro</Label>
            <Input id="equipeOuEmpreiteiro" name="equipeOuEmpreiteiro" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="servico">Serviço</Label>
            <Input id="servico" name="servico" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valorAcordado">Valor combinado (R$)</Label>
              <Input id="valorAcordado" name="valorAcordado" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="formaPagamento">Forma de pagamento</Label>
              <Input id="formaPagamento" name="formaPagamento" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataPagamentoPrevista">Data de pagamento prevista</Label>
            <Input id="dataPagamentoPrevista" name="dataPagamentoPrevista" type="date" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Salvando..." : "Cadastrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MaoDeObraRow({
  item,
  semanaId,
}: {
  item: SemanaData["etapas"][number]["maoDeObra"][number] & { etapaNome: string };
  semanaId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      const novoStatus = item.status === "PAGO" ? "PENDENTE" : "PAGO";
      const result = await updateMaoDeObraStatus({ id: item.id, semanaId, status: novoStatus });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>{item.equipeOuEmpreiteiro}</TableCell>
      <TableCell>{item.servico}</TableCell>
      <TableCell>{item.etapaNome}</TableCell>
      <TableCell>{brl(Number(item.valorAcordado))}</TableCell>
      <TableCell>{formatDate(item.dataPagamentoPrevista)}</TableCell>
      <TableCell>
        <button
          type="button"
          disabled={isPending}
          onClick={toggle}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            item.status === "PAGO"
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          }`}
        >
          {item.status === "PAGO" ? "Pago" : "Pendente"}
        </button>
      </TableCell>
    </TableRow>
  );
}
