import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarRange,
  Boxes,
  FileBarChart,
  NotebookPen,
  Map,
} from "lucide-react";
import { signOut } from "@/actions/auth.actions";
import { InstallPrompt } from "@/components/offline/install-prompt";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel Geral", icon: LayoutDashboard },
  { href: "/diario", label: "Diário de Obra", icon: NotebookPen },
  { href: "/planejamento", label: "Planejamento Semanal", icon: CalendarRange },
  { href: "/estoque", label: "Estoque de Material", icon: Boxes },
  { href: "/planta", label: "Planta da Obra", icon: Map },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
];

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b p-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Image src="/logo.png" alt="" width={20} height={20} />
          Controle de Obra
        </span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sair
          </button>
        </form>
      </header>
      <InstallPrompt />
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r p-4">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
