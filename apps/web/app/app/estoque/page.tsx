"use client";

import { ResourceCrud } from "../../../components/resource-crud";

export default function EstoquePage() {
  return (
    <ResourceCrud
      title="Estoque"
      resource="estoque"
      fields={[
        { name: "nome", label: "Nome" },
        { name: "quantidade", label: "Quantidade", type: "number" },
        { name: "unidade", label: "Unidade" },
        { name: "minimo", label: "Mínimo", type: "number" },
      ]}
    />
  );
}
