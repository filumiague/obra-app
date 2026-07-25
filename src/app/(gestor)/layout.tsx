import Link from "next/link";

export default function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
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
  );
}
