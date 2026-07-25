import Link from "next/link";

export default function CampoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
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
