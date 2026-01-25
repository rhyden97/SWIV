"use client";

import { useState } from "react";
import { UserRoundPlus } from "lucide-react";
import { SearchActionBar } from "@/components/search-action-bar";
import { DataTable, createNameColumn, createSortableColumn } from "@/components/ui/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { DEMO_CLIENTES } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: clientes,
    loading,
    updateItem: handleEditCliente,
    deleteItem: handleDeleteCliente,
  } = useDemoCollection("/api/clientes", DEMO_CLIENTES, {
    errorLabel: "Error cargando clientes:",
  });

  const columns = [
    createNameColumn("nombre", "Cliente", false),
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="truncate max-w-44 block">
          {row.getValue("email") || "—"}
        </span>
      ),
    },
    createSortableColumn("telefono", "Teléfono"),
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => (
        <span className="truncate max-w-36 block">
          {row.getValue("direccion") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <TableRowActions
          item={row.original}
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
          editFields={fieldConfigs.cliente}
          itemType="cliente"
        />
      ),
    },
  ];

  const clientFilter = clientes.filter((client) => {
    const q = searchTerm.toLowerCase();
    return (
      (client.nombre || "").toLowerCase().includes(q) ||
      (client.email || "").toLowerCase().includes(q) ||
      (client.telefono || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Clientes"
        subtitle="Directorio de clientes y datos de contacto."
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre, email o teléfono..."
        buttonLabel="Añadir Cliente"
        buttonHref="/dashboard/clientes/nuevo"
        buttonIcon={UserRoundPlus}
        roles={["administrador", "ventas"]}
      />

      <div className={TABLE_CLASSES.WRAPPER}>
        <DataTable
          columns={columns}
          data={clientFilter}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (c) => [
              { label: "Nombre", value: c.nombre },
              { label: "Email", value: c.email },
              { label: "Teléfono", value: c.telefono },
            ],
            getSecondaryFields: (c) => [
              { label: "ID", value: c.id },
              { label: "Dirección", value: c.direccion },
            ],
            getActions: (c) => (
              <TableRowActions
                item={c}
                onEdit={handleEditCliente}
                onDelete={handleDeleteCliente}
                editFields={fieldConfigs.cliente}
                itemType="cliente"
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
