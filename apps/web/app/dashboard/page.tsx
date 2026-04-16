const cards = [
  { title: "Empresas ativas", value: "12" },
  { title: "Mensagens hoje", value: "1.284" },
  { title: "Leads imobiliários", value: "37" },
  { title: "Alertas de estoque", value: "9" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-farol-nevoa p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-black/70">Visão consolidada da operação multi-cliente.</p>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article key={card.title} className="card">
              <p className="text-sm text-black/60">{card.title}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
