"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { SearchActionBar } from "@/components/search-action-bar";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";
import { formatCurrencyBOB } from "@/lib/format";
import { DEMO_VENTAS } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { generateSaleReceiptPDF } from "@/lib/reportUtils";

export default function VentasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: ventas, loading } = useDemoCollection(
    "/api/ventas",
    DEMO_VENTAS,
    {
      errorLabel: "Error cargando ventas:",
      mapItem: (venta) => ({
        ...venta,
        cliente_nombre:
          venta.cliente?.nombre ||
          venta.clientes?.nombre ||
          venta.cliente_nombre ||
          "Sin cliente",
      }),
    },
  );

  const handleViewVenta = (venta) => {
    if (venta.url_recibo) {
      window.open(venta.url_recibo, "_blank");
      toast.success("Abriendo recibo", {
        description: "El recibo se abrirá en una nueva pestaña",
      });
    } else {
      toast.warning("Recibo no disponible", {
        description: "Esta venta no tiene un recibo generado",
      });
    }
  };

  const customActions = [
    {
      label: "Generar PDF",
      icon: Download,
      onClick: (venta) => generateSaleReceiptPDF(venta),
    },
  ];

  const columns = [
    {
      accessorKey: "id",
      header: "ID Venta",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">
          {row.getValue("id")?.toString().slice(0, 10)}
        </span>
      ),
    },
    {
      accessorKey: "cliente_nombre",
      header: "Cliente",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.getValue("cliente_nombre")}</span>
      ),
    },
    {
      accessorKey: "fecha_venta",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.getValue("fecha_venta")).toLocaleDateString("es-BO")}
        </span>
      ),
    },
    {
      accessorKey: "total_venta",
      header: "Total (Bs)",
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium text-foreground">
          {formatCurrencyBOB(row.getValue("total_venta"))}
        </span>
      ),
    },
    {
      accessorKey: "metodo_pago",
      header: "Método de Pago",
      cell: ({ row }) => {
        const metodo = row.getValue("metodo_pago");
        if (!metodo) return <span className="text-xs text-muted-foreground font-mono">N/A</span>;

        const key = metodo.toLowerCase();
        let badgeStyle = "bg-muted text-muted-foreground border-border";
        let label = metodo.toUpperCase();

        if (key === "efectivo") {
          badgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
        } else if (key === "qr") {
          badgeStyle = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
        } else if (key === "tarjeta") {
          badgeStyle = "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
        } else if (key === "por pagar") {
          badgeStyle = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
          label = "POR PAGAR";
        } else if (key === "cancelada") {
          badgeStyle = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
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
          onView={handleViewVenta}
          editFields={fieldConfigs.venta}
          itemType="venta"
          customActions={customActions}
        />
      ),
    },
  ];

  const ventaFilter = ventas.filter((venta) => {
    const q = searchTerm.toLowerCase();
    const id = (venta.id || "").toString().toLowerCase();
    const nombre = (venta.cliente_nombre || "").toLowerCase();
    return nombre.includes(q) || id.includes(q);
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Ventas"
        subtitle="Registro y control de transacciones comerciales."
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por cliente o ID de venta..."
        buttonLabel="Nueva Venta"
        buttonHref="/dashboard/ventas/nueva"
        buttonIcon={Plus}
        roles={["administrador", "ventas"]}
      />

      <div className={TABLE_CLASSES.WRAPPER}>
        <DataTable
          columns={columns}
          data={ventaFilter}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (v) => [
              { label: "Cliente", value: v.cliente_nombre },
              {
                label: "Total",
                value: formatCurrencyBOB(v.total_venta),
              },
              {
                label: "Fecha",
                value: new Date(v.fecha_venta).toLocaleDateString("es-BO"),
              },
            ],
            getSecondaryFields: (v) => [
              { label: "ID", value: v.id },
              { label: "Método Pago", value: v.metodo_pago || "N/A" },
            ],
            getActions: (v) => (
              <TableRowActions
                item={v}
                onView={handleViewVenta}
                editFields={fieldConfigs.venta}
                itemType="venta"
                customActions={customActions}
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
