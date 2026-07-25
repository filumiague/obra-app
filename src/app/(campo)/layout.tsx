import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/actions/auth.actions";

export default function CampoLayout({
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
      <main className="flex-1 pb-16">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background">
        <Link href="/diario" className="flex-1 py-3 text-center text-sm">
          Diário
        </Link>
        <Link href="/imprevisto" className="flex-1 py-3 text-center text-sm">
          Imprevisto
        </Link>
      </nav>
    </div>
  );
}
