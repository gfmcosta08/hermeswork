"use client";

import { ResourceCrud } from "../../../components/resource-crud";

export default function ImoveisPage() {
  return (
    <ResourceCrud
      title="Imóveis"
      resource="imoveis"
      fields={[
        { name: "titulo", label: "Título" },
        { name: "tipo_de_imovel", label: "Tipo" },
        { name: "finalidade", label: "Finalidade" },
        { name: "status_do_imovel", label: "Status" },
        { name: "preco_de_venda", label: "Preço venda", type: "number" },
        { name: "valor_de_aluguel", label: "Aluguel", type: "number" },
      ]}
    />
  );
}
