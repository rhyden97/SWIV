import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as Papa from "papaparse";
import { format } from "date-fns";
import { toast } from "sonner";

export const generatePurchaseOrderPDF = (orden, options = false) => {
  const returnBlob =
    typeof options === "boolean" ? options : Boolean(options?.returnBlob);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ORDEN DE COMPRA", margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado: ${new Date().toLocaleDateString("es-BO")}`,
    pageWidth - margin,
    16,
    { align: "right" },
  );

  let cursorY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const ordenIdStr = orden.id ? String(orden.id) : "N/A";
  doc.text(
    `Orden #${ordenIdStr.includes("-") ? ordenIdStr.slice(0, 8) : ordenIdStr}`,
    margin,
    cursorY,
  );

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const proveedorNombre =
    orden.proveedor_nombre ||
    orden.supplier ||
    orden.providerName ||
    "Sin proveedor";
  doc.text(`Proveedor: ${proveedorNombre}`, margin, cursorY);
  cursorY += 6;
  doc.text(`Estado: ${orden.estado || "Borrador"}`, margin, cursorY);
  cursorY += 6;
  const fechaStr = orden.fecha_pedido || orden.date;
  doc.text(
    `Fecha: ${fechaStr ? new Date(fechaStr).toLocaleDateString("es-BO") : "—"}`,
    margin,
    cursorY,
  );

  const rawItems = orden.items || [];
  const total = Number(orden.total_orden ?? orden.total ?? 0);

  const tableBody =
    rawItems.length > 0
      ? rawItems.map((i, idx) => {
          const prodName =
            i.producto?.nombre || i.product || i.nombre || "Ítem de inventario";
          const cant = Number(i.cantidad ?? i.quantity ?? 1);
          const unit = Number(i.costo_unitario ?? i.unitPrice ?? 0);
          const sub = unit > 0 ? cant * unit : 0;
          return [
            idx + 1,
            prodName,
            cant,
            `Bs ${unit.toFixed(2)}`,
            `Bs ${sub.toFixed(2)}`,
          ];
        })
      : [
          [
            1,
            "Compra a proveedor",
            1,
            `Bs ${total.toFixed(2)}`,
            `Bs ${total.toFixed(2)}`,
          ],
        ];

  autoTable(doc, {
    startY: cursorY + 6,
    head: [["#", "Producto", "Cantidad", "Precio Unit.", "Subtotal"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const finalY = (doc.lastAutoTable?.finalY || 100) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: Bs ${total.toFixed(2)}`, pageWidth - margin, finalY, {
    align: "right",
  });

  if (orden.observations?.trim()) {
    const notesY = finalY + 8;
    doc.setFontSize(10);
    doc.text("Observaciones", margin, notesY);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, notesY + 2, pageWidth - margin, notesY + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      doc.splitTextToSize(orden.observations, contentWidth),
      margin,
      notesY + 8,
    );
  }

  if (returnBlob) return doc.output("blob");

  doc.save(`orden-compra-${orden.id || "nueva"}.pdf`);
  toast.success("Orden generada", {
    description: `PDF de la orden ${orden.id || ""} descargado exitosamente`,
  });
};

export const generateSaleReceiptPDF = (venta, options = false) => {
  const returnBlob =
    typeof options === "boolean" ? options : Boolean(options?.returnBlob);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const totalVenta = Number(venta.total_venta ?? venta.total ?? 0);
  const clienteNombre =
    venta.cliente_nombre || venta.customerName || "Cliente general";
  const ventaIdStr = venta.id ? String(venta.id) : "N/A";
  const idShort = ventaIdStr.includes("-")
    ? ventaIdStr.slice(0, 8)
    : ventaIdStr;

  doc.setFillColor(217, 119, 6);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RECIBO DE VENTA", margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado: ${new Date().toLocaleDateString("es-BO")}`,
    pageWidth - margin,
    16,
    { align: "right" },
  );

  let cursorY = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Venta #${idShort}`, margin, cursorY);

  cursorY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const fechaStr = venta.fecha_venta || venta.date;
  doc.text(
    `Fecha: ${fechaStr ? new Date(fechaStr).toLocaleDateString("es-BO") : new Date().toLocaleDateString("es-BO")}`,
    margin,
    cursorY,
  );
  cursorY += 6;
  doc.text(`Cliente: ${clienteNombre}`, margin, cursorY);
  cursorY += 6;
  doc.text(
    `Estado: ${venta.estado || (venta.paymentMethod?.toLowerCase() === "cancelada" ? "Cancelada" : "Completada")}`,
    margin,
    cursorY,
  );

  const rawItems = venta.items || [];
  const tableData =
    rawItems.length > 0
      ? rawItems.map((item, index) => {
          const prodName =
            item.producto?.nombre ||
            item.product ||
            item.nombre ||
            "Producto";
          const cant = Number(item.cantidad ?? item.quantity ?? 1);
          const unit = Number(item.precio_unitario ?? item.unitPrice ?? 0);
          const sub = Number(item.subtotal ?? cant * unit);
          return [
            index + 1,
            prodName,
            cant,
            `Bs ${unit.toFixed(2)}`,
            `Bs ${sub.toFixed(2)}`,
          ];
        })
      : [
          [
            1,
            `Venta - ${clienteNombre}`,
            1,
            `Bs ${totalVenta.toFixed(2)}`,
            `Bs ${totalVenta.toFixed(2)}`,
          ],
        ];

  autoTable(doc, {
    startY: cursorY + 6,
    head: [["#", "Producto", "Cantidad", "Precio Unit.", "Subtotal"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 9 },
  });

  const finalY = (doc.lastAutoTable?.finalY || cursorY + 30) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL: Bs ${totalVenta.toFixed(2)}`, pageWidth - margin, finalY, {
    align: "right",
  });

  if (venta.observations?.trim()) {
    const notesY = finalY + 8;
    doc.setFontSize(10);
    doc.text("Observaciones", margin, notesY);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, notesY + 2, pageWidth - margin, notesY + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(
      doc.splitTextToSize(venta.observations, contentWidth),
      margin,
      notesY + 8,
    );
  }

  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Gracias por su compra. Documento emitido por SWGVI.",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  if (returnBlob) return doc.output("blob");

  doc.save(`recibo-${venta.id || "venta"}.pdf`);
  toast.success("Recibo generado", {
    description: `PDF del recibo ${venta.id || ""} descargado`,
  });
};

export const generateReportPDF = (data, reportType, subType, statistics) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`REPORTE: ${reportType.toUpperCase()}`, margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
    pageWidth - margin,
    16,
    { align: "right" },
  );

  let cursorY = 34;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Tipo: ${getSubTypeLabel(reportType, subType)}`, margin, cursorY);
  cursorY += 8;

  if (statistics && Object.keys(statistics).length > 0) {
    doc.setFontSize(10);
    doc.text("Resumen Estadístico", margin, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    Object.entries(statistics).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        doc.text(`${getStatLabel(key)}:`, margin, cursorY);
        cursorY += 5;
        Object.entries(value)
          .slice(0, 3)
          .forEach(([subKey, subVal]) => {
            doc.text(
              `  • ${subKey}: ${formatValue(subVal)}`,
              margin + 4,
              cursorY,
            );
            cursorY += 5;
          });
      } else {
        doc.text(
          `${getStatLabel(key)}: ${formatValue(value)}`,
          margin,
          cursorY,
        );
        cursorY += 5;
      }
    });
    cursorY += 4;
  }

  const { columns, rows } = getTableConfig(data, reportType, subType);

  if (columns.length > 0) {
    autoTable(doc, {
      startY: cursorY,
      head: [columns],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Página ${i} de ${totalPages} — SWGVI`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  return doc;
};

export const exportToCSV = (data, reportType, subType) => {
  const { columns, rows } = getTableConfig(data, reportType, subType);
  const csvData = [columns, ...rows];
  const csv = Papa.unparse(csvData, { header: false, delimiter: ",", quotes: true });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `reporte-${reportType}-${subType}-${format(new Date(), "yyyy-MM-dd")}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getTableConfig = (data, reportType, subType) => {
  const safeDate = (d) => (d ? format(new Date(d), "dd/MM/yy") : "—");
  const num = (v) => Number(v || 0).toFixed(0);

  const configs = {
    "ventas-detallado": {
      columns: ["ID", "Fecha", "Cliente", "Producto", "Cant.", "P.Unit", "Total", "Vendedor"],
      rows: (data || []).map((i) => [
        i.id,
        safeDate(i.date),
        String(i.customer || "").slice(0, 15),
        String(i.product || "").slice(0, 15),
        i.quantity,
        `Bs. ${num(i.unitPrice)}`,
        `Bs. ${num(i.total)}`,
        String(i.salesPerson || "").slice(0, 10),
      ]),
    },
    "ventas-resumen": {
      columns: ["Fecha", "Cliente", "Total", "Vendedor"],
      rows: (data || []).map((i) => [
        safeDate(i.date),
        String(i.customer || "").slice(0, 20),
        `Bs. ${num(i.total)}`,
        String(i.salesPerson || "").slice(0, 15),
      ]),
    },
    "ventas-productos": {
      columns: ["Producto", "Cantidad", "Total", "Fecha"],
      rows: (data || []).map((i) => [
        String(i.product || "").slice(0, 20),
        i.quantity,
        `Bs. ${num(i.total)}`,
        safeDate(i.date),
      ]),
    },
    "inventario-stock": {
      columns: ["Producto", "SKU", "Stock", "Min", "Estado"],
      rows: (data || []).map((i) => [
        String(i.product || "").slice(0, 20),
        i.sku,
        i.currentStock,
        i.reorderPoint,
        String(i.status || "").slice(0, 10),
      ]),
    },
    "inventario-valorizado": {
      columns: ["Producto", "Stock", "Costo", "Valor", "Cat."],
      rows: (data || []).map((i) => [
        String(i.product || "").slice(0, 15),
        i.currentStock,
        `Bs. ${num(i.unitCost)}`,
        `Bs. ${num(i.totalValue)}`,
        String(i.category || "").slice(0, 10),
      ]),
    },
    "inventario-movimientos": {
      columns: ["Fecha", "Producto", "Tipo", "Cant.", "Motivo", "Ref."],
      rows: (data || []).map((i) => [
        safeDate(i.date),
        String(i.product || "").slice(0, 15),
        i.type,
        i.quantity,
        String(i.reason || "").slice(0, 15),
        i.reference,
      ]),
    },
    "ordenes-compra": {
      columns: ["ID", "Fecha", "Proveedor", "Entrega Est.", "Estado", "Total"],
      rows: (data || []).map((i) => [
        i.id,
        safeDate(i.date),
        String(i.supplier || "").slice(0, 20),
        safeDate(i.estimatedDelivery),
        i.status,
        `Bs. ${num(i.total)}`,
      ]),
    },
  };

  return configs[subType] || configs[reportType] || { columns: [], rows: [] };
};

const getSubTypeLabel = (reportType, subType) => {
  const labels = {
    "ventas-detallado": "Ventas Detallado",
    "ventas-resumen": "Ventas Resumen",
    "ventas-productos": "Ventas por Productos",
    "inventario-stock": "Inventario por Stock",
    "inventario-valorizado": "Inventario Valorizado",
    "inventario-movimientos": "Movimientos de Inventario",
    "ordenes-compra": "Órdenes de Compra",
  };
  return labels[subType] || subType;
};

const getStatLabel = (key) => {
  const labels = {
    totalSales: "Total de Ventas",
    totalOrders: "Total de Órdenes",
    averageOrderValue: "Valor Promedio por Orden",
    topCustomer: "Ventas por Cliente",
    salesByRegion: "Ventas por Región",
    totalItems: "Total de Productos",
    totalValue: "Valor Total del Inventario",
    lowStockItems: "Productos con Stock Bajo",
    totalStock: "Stock Total",
    categoriesCount: "Número de Categorías",
  };
  return labels[key] || key;
};

const formatValue = (value) => {
  if (typeof value === "number") {
    if (value > 1000) {
      return `Bs. ${value.toLocaleString("es-BO", { maximumFractionDigits: 0 })}`;
    }
    return String(value);
  }
  return String(value ?? "").slice(0, 30);
};