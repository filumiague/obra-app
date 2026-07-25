import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/actions/auth.actions";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b p-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Image src="/logo.png" alt="" width={20} height={20} />
          Controle de Obra
        </span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground">
            Sair
          </button>
        </form>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r p-4">
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/dashboard">Painel Geral</Link>
            <Link href="/planejamento">Planejamento Semanal</Link>
            <Link href="/estoque">Estoque de Material</Link>
            <Link href="/relatorios">Relatórios</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
