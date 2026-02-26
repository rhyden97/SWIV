"use client";

import { useState } from "react";
import { Plus, Download } from "lucide-react";
import { SearchActionBar } from "@/components/search-action-bar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";
import { formatCurrencyBOB } from "@/lib/format";
import { DEMO_ORDENES } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { generatePurchaseOrderPDF } from "@/lib/reportUtils";

export default function OrdenesCompraPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: ordenes,
    setData: setOrdenes,
    loading,
  } = useDemoCollection("/api/ordenes-compra", DEMO_ORDENES, {
    errorLabel: "Error cargando órdenes:",
    mapItem: (orden) => ({
      ...orden,
      proveedor_nombre:
        orden.proveedor?.nombre ||
        orden.proveedores?.nombre ||
        orden.proveedor_nombre ||
        "Sin proveedor",
    }),
  });

  const handleEditOrden = async (editedOrden) => {
    try {
      const response = await fetch("/api/ordenes-compra", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editedOrden.id,
          estado: editedOrden.estado,
          notas: editedOrden.notas,
          fecha_pedido: editedOrden.fecha_pedido,
          fecha_entrega_estimada: editedOrden.fecha_entrega_estimada,
          total_orden: editedOrden.total_orden,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar la orden");
      }

      const updated = await response.json();
      setOrdenes((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
      );

      if (editedOrden.estado === "emitida") {
        toast.success("Orden emitida", {
          description: "La orden se ha emitido y enviado al proveedor.",
        });
      }
      return true;
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      toast.error("Error al actualizar la orden", {
        description: error.message,
      });
      return false;
    }
  };

  const handleDeleteOrden = (ordenToDelete) => {
    setOrdenes((prev) => prev.filter((o) => o.id !== ordenToDelete.id));
  };

  const handleViewOrden = (orden) => {
    if (orden.url_comprobante) {
      window.open(orden.url_comprobante, "_blank");
    } else {
      generatePurchaseOrderPDF(orden);
    }
  };

  const customActions = [
    {
      label: "Descargar PDF",
      icon: Download,
      onClick: (orden) => generatePurchaseOrderPDF(orden),
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "ID Orden",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">
          {row.getValue("id")?.toString().slice(0, 12)}
        </span>
      ),
    },
    {
      accessorKey: "proveedor_nombre",
      header: "Proveedor",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue("proveedor_nombre")}</span>
      ),
    },
    {
      accessorKey: "fecha_pedido",
      header: "Fecha Pedido",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.getValue("fecha_pedido")).toLocaleDateString("es-BO")}
        </span>
      ),
    },
    {
      accessorKey: "total_orden",
      header: "Total (Bs)",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium text-foreground">
          {formatCurrencyBOB(row.getValue("total_orden"))}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue("estado")?.toLowerCase();
        let badgeStyle = "bg-muted text-muted-foreground border-border";
        let label = row.getValue("estado") || "";

        if (estado === "completado" || estado === "completada") {
          badgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
          label = "Completada";
        } else if (estado === "aprobada" || estado === "aprobado") {
          badgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
          label = "Aprobada";
        } else if (estado === "emitida" || estado === "emitido") {
          badgeStyle = "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
          label = "Emitida";
        } else if (estado === "solicitada") {
          badgeStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
          label = "Solicitada";
        }

        return (
          <Badge
            className={`uppercase text-xs font-mono font-medium tracking-wider px-2 py-0.5 rounded-xs border ${badgeStyle}`}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <TableRowActions
          item={row.original}
          onEdit={handleEditOrden}
          onDelete={handleDeleteOrden}
          onView={handleViewOrden}
          editFields={fieldConfigs.ordenCompra}
          itemType="orden"
          customActions={customActions}
        />
      ),
    },
  ];

  const filteredOrdenes = ordenes.filter((orden) => {
    const q = searchTerm.toLowerCase();
    const id = (orden.id || "").toString().toLowerCase();
    const proveedor = (orden.proveedor_nombre || "").toLowerCase();
    return proveedor.includes(q) || id.includes(q);
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Órdenes de Compra"
        subtitle="Emisión, seguimiento y recepción de pedidos a proveedores."
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por proveedor o ID de orden..."
        buttonLabel="Nueva Orden"
        buttonHref="/dashboard/ordenes-de-compra/nueva"
        buttonIcon={Plus}
        roles={["administrador", "almacen"]}
      />

      <div className={TABLE_CLASSES.WRAPPER}>
        <DataTable
          columns={columns}
          data={filteredOrdenes}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (orden) => [
              { label: "Proveedor", value: orden.proveedor_nombre },
              {
                label: "Total",
                value: formatCurrencyBOB(orden.total_orden),
              },
              {
                label: "Fecha",
                value: new Date(orden.fecha_pedido).toLocaleDateString("es-BO"),
              },
            ],
            getSecondaryFields: (orden) => [
              { label: "ID", value: orden.id },
              { label: "Estado", value: orden.estado },
            ],
            getActions: (orden) => (
              <TableRowActions
                item={orden}
                onEdit={handleEditOrden}
                onDelete={handleDeleteOrden}
                onView={handleViewOrden}
                editFields={fieldConfigs.ordenCompra}
                itemType="orden"
                customActions={customActions}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
