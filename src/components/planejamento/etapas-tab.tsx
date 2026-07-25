"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createEtapa } from "@/actions/planejamento.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SemanaData } from "@/components/planejamento/semana-detail";
import { EtapaCard } from "@/components/planejamento/etapa-card";

export function EtapasTab({
  semana,
  isEngenheiro,
}: {
  semana: SemanaData;
  isEngenheiro: boolean;
}) {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <NovaEtapaForm semanaId={semana.id} proximaOrdem={semana.etapas.length} />
      </div>

      {semana.etapas.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada ainda.</p>
      )}

      <div className="space-y-4">
        {semana.etapas.map((etapa) => (
          <EtapaCard
            key={etapa.id}
            etapa={etapa}
            semanaId={semana.id}
            isEngenheiro={isEngenheiro}
          />
        ))}
      </div>
    </div>
  );
}

function NovaEtapaForm({
  semanaId,
  proximaOrdem,
}: {
  semanaId: string;
  proximaOrdem: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEtapa({
        semanaId,
        nome: String(formData.get("nome")),
        descricao: String(formData.get("descricao") ?? ""),
        ordem: proximaOrdem,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Etapa criada.");
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Nova etapa</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova etapa</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Criando..." : "Criar etapa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
