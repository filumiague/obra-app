"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { getEstoque, getMovimentacoes } from "@/actions/estoque.actions";

type Estoque = Awaited<ReturnType<typeof getEstoque>>;
type Movimentacoes = Awaited<ReturnType<typeof getMovimentacoes>>;

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("pt-BR");
}

export function EstoqueTable({
  estoque,
  movimentacoes,
}: {
  estoque: Estoque;
  movimentacoes: Movimentacoes;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Saldo atual</TableHead>
            <TableHead>Entradas</TableHead>
            <TableHead>Saídas</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {estoque.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.nome}</TableCell>
              <TableCell className="font-medium">
                {item.saldo} {item.unidade}
              </TableCell>
              <TableCell>
                {item.totalEntradas} {item.unidade}
              </TableCell>
              <TableCell>
                {item.totalSaidas} {item.unidade}
              </TableCell>
              <TableCell>
                <HistoricoDialog
                  materialNome={item.nome}
                  unidade={item.unidade}
                  movimentos={movimentacoes.filter((m) => m.materialId === item.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function HistoricoDialog({
  materialNome,
  unidade,
  movimentos,
}: {
  materialNome: string;
  unidade: string;
  movimentos: Movimentacoes;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Ver movimentações
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Movimentações — {materialNome}</DialogTitle>
        </DialogHeader>
        {movimentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          <div className="space-y-2">
            {movimentos.map((m) => (
              <div key={m.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <span
                    className={
                      m.tipo === "ENTRADA"
                        ? "font-medium text-green-700 dark:text-green-400"
                        : "font-medium text-red-700 dark:text-red-400"
                    }
                  >
                    {m.tipo === "ENTRADA" ? "+" : "−"}
                    {m.quantidade} {unidade}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(m.data)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{m.origemDescricao}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
