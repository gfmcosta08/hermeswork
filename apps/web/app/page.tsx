import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-farol-luz/40 via-farol-nevoa to-farol-turquesa/30 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight">FarollWork SaaS</h1>
        <p className="mt-3 max-w-2xl text-lg text-black/70">
          Base inicial pronta para operação multi-empresa com API interna, webhook seguro e painel web.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-semibold">Painel</h2>
            <p className="mt-2 text-black/70">Acesse a área protegida com os módulos completos da operação.</p>
            <Link href="/app" className="mt-4 inline-block rounded-xl bg-farol-turquesa px-4 py-2 font-medium text-black">
              Abrir Dashboard
            </Link>
          </div>
          <div className="card">
            <h2 className="text-xl font-semibold">Autenticação</h2>
            <p className="mt-2 text-black/70">Tela inicial de login para gestores e administradores.</p>
            <Link href="/login" className="mt-4 inline-block rounded-xl bg-farol-coral px-4 py-2 font-medium text-white">
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
