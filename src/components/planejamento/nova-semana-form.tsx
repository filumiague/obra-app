"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { createSemana } from "@/actions/planejamento.actions";
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

export function NovaSemanaForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createSemana({
        dataInicio: String(formData.get("dataInicio")),
        dataFim: String(formData.get("dataFim")),
        descricaoAtividadePrincipal: String(formData.get("descricaoAtividadePrincipal")),
        objetivo: String(formData.get("objetivo")),
      });
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Nova semana</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova semana de planejamento</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio">Início (segunda)</Label>
              <Input id="dataInicio" name="dataInicio" type="date" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFim">Fim (sexta)</Label>
              <Input id="dataFim" name="dataFim" type="date" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricaoAtividadePrincipal">Atividade principal da semana</Label>
            <Input id="descricaoAtividadePrincipal" name="descricaoAtividadePrincipal" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="objetivo">Objetivo geral</Label>
            <Textarea id="objetivo" name="objetivo" rows={2} />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Criando..." : "Criar semana"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
