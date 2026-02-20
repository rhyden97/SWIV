"use client";

import { useState } from "react";
import { Building2, Star } from "lucide-react";
import { SearchActionBar } from "@/components/search-action-bar";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { DEMO_PROVEEDORES } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { DataTable, createNameColumn, createSortableColumn } from "@/components/ui/data-table";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";

export default function ProveedoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: proveedores,
    loading,
    updateItem: handleEditProveedor,
    deleteItem: handleDeleteProveedor,
  } = useDemoCollection("/api/proveedores", DEMO_PROVEEDORES, {
    errorLabel: "Error cargando proveedores:",
  });

  const columns = [
    createNameColumn("nombre", "Proveedor", false),
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
      accessorKey: "tiempo_entrega",
      header: "Entrega",
      cell: ({ row }) => {
        const val = row.original.tiempo_entrega;
        return val !== null && val !== undefined ? (
          <span>{val} días</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "calificacion_promedio",
      header: "Calificación",
      cell: ({ row }) => {
        const rating = row.original.calificacion_promedio;
        if (rating === null || rating === undefined) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }
        return (
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-xs w-fit border border-amber-500/20 font-mono text-xs">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>{rating}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <TableRowActions
          item={row.original}
          onEdit={handleEditProveedor}
          onDelete={handleDeleteProveedor}
          editFields={fieldConfigs.proveedor}
          itemType="proveedor"
        />
      ),
    },
  ];

  const proveedorFilter = proveedores.filter((proveedor) => {
    const q = searchTerm.toLowerCase();
    return (
      (proveedor.nombre || "").toLowerCase().includes(q) ||
      (proveedor.email || "").toLowerCase().includes(q) ||
      (proveedor.telefono || "").toLowerCase().includes(q) ||
      (proveedor.contacto || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Proveedores"
        subtitle="Directorio de abastecimiento, tiempos de entrega y contacto."
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre, email o contacto..."
        buttonLabel="Añadir Proveedor"
        buttonHref="/dashboard/proveedores/nuevo"
        buttonIcon={Building2}
        roles={["administrador", "almacen"]}
      />

      <div className={TABLE_CLASSES.WRAPPER}>
        <DataTable
          columns={columns}
          data={proveedorFilter}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (p) => [
              { label: "Nombre", value: p.nombre },
              { label: "Contacto", value: p.contacto },
              { label: "Email", value: p.email },
            ],
            getSecondaryFields: (p) => [
              { label: "Teléfono", value: p.telefono },
              { label: "Entrega", value: p.tiempo_entrega ? `${p.tiempo_entrega} días` : "—" },
            ],
            getActions: (p) => (
              <TableRowActions
                item={p}
                onEdit={handleEditProveedor}
                onDelete={handleDeleteProveedor}
                editFields={fieldConfigs.proveedor}
                itemType="proveedor"
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
