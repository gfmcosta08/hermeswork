export default function AdministracaoPage() {
  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Administração</h2>
        <p className="text-sm text-black/60">
          Área administrativa para provisionamento, auditoria e saúde das instâncias Hermes por cliente.
        </p>
      </div>
      <div className="card">
        <ul className="list-disc space-y-1 pl-4 text-sm text-black/70">
          <li>Provisionamento: criar cliente e stack Hermes.</li>
          <li>Logs: auditoria resumida por empresa.</li>
          <li>Saúde: monitorar status e latência das instâncias.</li>
        </ul>
      </div>
    </main>
  );
}
