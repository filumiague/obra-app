"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Eraser, Undo2 } from "lucide-react";
import {
  addAnotacao,
  apagarAnotacao,
  apagarPlanta,
} from "@/actions/planta.actions";
import type { getPlanta } from "@/actions/planta.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PlantaData = Awaited<ReturnType<typeof getPlanta>>;

type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string };

const CORES = ["#f97316", "#ef4444", "#2563eb", "#16a34a", "#000000"];

export function PlantaDetailClient({ data }: { data: PlantaData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(CORES[0]);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [etapaId, setEtapaId] = useState("");
  const [imprevistoId, setImprevistoId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!data.planta.url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = 1400;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      imgRef.current = img;
      redraw();
    };
    img.src = data.planta.url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.planta.url]);

  function redraw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push({ points: [pointFromEvent(e)], color });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.points.push(pointFromEvent(e));
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) drawStroke(ctx, { points: stroke.points.slice(-2), color: stroke.color });
  }

  function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    setHasStrokes(strokesRef.current.length > 0);
  }

  function handleUndo() {
    strokesRef.current.pop();
    setHasStrokes(strokesRef.current.length > 0);
    redraw();
  }

  function handleLimpar() {
    strokesRef.current = [];
    setHasStrokes(false);
    redraw();
  }

  function handleSalvar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageDataUrl = canvas.toDataURL("image/png");
    startTransition(async () => {
      const result = await addAnotacao({
        plantaId: data.planta.id,
        imageDataUrl,
        etapaId: etapaId || null,
        imprevistoId: imprevistoId || null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Anotação salva.");
      handleLimpar();
      setSaveOpen(false);
      setEtapaId("");
      setImprevistoId("");
      router.refresh();
    });
  }

  function handleApagarAnotacao(id: string) {
    if (!confirm("Apagar esta anotação?")) return;
    startDeleting(async () => {
      const result = await apagarAnotacao(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Anotação apagada.");
      router.refresh();
    });
  }

  function handleApagarPlanta() {
    if (!confirm(`Apagar a planta "${data.planta.nome}" e todas as anotações dela?`)) return;
    startDeleting(async () => {
      await apagarPlanta(data.planta.id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" render={<Link href="/planta" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold">{data.planta.nome}</h1>
        </div>
        <Button variant="outline" size="icon" disabled={isDeleting} onClick={handleApagarPlanta}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="size-7 shrink-0 rounded-full border-2"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "var(--foreground)" : "transparent",
                }}
                aria-label={`Cor ${c}`}
              />
            ))}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUndo} disabled={!hasStrokes}>
                <Undo2 className="mr-1 size-3.5" />
                Desfazer
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleLimpar} disabled={!hasStrokes}>
                <Eraser className="mr-1 size-3.5" />
                Limpar
              </Button>
            </div>
          </div>

          <div className="overflow-auto rounded-md border">
            <canvas
              ref={canvasRef}
              className="block max-w-full touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>

          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger render={<Button className="w-full" disabled={!hasStrokes} />}>
              Salvar anotação
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vincular anotação</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Opcional: associe esta anotação a uma etapa do Planejamento ou a um imprevisto
                  do Diário.
                </p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Etapa</label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    value={etapaId}
                    onChange={(e) => {
                      setEtapaId(e.target.value);
                      if (e.target.value) setImprevistoId("");
                    }}
                  >
                    <option value="">Nenhuma</option>
                    {data.etapas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Imprevisto</label>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    value={imprevistoId}
                    onChange={(e) => {
                      setImprevistoId(e.target.value);
                      if (e.target.value) setEtapaId("");
                    }}
                  >
                    <option value="">Nenhum</option>
                    {data.imprevistos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.descricao.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSaveOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="button" className="flex-1" disabled={isPending} onClick={handleSalvar}>
                    {isPending ? "Salvando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {data.anotacoes.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Anotações salvas</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.anotacoes.map((a) => (
              <div key={a.id} className="space-y-1">
                <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                  {a.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                  <span className="truncate">
                    {a.etapa?.nome ?? a.imprevisto?.descricao.slice(0, 20) ?? "Sem vínculo"}
                  </span>
                  <Button
                    size="icon-xs"
                    variant="outline"
                    disabled={isDeleting}
                    onClick={() => handleApagarAnotacao(a.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
