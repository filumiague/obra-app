"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadPlanta } from "@/actions/planta.actions";
import type { listPlantas } from "@/actions/planta.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Plantas = Awaited<ReturnType<typeof listPlantas>>;

export function PlantasListClient({ plantas }: { plantas: Plantas }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!nome.trim()) {
      toast.error("Informe um nome para a planta.");
      return;
    }
    if (!file) {
      toast.error("Selecione uma imagem.");
      return;
    }
    const formData = new FormData();
    formData.set("nome", nome);
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadPlanta(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Planta enviada.");
      setNome("");
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
      router.push(`/planta/${result.plantaId}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Planta da obra</h1>
          <p className="text-sm text-muted-foreground">
            Envie a planta de referência e marque anotações direto na imagem.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Upload className="mr-1.5 size-4" />
            Nova planta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar planta</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Pavimento térreo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file">Imagem da planta</Label>
                <input
                  ref={fileRef}
                  id="file"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  disabled={isPending}
                  onClick={handleUpload}
                >
                  {isPending ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plantas.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nenhuma planta enviada ainda.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {plantas.map((p) => (
          <Link key={p.id} href={`/planta/${p.id}`}>
            <Card className="overflow-hidden transition-colors hover:bg-accent">
              <div className="aspect-square bg-muted">
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.nome} className="h-full w-full object-cover" />
                )}
              </div>
              <CardContent className="p-2">
                <p className="truncate text-sm font-medium">{p.nome}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
