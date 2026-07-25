import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  PARCIAL: "Parcial",
  NAO_REALIZADO: "Não realizado",
};

const COLORS: Record<string, string> = {
  NAO_INICIADO: "bg-muted text-muted-foreground",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONCLUIDO: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  PARCIAL: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  NAO_REALIZADO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLORS[status] ?? COLORS.NAO_INICIADO,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
