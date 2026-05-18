"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRol } from "@/hooks/useRol";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { Download, FileText, Package, TrendingUp, Eye } from "lucide-react";
import { generateReportPDF, exportToCSV } from "@/lib/reportUtils";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";

const formatSafeDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return format(date, "dd/MM/yyyy");
};

export default function ReportesPage() {
  const router = useRouter();
  const { rol, loading: rolLoading, tienePermiso } = useRol();
  const [reportType, setReportType] = useState("ventas");
  const [subType, setSubType] = useState("ventas-detallado");
  const [dateRange, setDateRange] = useState("last-7-days");
  const [data, setData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const reportTypes = {
    ventas: {
      label: "Ventas",
      icon: TrendingUp,
      subtypes: [
        { value: "ventas-detallado", label: "Reporte Detallado de Ventas" },
        { value: "ventas-resumen", label: "Resumen de Ventas" },
      ],
    },
    inventario: {
      label: "Inventario",
      icon: Package,
      subtypes: [
        { value: "inventario-stock", label: "Estado de Stock" },
        { value: "inventario-valorizado", label: "Inventario Valorizado" },
        { value: "inventario-movimientos", label: "Movimientos de Inventario" },
      ],
    },
  };

  useEffect(() => {
    if (reportTypes[reportType]?.subtypes?.[0]) {
      setSubType(reportTypes[reportType].subtypes[0].value);
    }
  }, [reportType]);

  useEffect(() => {
    setShowReport(false);
    setData([]);
    setStatistics({});
  }, [reportType, subType, dateRange]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setShowReport(false);

    try {
      const now = new Date();
      let fechaInicio = null;
      let fechaFin = now.toISOString().split("T")[0];

      switch (dateRange) {
        case "today":
          fechaInicio = now.toISOString().split("T")[0];
          break;
        case "last-7-days":
          fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          break;
        case "last-30-days":
          fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          break;
        case "last-90-days":
          fechaInicio = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          break;
        case "this-month":
          fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          fechaInicio = lastMonth.toISOString().split("T")[0];
          fechaFin = new Date(now.getFullYear(), now.getMonth(), 0)
            .toISOString()
            .split("T")[0];
          break;
        case "this-year":
          fechaInicio = new Date(now.getFullYear(), 0, 1)
            .toISOString()
            .split("T")[0];
          break;
        case "last-year":
          fechaInicio = new Date(now.getFullYear() - 1, 0, 1)
            .toISOString()
            .split("T")[0];
          fechaFin = new Date(now.getFullYear() - 1, 11, 31)
            .toISOString()
            .split("T")[0];
          break;
        default:
          fechaInicio = null;
      }

      let url = `/api/reportes?tipo=${subType}`;
      if (fechaInicio) url += `&fecha_inicio=${fechaInicio}`;
      if (fechaFin) url += `&fecha_fin=${fechaFin}`;

      const reportResponse = await fetch(url);
      if (!reportResponse.ok) {
        const errorData = await reportResponse
          .json()
          .catch(() => ({ error: "Error desconocido" }));
        throw new Error(
          errorData.error ||
            `Error ${reportResponse.status}: No se pudo generar el reporte`,
        );
      }
      const reportData = await reportResponse.json();

      let statsUrl = `/api/reportes/estadisticas?tipo=${subType}`;
      if (fechaInicio) statsUrl += `&fecha_inicio=${fechaInicio}`;
      if (fechaFin) statsUrl += `&fecha_fin=${fechaFin}`;

      const statsResponse = await fetch(statsUrl);
      const stats = statsResponse.ok ? await statsResponse.json() : {};

      setData(reportData);
      setStatistics(stats);
      setShowReport(true);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(
        error.message ||
          "Error al generar el reporte. Por favor, intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = generateReportPDF(data, reportType, subType, statistics);
    doc.save(
      `reporte-${reportType}-${subType}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
    );
  };

  const handleExportCSV = () => {
    exportToCSV(data, reportType, subType);
  };

  const getCurrentSubtypes = () => {
    return reportTypes[reportType]?.subtypes || [];
  };

  const getSubTypeLabel = (value) => {
    const subtype = getCurrentSubtypes().find((s) => s.value === value);
    return subtype?.label || value;
  };


  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Generación de balances operativos y exportación de datos."
      />

      <div className="mb-6 border border-border bg-card rounded-xs p-5">
        <div className="border-b border-border pb-3 mb-4">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Parámetros del Reporte
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-type" className="text-xs font-mono uppercase text-muted-foreground">
              Tipo de Reporte
            </Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type" className="rounded-xs text-xs font-mono">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                {Object.entries(reportTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key} className="text-xs font-mono">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sub-type" className="text-xs font-mono uppercase text-muted-foreground">
              Subtipo de Reporte
            </Label>
            <Select value={subType} onValueChange={setSubType}>
              <SelectTrigger id="sub-type" className="rounded-xs text-xs font-mono">
                <SelectValue placeholder="Seleccionar subtipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                {getCurrentSubtypes().map((subtype) => (
                  <SelectItem key={subtype.value} value={subtype.value} className="text-xs font-mono">
                    {subtype.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date-range" className="text-xs font-mono uppercase text-muted-foreground">
              Rango Temporal
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="date-range" className="rounded-xs text-xs font-mono">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="today" className="text-xs font-mono">Hoy</SelectItem>
                <SelectItem value="last-7-days" className="text-xs font-mono">Últimos 7 días</SelectItem>
                <SelectItem value="last-30-days" className="text-xs font-mono">Últimos 30 días</SelectItem>
                <SelectItem value="this-month" className="text-xs font-mono">Este mes</SelectItem>
                <SelectItem value="last-month" className="text-xs font-mono">Mes anterior</SelectItem>
                <SelectItem value="last-year" className="text-xs font-mono">Año anterior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleGenerateReport}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-mono font-medium uppercase tracking-wider rounded-xs cursor-pointer shadow-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-foreground mr-2" />
                  Generando...
                </>
              ) : (
                "Generar Reporte"
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading && <Loader columns={4} rows={4} />}

      {showReport && !loading && (
        <>
          {Object.keys(statistics).length > 0 &&
            (reportType === "ventas" ||
              (reportType === "inventario" &&
                subType !== "inventario-movimientos")) && (
              <div className="grid grid-cols-2 lg:grid-cols-4 border border-border divide-x divide-y lg:divide-y-0 divide-border bg-card rounded-xs mb-6">
                {reportType === "ventas" && (
                  <>
                    <StatCard
                      title="TOTAL VENTAS"
                      value={`Bs. ${statistics.totalSales?.toLocaleString("es-BO") || 0}`}
                      subtitle="Período seleccionado"
                    />
                    <StatCard
                      title="TOTAL ÓRDENES"
                      value={statistics.totalOrders || 0}
                      subtitle="Órdenes procesadas"
                    />
                    <StatCard
                      title="PROMEDIO / TICKET"
                      value={`Bs. ${statistics.averageOrderValue?.toFixed(2) || "0.00"}`}
                      subtitle="Ticket promedio"
                    />
                    <StatCard
                      title="CLIENTES ACTIVOS"
                      value={Object.keys(statistics.topCustomer || {}).length || (data.length > 0 ? data.length : 0)}
                      subtitle="Clientes con compras"
                    />
                  </>
                )}

                {reportType === "inventario" &&
                  subType !== "inventario-movimientos" && (
                    <>
                      <StatCard
                        title="TOTAL PRODUCTOS"
                        value={statistics.totalProductos || 0}
                        subtitle="SKUs en inventario"
                      />
                      <StatCard
                        title="VALOR TOTAL"
                        value={`Bs ${statistics.valorInventario?.toLocaleString("es-BO") || 0}`}
                        subtitle="Valorización de stock"
                      />
                      <StatCard
                        title="STOCK CRÍTICO"
                        value={statistics.productosStockBajo || 0}
                        subtitle={`${statistics.porcentajeStockBajo || 0}% del catálogo`}
                        valueClassName="text-amber-600 dark:text-amber-400"
                      />
                      <StatCard
                        title="STOCK TOTAL"
                        value={statistics.stockTotal || 0}
                        subtitle="Unidades físicas"
                      />
                    </>
                  )}
              </div>
            )}

          <div className="border border-border bg-card rounded-xs p-5">
            <div className="flex flex-row items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {getSubTypeLabel(subType)}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mostrando {data.length} registros para el período seleccionado
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-border bg-background hover:bg-muted text-foreground text-xs font-mono uppercase rounded-xs cursor-pointer shadow-none"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Exportar CSV
                </Button>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-border bg-background hover:bg-muted text-foreground text-xs font-mono uppercase rounded-xs cursor-pointer shadow-none"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            <div className="rounded-xs border border-border">
              <ReportTable
                data={data}
                reportType={reportType}
                subType={subType}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getReportColumns(reportType, subType) {
  if (reportType === "ventas") {
    if (subType === "ventas-detallado") {
      return [
        { accessorKey: "date", header: "Fecha", cell: ({ row }) => formatSafeDate(row.getValue("date")) },
        { accessorKey: "customer", header: "Cliente" },
        { accessorKey: "product", header: "Producto" },
        { accessorKey: "quantity", header: "Cantidad", cell: ({ row }) => <span className="text-center block">{row.getValue("quantity")}</span> },
        { accessorKey: "unitPrice", header: "Precio Unit.", cell: ({ row }) => <span className="text-right block">Bs. {Number(row.getValue("unitPrice") || 0).toFixed(2)}</span> },
        { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="text-right block font-semibold">Bs. {Number(row.getValue("total") || 0).toFixed(2)}</span> },
        { accessorKey: "salesPerson", header: "Vendedor" },
        {
          id: "receiptUrl",
          header: "Recibo",
          cell: ({ row }) => row.original.receiptUrl ? (
            <a href={row.original.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-primary hover:underline">
              <Eye className="h-4 w-4" />
            </a>
          ) : <span className="text-muted-foreground text-xs">N/A</span>,
        },
      ];
    }
    if (subType === "ventas-resumen") {
      return [
        { accessorKey: "date", header: "Fecha", cell: ({ row }) => formatSafeDate(row.getValue("date")) },
        { accessorKey: "customer", header: "Cliente" },
        { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="text-right block font-semibold">Bs. {Number(row.getValue("total") || 0).toFixed(2)}</span> },
        { accessorKey: "salesPerson", header: "Vendedor" },
      ];
    }
    if (subType === "ventas-productos") {
      return [
        { accessorKey: "product", header: "Producto" },
        { accessorKey: "quantity", header: "Cantidad", cell: ({ row }) => <span className="text-center block">{row.getValue("quantity")}</span> },
        { accessorKey: "total", header: "Total", cell: ({ row }) => <span className="text-right block font-semibold">Bs. {Number(row.getValue("total") || 0).toFixed(2)}</span> },
        { accessorKey: "date", header: "Fecha", cell: ({ row }) => formatSafeDate(row.getValue("date")) },
      ];
    }
  }

  if (reportType === "inventario") {
    if (subType === "inventario-stock") {
      return [
        { accessorKey: "product", header: "Producto" },
        { accessorKey: "sku", header: "SKU", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("sku")}</span> },
        { accessorKey: "currentStock", header: "Stock Actual", cell: ({ row }) => <span className="text-center block">{row.getValue("currentStock")}</span> },
        { accessorKey: "reorderPoint", header: "Punto Reorden", cell: ({ row }) => <span className="text-center block">{row.getValue("reorderPoint")}</span> },
        {
          accessorKey: "status",
          header: "Estado",
          cell: ({ row }) => (
            <Badge variant={row.getValue("status") === "Bajo Stock" ? "destructive" : "default"}>
              {row.getValue("status")}
            </Badge>
          ),
        },
      ];
    }
    if (subType === "inventario-valorizado") {
      return [
        { accessorKey: "product", header: "Producto" },
        { accessorKey: "currentStock", header: "Stock", cell: ({ row }) => <span className="text-center block">{row.getValue("currentStock")}</span> },
        { accessorKey: "unitCost", header: "Costo Unit.", cell: ({ row }) => <span className="text-right block">Bs. {Number(row.getValue("unitCost") || 0).toFixed(2)}</span> },
        { accessorKey: "totalValue", header: "Valor Total", cell: ({ row }) => <span className="text-right block font-semibold">Bs. {Number(row.getValue("totalValue") || 0).toFixed(2)}</span> },
        { accessorKey: "category", header: "Categoría", cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge> },
      ];
    }
    if (subType === "inventario-movimientos") {
      return [
        { accessorKey: "date", header: "Fecha", cell: ({ row }) => formatSafeDate(row.getValue("date")) },
        { accessorKey: "product", header: "Producto" },
        {
          accessorKey: "type",
          header: "Tipo",
          cell: ({ row }) => {
            const t = row.getValue("type");
            return <Badge variant={t === "Entrada" ? "default" : t === "Salida" ? "destructive" : "secondary"}>{t}</Badge>;
          },
        },
        { accessorKey: "quantity", header: "Cantidad", cell: ({ row }) => <span className="text-center block">{row.getValue("quantity")}</span> },
        { accessorKey: "reason", header: "Motivo" },
        { accessorKey: "reference", header: "Referencia", cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("reference")}</span> },
      ];
    }
  }

  return [];
}

function ReportTable({ data, reportType, subType }) {
  const columns = useMemo(() => getReportColumns(reportType, subType), [reportType, subType]);

  if (!columns.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay datos disponibles para este tipo de reporte.
      </div>
    );
  }

  return <DataTable columns={columns} data={data} />;
}
