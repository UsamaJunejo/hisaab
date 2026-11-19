import Link from "next/link";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-navy px-4 py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-white">
          <img src="/logo.svg" alt="" className="h-9 w-9" /> hisaab<span className="text-orange">.app</span>
        </Link>
        <div className="card p-6 sm:p-8">
          <h1 className="page-title mb-5 text-center">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
