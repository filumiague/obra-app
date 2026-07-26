import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/actions/auth.actions";

export default function PlantaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b p-3">
        <Link href="/planta" className="flex items-center gap-2 text-sm font-semibold">
          <Image src="/logo.png" alt="" width={20} height={20} />
          Controle de Obra
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm text-muted-foreground">
            Sair
          </button>
        </form>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
