import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <Image
          src="/logo.png"
          alt="Controle de Obra"
          width={96}
          height={96}
          className="mx-auto"
          priority
        />
        <h1 className="text-2xl font-semibold">Controle de Obra</h1>
        <p className="text-sm text-muted-foreground">
          Planejamento semanal, diário de obra e controle de material em um
          só lugar.
        </p>
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </div>
    </main>
  );
}
