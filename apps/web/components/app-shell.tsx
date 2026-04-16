"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth";

const items = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/contatos", label: "Contatos" },
  { href: "/app/produtos", label: "Produtos" },
  { href: "/app/estoque", label: "Estoque" },
  { href: "/app/transacoes", label: "Transações" },
  { href: "/app/financeiro", label: "Financeiro" },
  { href: "/app/imoveis", label: "Imóveis" },
];

const adminItems = [
  { href: "/app/administracao", label: "Administração" },
  { href: "/app/administracao/provisionamento", label: "Provisionamento" },
  { href: "/app/administracao/logs", label: "Logs" },
  { href: "/app/administracao/saude", label: "Saúde Instâncias" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <main className="p-8">Carregando...</main>;
  }

  return (
    <div className="min-h-screen bg-farol-nevoa">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
        <div>
          <p className="text-xs uppercase text-black/50">FarollWork SaaS</p>
          <h1 className="text-xl font-bold">Operação {user.role === "admin" ? "Admin" : "Gestor"}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{user.nome ?? user.email}</p>
          <button className="text-sm text-red-700" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[220px_1fr]">
        <aside className="card h-fit">
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-farol-turquesa font-semibold" : "hover:bg-black/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user.role === "admin" ? (
              <>
                <div className="my-2 border-t border-black/10 pt-2 text-xs uppercase text-black/40">Admin</div>
                {adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      pathname === item.href ? "bg-farol-coral text-white font-semibold" : "hover:bg-black/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </>
            ) : null}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
