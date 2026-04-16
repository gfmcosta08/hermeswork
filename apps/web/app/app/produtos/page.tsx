"use client";

import { ResourceCrud } from "../../../components/resource-crud";

export default function ProdutosPage() {
  return (
    <ResourceCrud
      title="Produtos"
      resource="produtos"
      fields={[
        { name: "nome", label: "Nome" },
        { name: "tipo", label: "Tipo" },
        { name: "categoria", label: "Categoria" },
        { name: "preco", label: "Preço", type: "number" },
      ]}
    />
  );
}
