import Image from "next/image";
import Link from "next/link";
import { NotebookPen, AlertTriangle, Map } from "lucide-react";
import { signOut } from "@/actions/auth.actions";
import { SyncManager } from "@/components/offline/sync-manager";
import { SyncIndicator } from "@/components/offline/sync-indicator";
import { InstallPrompt } from "@/components/offline/install-prompt";

export default function CampoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SyncManager />
      <header className="flex items-center justify-between border-b p-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Image src="/logo.png" alt="" width={20} height={20} />
          Controle de Obra
        </span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground">
            Sair
          </button>
        </form>
      </header>
      <SyncIndicator />
      <InstallPrompt />
      <main className="flex-1 pb-16">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background">
        <Link
          href="/diario"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"
        >
          <NotebookPen className="size-5" />
          Diário
        </Link>
        <Link
          href="/imprevisto"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"
        >
          <AlertTriangle className="size-5" />
          Imprevisto
        </Link>
        <Link
          href="/planta"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"
        >
          <Map className="size-5" />
          Planta
        </Link>
      </nav>
    </div>
  );
}
