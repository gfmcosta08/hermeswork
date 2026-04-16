"use client";

import { ResourceCrud } from "../../../components/resource-crud";

export default function ContatosPage() {
  return (
    <ResourceCrud
      title="Contatos"
      resource="contatos"
      fields={[
        { name: "nome", label: "Nome" },
        { name: "whatsapp_numero", label: "WhatsApp" },
        { name: "tipo", label: "Tipo" },
      ]}
    />
  );
}
