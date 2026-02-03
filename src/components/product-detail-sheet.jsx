"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Printer,
  Package,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  Pencil,
  Boxes,
  DollarSign,
  Ruler,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumberBO } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductDetailPage({ product, onBack, onProductUpdated }) {
  const [productData, setProductData] = useState(product);
  const [descripcion, setDescripcion] = useState(product.descripcion || "");
  const [generandoDescripcion, setGenerandoDescripcion] = useState(false);
  const [guardandoDescripcion, setGuardandoDescripcion] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const [formData, setFormData] = useState({
    nombre: product.nombre || "",
    sku: product.sku || "",
    precio_venta: product.precio_venta ?? 0,
    costo_unitario_base: product.costo_unitario_base ?? 0,
    stock_actual: product.stock_actual ?? 0,
    punto_reorden: product.punto_reorden ?? 0,
    stock_seguridad: product.stock_seguridad ?? 0,
    eoq: product.eoq ?? 0,
    unidad_medida: product.unidad_medida || "unidad",
    ubicacion: product.ubicacion || "",
    ubicacion_objetivo: product.ubicacion_objetivo || "",
    origen: product.origen || "Nacional",
    politica_inventario: product.politica_inventario || "Revisión continua",
    es_perecedero: Boolean(product.es_perecedero),
    dias_alerta_vencimiento: product.dias_alerta_vencimiento ?? 30,
    url_imagen: product.url_imagen || "",
    activo: product.activo !== false,
  });

  const [simulatedDiscount, setSimulatedDiscount] = useState(0);
  const [simulatedCustomPrice, setSimulatedCustomPrice] = useState(product.precio_venta || 0);

  useEffect(() => {
    setProductData(product);
    setDescripcion(product.descripcion || "");
    setFormData({
      nombre: product.nombre || "",
      sku: product.sku || "",
      precio_venta: product.precio_venta ?? 0,
      costo_unitario_base: product.costo_unitario_base ?? 0,
      stock_actual: product.stock_actual ?? 0,
      punto_reorden: product.punto_reorden ?? 0,
      stock_seguridad: product.stock_seguridad ?? 0,
      eoq: product.eoq ?? 0,
      unidad_medida: product.unidad_medida || "unidad",
      ubicacion: product.ubicacion || "",
      ubicacion_objetivo: product.ubicacion_objetivo || "",
      origen: product.origen || "Nacional",
      politica_inventario: product.politica_inventario || "Revisión continua",
      es_perecedero: Boolean(product.es_perecedero),
      dias_alerta_vencimiento: product.dias_alerta_vencimiento ?? 30,
      url_imagen: product.url_imagen || "",
      activo: product.activo !== false,
    });
    setSimulatedCustomPrice(product.precio_venta || 0);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isEditDialogOpen) {
          setIsEditDialogOpen(false);
        } else if (onBack) {
          onBack();
        }
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setIsEditDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditDialogOpen, onBack, productData]);

  const costo = Number(productData.costo_unitario_base) || 0;
  const precio = Number(productData.precio_venta) || 0;
  const stockActual = Number(productData.stock_actual) || 0;
  const puntoReorden = Number(productData.punto_reorden) || 0;
  const stockSeguridad = Number(productData.stock_seguridad) || 0;
  const eoq = Number(productData.eoq) || 0;
  const leadTime = Number(productData.proveedor_tiempo_entrega || productData.proveedor?.tiempo_entrega) || 7;
  const costoPedido = Number(productData.proveedor?.costo_pedido) || 120;

  const gananciaUnitaria = precio - costo;
  const marginPct = precio > 0 ? ((precio - costo) / precio) * 100 : 0;
  const markupMultiplier = costo > 0 ? (precio / costo).toFixed(2) : "0.00";

  const valorInventarioCosto = stockActual * costo;
  const valorInventarioVenta = stockActual * precio;

  const estimatedDailyDemand = useMemo(() => {
    if (puntoReorden > stockSeguridad && leadTime > 0) {
      return (puntoReorden - stockSeguridad) / leadTime;
    }
    if (eoq > 0) {
      return eoq / 30;
    }
    return Math.max(0.5, stockActual / 30);
  }, [puntoReorden, stockSeguridad, leadTime, eoq, stockActual]);

  const diasCobertura = useMemo(() => {
    if (estimatedDailyDemand <= 0) return 0;
    return Math.round(stockActual / estimatedDailyDemand);
  }, [stockActual, estimatedDailyDemand]);

  const stockHealth = useMemo(() => {
    if (stockActual === 0) {
      return {
        key: "quiebre",
        label: "Sin stock",
        sublabel: "Agotado en almacén",
        badgeVariant: "destructive",
        dotColor: "bg-rose-500",
        alertBorder: "border-rose-500/40 bg-rose-500/5",
      };
    }
    if (stockSeguridad > 0 && stockActual <= stockSeguridad) {
      return {
        key: "critico",
        label: "Stock crítico",
        sublabel: "Por debajo del mínimo de seguridad",
        badgeVariant: "destructive",
        dotColor: "bg-rose-500",
        alertBorder: "border-rose-500/40 bg-rose-500/5",
      };
    }
    if (puntoReorden > 0 && stockActual <= puntoReorden) {
      return {
        key: "reorden",
        label: "Reorden necesaria",
        sublabel: "Alcanzó el punto de pedido",
        badgeVariant: "warning",
        dotColor: "bg-amber-500",
        alertBorder: "border-amber-500/40 bg-amber-500/5",
      };
    }
    if (puntoReorden > 0 && stockActual > puntoReorden * 2.5) {
      return {
        key: "sobrestock",
        label: "Sobrestock",
        sublabel: "Exceso de existencias",
        badgeVariant: "info",
        dotColor: "bg-blue-500",
        alertBorder: "border-blue-500/40 bg-blue-500/5",
      };
    }
    return {
      key: "optimo",
      label: "Stock normal",
      sublabel: "Nivel de existencias adecuado",
      badgeVariant: "default",
      dotColor: "bg-emerald-500",
      alertBorder: "border-emerald-500/30 bg-emerald-500/5",
    };
  }, [stockActual, puntoReorden, stockSeguridad]);

  const classificationInfo = useMemo(() => {
    switch (productData.clasificacion_abc) {
      case "A":
        return {
          label: "Alta rotación",
          policy: "Revisión semanal",
          auditFreq: "Semanal",
          description: "Producto principal de alta demanda. Requiere control frecuente.",
          badgeVariant: "default",
        };
      case "B":
        return {
          label: "Rotación media",
          policy: "Revisión quincenal",
          auditFreq: "Mensual",
          description: "Demanda moderada con pedidos periódicos estándar.",
          badgeVariant: "warning",
        };
      case "C":
        return {
          label: "Baja rotación",
          policy: "Revisión mensual",
          auditFreq: "Trimestral",
          description: "Demanda ocasional. Conviene comprar por volumen para reducir pedidos.",
          badgeVariant: "secondary",
        };
      default:
        return {
          label: "Sin clasificar",
          policy: "Pendiente",
          auditFreq: "Pendiente",
          description: "Producto nuevo o sin historial suficiente de ventas.",
          badgeVariant: "secondary",
        };
    }
  }, [productData.clasificacion_abc]);

  const handleCopySku = () => {
    if (!productData.sku) return;
    navigator.clipboard.writeText(productData.sku);
    setCopiedSku(true);
    toast.success(`SKU ${productData.sku} copiado`);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleSaveDescription = async () => {
    setGuardandoDescripcion(true);
    try {
      const payload = {
        sku: productData.sku,
        id: productData.id,
        descripcion: descripcion.trim(),
      };

      const response = await fetch("/api/productos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar descripción");
      }

      const updated = await response.json();
      const merged = { ...productData, descripcion: descripcion.trim(), ...(updated || {}) };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.success("Descripción guardada");
    } catch (err) {
      console.warn("Actualización local de descripción:", err);
      const merged = { ...productData, descripcion: descripcion.trim() };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.info("Descripción guardada localmente");
    } finally {
      setGuardandoDescripcion(false);
    }
  };

  const handleGenerarDescripcion = async () => {
    setGenerandoDescripcion(true);
    try {
      const response = await fetch("/api/productos/generar-descripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: productData.id,
          nombre: productData.nombre,
          proveedor: productData.proveedor_nombre,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar descripción");
      }

      const nuevaDesc = data.descripcion || "";
      setDescripcion(nuevaDesc);
      const merged = { ...productData, descripcion: nuevaDesc };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.success("Descripción generada con éxito");
    } catch (error) {
      console.warn("Generación alternativa de descripción:", error);
      const unitLabel = productData.unidad_medida || "unidad";
      const fallbackDesc = `${productData.nombre} (SKU: ${productData.sku || "N/A"}), clasificado como producto de ${classificationInfo.label.toLowerCase()} de ${productData.proveedor_nombre || "proveedor registrado"}. Almacenado en ${productData.ubicacion || "almacén central"} con reorden en ${puntoReorden} ${unitLabel}s y lote sugerido de ${eoq} ${unitLabel}s.`;
      setDescripcion(fallbackDesc);
      const merged = { ...productData, descripcion: fallbackDesc };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.info("Descripción generada con plantilla");
    } finally {
      setGenerandoDescripcion(false);
    }
  };

  const handleSaveProductForm = async (e) => {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      const payload = {
        id: productData.id,
        sku: formData.sku.trim(),
        nombre: formData.nombre.trim(),
        precio_venta: Number(formData.precio_venta),
        costo_unitario_base: Number(formData.costo_unitario_base),
        stock_actual: Number(formData.stock_actual),
        punto_reorden: Number(formData.punto_reorden),
        stock_seguridad: Number(formData.stock_seguridad),
        eoq: Number(formData.eoq),
        unidad_medida: formData.unidad_medida.trim(),
        ubicacion: formData.ubicacion.trim(),
        ubicacion_objetivo: formData.ubicacion_objetivo.trim(),
        origen: formData.origen.trim(),
        politica_inventario: formData.politica_inventario.trim(),
        es_perecedero: Boolean(formData.es_perecedero),
        dias_alerta_vencimiento: Number(formData.dias_alerta_vencimiento),
        url_imagen: formData.url_imagen.trim(),
        activo: Boolean(formData.activo),
      };

      const response = await fetch("/api/productos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Error al actualizar los datos");
      }

      const updated = await response.json();
      const merged = { ...productData, ...payload, ...(updated || {}) };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.success("Producto actualizado correctamente");
      setIsEditDialogOpen(false);
    } catch (err) {
      console.warn("Actualización local de datos:", err);
      const merged = {
        ...productData,
        ...formData,
        precio_venta: Number(formData.precio_venta),
        costo_unitario_base: Number(formData.costo_unitario_base),
        stock_actual: Number(formData.stock_actual),
        punto_reorden: Number(formData.punto_reorden),
        stock_seguridad: Number(formData.stock_seguridad),
        eoq: Number(formData.eoq),
        dias_alerta_vencimiento: Number(formData.dias_alerta_vencimiento),
      };
      setProductData(merged);
      onProductUpdated?.(merged);
      toast.info("Cambios guardados localmente");
      setIsEditDialogOpen(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handlePrint = useCallback(() => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, pageWidth, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("FICHA TÉCNICA DE PRODUCTO", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 205);
    const fechaEmision = new Date().toLocaleString("es-BO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    doc.text(`Fecha: ${fechaEmision}`, pageWidth - margin, 13, { align: "right" });

    let cursorY = 32;

    doc.setTextColor(24, 24, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(String(productData.nombre || "PRODUCTO").toUpperCase(), margin, cursorY);

    cursorY += 6;
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    doc.text(`SKU: ${productData.sku || "N/A"}`, margin, cursorY);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Clase: ${productData.clasificacion_abc || "N/A"}`,
      pageWidth - margin,
      cursorY,
      { align: "right" }
    );

    cursorY += 4;
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.4);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);

    cursorY += 6;

    doc.autoTable({
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [["Campo", "Valor"]],
      body: [
        ["Proveedor", productData.proveedor_nombre || "Sin proveedor"],
        ["Ubicación", productData.ubicacion || "Sin ubicación"],
        ["Ubicación objetivo", productData.ubicacion_objetivo || "Misma"],
        ["Unidad de medida", productData.unidad_medida || "unidad"],
        ["Origen", productData.origen || "Nacional"],
        ["Política de inventario", productData.politica_inventario || "Revisión continua"],
        [
          "Perecedero",
          productData.es_perecedero
            ? `Sí (aviso: ${productData.dias_alerta_vencimiento || 30} días)`
            : "No",
        ],
        ["Tiempo de entrega", `${leadTime} días`],
      ],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [24, 24, 27],
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 50 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 6;

    doc.autoTable({
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [["Métrica", "Valor", "Detalle"]],
      body: [
        ["Stock actual", `${stockActual} ${productData.unidad_medida || "uds"}`, stockHealth.label],
        ["Punto de reorden", `${puntoReorden} ${productData.unidad_medida || "uds"}`, "Nivel para ordenar"],
        ["Stock de seguridad", `${stockSeguridad} ${productData.unidad_medida || "uds"}`, "Mínimo de reserva"],
        ["Lote sugerido (EOQ)", `${eoq} ${productData.unidad_medida || "uds"}`, "Cantidad por pedido"],
        ["Cobertura estimada", `${diasCobertura} días`, `Demanda de ~${estimatedDailyDemand.toFixed(1)} uds/día`],
      ],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [24, 24, 27],
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 40, font: "courier", fontStyle: "bold" },
        2: { cellWidth: contentWidth - 90 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 6;

    doc.autoTable({
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [["Concepto", "Monto", "Detalle"]],
      body: [
        ["Costo unitario", `Bs. ${costo.toFixed(2)}`, "Precio de compra"],
        ["Precio de venta", `Bs. ${precio.toFixed(2)}`, "Precio al público"],
        ["Margen por unidad", `Bs. ${gananciaUnitaria.toFixed(2)}`, `Margen: ${marginPct.toFixed(1)}%`],
        ["Total en almacén (costo)", `Bs. ${formatNumberBO(valorInventarioCosto)}`, `${stockActual} unidades`],
        ["Total en almacén (venta)", `Bs. ${formatNumberBO(valorInventarioVenta)}`, "Valor de venta estimado"],
      ],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [24, 24, 27],
        lineColor: [228, 228, 231],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [24, 24, 27],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 8.5,
      },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold" },
        1: { cellWidth: 40, font: "courier", fontStyle: "bold" },
        2: { cellWidth: contentWidth - 90 },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 6;

    if (cursorY + 30 < pageHeight - 20) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(24, 24, 27);
      doc.text("DESCRIPCIÓN DEL PRODUCTO", margin, cursorY);
      cursorY += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 75);

      const splitDesc = doc.splitTextToSize(
        descripcion || "Sin descripción registrada.",
        contentWidth
      );
      doc.text(splitDesc, margin, cursorY);
    }

    const footerY = pageHeight - 12;
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 125);
    doc.text(`SKU: ${productData.sku || "TMP"}`, margin, footerY);
    doc.text(`SWGVI ERP`, pageWidth - margin, footerY, { align: "right" });

    const safeFilename = `${String(productData.sku || productData.nombre || "ficha-tecnica")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}.pdf`;

    doc.save(safeFilename);
    toast.success("PDF descargado correctamente");
  }, [
    productData,
    descripcion,
    costo,
    precio,
    stockActual,
    puntoReorden,
    stockSeguridad,
    eoq,
    leadTime,
    gananciaUnitaria,
    marginPct,
    valorInventarioCosto,
    valorInventarioVenta,
    diasCobertura,
    stockHealth,
    estimatedDailyDemand,
  ]);

  const simulatedResults = useMemo(() => {
    const baseP = Number(simulatedCustomPrice) || precio;
    const discountAmount = (baseP * (Number(simulatedDiscount) || 0)) / 100;
    const effectivePrice = Math.max(0, baseP - discountAmount);
    const effectiveMarginBs = effectivePrice - costo;
    const effectiveMarginPct = effectivePrice > 0 ? (effectiveMarginBs / effectivePrice) * 100 : 0;
    const marginDiffPct = effectiveMarginPct - marginPct;

    return {
      effectivePrice,
      effectiveMarginBs,
      effectiveMarginPct,
      marginDiffPct,
    };
  }, [simulatedCustomPrice, simulatedDiscount, precio, costo, marginPct]);

  const gaugeScale = useMemo(() => {
    const maxReference = Math.max(stockActual, puntoReorden + eoq, 10);
    const ssPct = Math.min(100, Math.max(0, (stockSeguridad / maxReference) * 100));
    const ropPct = Math.min(100, Math.max(0, (puntoReorden / maxReference) * 100));
    const currentPct = Math.min(100, Math.max(0, (stockActual / maxReference) * 100));

    return {
      maxReference,
      ssPct,
      ropPct,
      currentPct,
    };
  }, [stockActual, puntoReorden, eoq, stockSeguridad]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors pb-16">
      <header className="sticky top-0 z-30 w-full border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={onBack}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 rounded-xs font-mono text-xs uppercase px-2.5 border-border hover:bg-muted/40 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Volver</span>
                  <kbd className="hidden sm:inline-block px-1 py-0.2 bg-muted text-xs rounded-xs border border-border">
                    ESC
                  </kbd>
                </Button>

                <div className="h-4 w-px bg-border" />

                <span className="font-mono text-xs text-muted-foreground">
                  Inventario / Ficha Técnica
                </span>

                <span className="font-mono text-xs text-muted-foreground">•</span>

                <button
                  type="button"
                  onClick={handleCopySku}
                  title="Copiar SKU"
                  className="group inline-flex items-center gap-1 font-mono text-xs text-foreground bg-muted/40 hover:bg-muted px-2 py-0.5 rounded-xs border border-border transition-colors cursor-pointer"
                >
                  <span className="text-muted-foreground font-medium">SKU:</span>
                  <span className="font-bold">{productData.sku || "Sin SKU"}</span>
                  {copiedSku ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <h1 className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-foreground uppercase">
                  {productData.nombre || "Producto sin nombre"}
                </h1>

                <Badge
                  variant={classificationInfo.badgeVariant}
                  className="rounded-xs font-mono text-xs uppercase"
                >
                  Clase {productData.clasificacion_abc || "N/A"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                variant="outline"
                className="h-9 gap-2 rounded-xs font-mono text-xs uppercase px-3.5 border-border hover:bg-muted/40 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-muted text-xs rounded-xs border border-border">
                  E
                </kbd>
              </Button>

              <Button
                onClick={handlePrint}
                className="h-9 gap-2 bg-foreground hover:bg-foreground/90 text-background rounded-xs font-mono text-xs uppercase px-4 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Exportar PDF</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-background/20 text-xs rounded-xs border border-background/30">
                  P
                </kbd>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {stockHealth.key !== "optimo" && (
          <div
            className={cn(
              "p-3 rounded-xs border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs",
              stockHealth.alertBorder
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("inline-block size-2 rounded-full", stockHealth.dotColor)} />
              <span className="font-bold text-foreground">
                {stockHealth.label}:
              </span>
              <span className="text-muted-foreground">
                quedan {stockActual} {productData.unidad_medida || "uds"} (reorden en {puntoReorden})
              </span>
            </div>
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              variant="outline"
              size="sm"
              className="h-7 text-xs font-mono uppercase rounded-xs border-border cursor-pointer self-start sm:self-auto"
            >
              Editar
            </Button>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xs bg-card overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-xs uppercase tracking-wider">Stock actual</span>
              <Boxes className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                {formatNumberBO(stockActual)}
              </span>
              <span className="font-mono text-xs uppercase text-muted-foreground">
                {productData.unidad_medida || "uds"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs font-mono">
              <span className="text-muted-foreground">Cobertura estimada:</span>
              <span className="font-semibold text-foreground">
                {diasCobertura} días
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-xs uppercase tracking-wider">Punto de reorden</span>
              <Ruler className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                {puntoReorden}
              </span>
              <span className="font-mono text-xs text-muted-foreground uppercase">
                Seguridad: {stockSeguridad}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs font-mono">
              <span className="text-muted-foreground">Lote sugerido (EOQ):</span>
              <span className="font-semibold text-foreground">
                {eoq} uds
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-xs uppercase tracking-wider">Precio de venta</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                Bs. {precio.toFixed(2)}
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  marginPct >= 30 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}
              >
                {marginPct.toFixed(1)}% margen
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs font-mono">
              <span className="text-muted-foreground">Costo base:</span>
              <span className="font-semibold text-foreground">
                Bs. {costo.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-xs uppercase tracking-wider">Total en almacén</span>
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                Bs. {formatNumberBO(valorInventarioCosto)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs font-mono">
              <span className="text-muted-foreground">Valor de venta:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Bs. {formatNumberBO(valorInventarioVenta)}
              </span>
            </div>
          </div>
        </section>

        <section className="border border-border rounded-xs bg-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-mono">
            <h2 className="font-semibold text-foreground uppercase tracking-wider">
              Niveles de stock
            </h2>
            <span className="text-muted-foreground">
              Actual: <strong className="text-foreground">{stockActual}</strong> de ~{gaugeScale.maxReference} unidades
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="relative h-3 w-full rounded-xs bg-muted/40 overflow-hidden border border-border flex">
              <div
                style={{ width: `${Math.max(5, gaugeScale.ssPct)}%` }}
                className="h-full bg-rose-500/20 border-r border-rose-500/30"
                title={`Zona Crítica (0 - ${stockSeguridad})`}
              />
              <div
                style={{ width: `${Math.max(5, Math.max(0, gaugeScale.ropPct - gaugeScale.ssPct))}%` }}
                className="h-full bg-amber-500/20 border-r border-amber-500/30"
                title={`Zona de Reorden (${stockSeguridad} - ${puntoReorden})`}
              />
              <div
                className="h-full flex-1 bg-emerald-500/20"
                title="Zona Normal"
              />
            </div>

            <div
              style={{ left: `${Math.min(98, Math.max(2, gaugeScale.currentPct))}%` }}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            >
              <div className="bg-foreground text-background font-mono text-xs font-bold px-1.5 py-0.5 rounded-xs shadow-xs uppercase tracking-tight whitespace-nowrap">
                Actual: {stockActual}
              </div>
              <div className="w-0.5 h-3 bg-foreground" />
            </div>

            <div
              style={{ left: `${Math.min(98, Math.max(2, gaugeScale.ropPct))}%` }}
              className="absolute top-4 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            >
              <div className="w-px h-6 bg-amber-500 border-l border-dashed border-amber-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60 text-xs font-mono text-muted-foreground">
            <div>
              <span className="text-rose-600 dark:text-rose-400 font-bold">• Seguridad:</span>{" "}
              <span className="text-foreground">{stockSeguridad} uds</span>
            </div>
            <div>
              <span className="text-amber-600 dark:text-amber-400 font-bold">• Reorden:</span>{" "}
              <span className="text-foreground">{puntoReorden} uds</span>
            </div>
            <div>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">• Lote:</span>{" "}
              <span className="text-foreground">{eoq} uds</span>
            </div>
            <div className="sm:text-right">
              <span className="font-bold text-foreground">• {stockHealth.label}</span>
            </div>
          </div>
        </section>

        <Tabs defaultValue="especificaciones" className="w-full space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto border-b border-border rounded-none bg-transparent p-0 h-auto gap-1">
            <TabsTrigger value="especificaciones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground py-2 px-3 text-xs">
              Almacén
            </TabsTrigger>
            <TabsTrigger value="ingenieria" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground py-2 px-3 text-xs">
              Reorden y lote
            </TabsTrigger>
            <TabsTrigger value="finanzas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground py-2 px-3 text-xs">
              Finanzas
            </TabsTrigger>
            <TabsTrigger value="descripcion" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground py-2 px-3 text-xs">
              Descripción
            </TabsTrigger>
          </TabsList>

          <TabsContent value="especificaciones" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 border border-border rounded-xs bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Datos del producto
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    SKU {productData.sku || "N/A"}
                  </span>
                </div>

                <div className="divide-y divide-border text-xs font-mono">
                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Proveedor</span>
                    <span className="col-span-2 font-bold text-foreground">
                      {productData.proveedor_nombre || "Sin proveedor asignado"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Ubicación actual</span>
                    <span className="col-span-2 font-semibold text-foreground">
                      {productData.ubicacion || "Sin ubicación"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Ubicación objetivo</span>
                    <span className="col-span-2 text-foreground">
                      {productData.ubicacion_objetivo || "Misma"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Unidad de medida</span>
                    <span className="col-span-2 font-semibold text-foreground uppercase">
                      {productData.unidad_medida || "unidad"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Origen</span>
                    <span className="col-span-2 text-foreground">
                      {productData.origen || "Nacional"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Política de inventario</span>
                    <span className="col-span-2 text-foreground">
                      {productData.politica_inventario || "Revisión continua"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Tiempo de entrega</span>
                    <span className="col-span-2 font-semibold text-foreground">
                      {leadTime} días
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Costo por pedido</span>
                    <span className="col-span-2 text-foreground">
                      Bs. {costoPedido.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 p-3 hover:bg-muted/10 transition-colors">
                    <span className="text-muted-foreground uppercase font-medium">Perecedero</span>
                    <div className="col-span-2 flex items-center gap-2">
                      {productData.es_perecedero ? (
                        <>
                          <Badge variant="warning" className="rounded-xs text-xs uppercase">
                            Sí (aviso {productData.dias_alerta_vencimiento || 30} días)
                          </Badge>
                          <span className="text-muted-foreground">Despacho FEFO</span>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="rounded-xs text-xs uppercase">
                            No
                          </Badge>
                          <span className="text-muted-foreground">Despacho FIFO</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 border border-border rounded-xs bg-card overflow-hidden flex flex-col justify-between">
                <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Imagen
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    1:1
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-full aspect-square max-w-72 rounded-xs bg-muted/20 border border-border flex items-center justify-center overflow-hidden">
                    {productData.url_imagen ? (
                      <img
                        src={productData.url_imagen}
                        alt={productData.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <Package className="h-12 w-12 text-muted-foreground/40 stroke-1" />
                        <span className="font-mono text-xs text-muted-foreground">
                          Sin imagen
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">¿Editar imagen?</span>
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono uppercase rounded-xs border-border cursor-pointer"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ingenieria" className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-xs bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                    Punto de reorden (ROP)
                  </h3>
                  <Badge variant="warning" className="rounded-xs font-mono text-xs">
                    {puntoReorden} {productData.unidad_medida || "uds"}
                  </Badge>
                </div>

                <div className="p-3 rounded-xs bg-muted/30 border border-border font-mono text-xs space-y-1">
                  <div className="text-muted-foreground uppercase text-xs tracking-wider">Fórmula:</div>
                  <div className="text-sm font-bold text-foreground">
                    ROP = (demanda diaria × entrega) + seguridad
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Demanda diaria (promedio):</span>
                    <span className="font-bold text-foreground">{estimatedDailyDemand.toFixed(1)} uds/día</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Tiempo de entrega:</span>
                    <span className="font-bold text-foreground">{leadTime} días</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Stock de seguridad:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">+{stockSeguridad} uds</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 font-bold text-foreground bg-muted/20 px-2 rounded-xs">
                    <span>Reorden resultante:</span>
                    <span>{puntoReorden} uds</span>
                  </div>
                </div>

                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  Hacer un nuevo pedido cuando el stock baje a <strong>{puntoReorden} unidades</strong> para reabastecer a tiempo sin agotar la seguridad.
                </p>
              </div>

              <div className="border border-border rounded-xs bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                    Lote económico (EOQ)
                  </h3>
                  <Badge variant="default" className="rounded-xs font-mono text-xs">
                    {eoq} {productData.unidad_medida || "uds"}
                  </Badge>
                </div>

                <div className="p-3 rounded-xs bg-muted/30 border border-border font-mono text-xs space-y-1">
                  <div className="text-muted-foreground uppercase text-xs tracking-wider">Fórmula:</div>
                  <div className="text-sm font-bold text-foreground">
                    EOQ = √((2 × demanda anual × costo pedido) / costo almacén)
                  </div>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Demanda anual estimada:</span>
                    <span className="font-bold text-foreground">
                      {Math.round(estimatedDailyDemand * 365)} uds
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Costo por pedido:</span>
                    <span className="font-bold text-foreground">Bs. {costoPedido.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Costo de almacenamiento anual:</span>
                    <span className="font-bold text-foreground">
                      Bs. {(costo * 0.2 || 1).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 font-bold text-foreground bg-muted/20 px-2 rounded-xs">
                    <span>Lote sugerido (EOQ):</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{eoq} uds</span>
                  </div>
                </div>

                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  Comprar en lotes de <strong>{eoq} unidades</strong> optimiza los costos de pedido y de inventario en bodega.
                </p>
              </div>
            </div>

            <div className="border border-border rounded-xs bg-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                  Clasificación ABC ({productData.clasificacion_abc || "N/A"})
                </h3>
                <Badge variant={classificationInfo.badgeVariant} className="rounded-xs font-mono text-xs uppercase">
                  {classificationInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 font-mono text-xs">
                <div className="p-3 bg-muted/20 border border-border rounded-xs space-y-1">
                  <span className="text-muted-foreground uppercase text-xs">Control sugerido</span>
                  <p className="font-bold text-foreground">{classificationInfo.policy}</p>
                </div>
                <div className="p-3 bg-muted/20 border border-border rounded-xs space-y-1">
                  <span className="text-muted-foreground uppercase text-xs">Frecuencia de conteo</span>
                  <p className="font-bold text-foreground">{classificationInfo.auditFreq}</p>
                </div>
                <div className="p-3 bg-muted/20 border border-border rounded-xs space-y-1">
                  <span className="text-muted-foreground uppercase text-xs">Disponibilidad objetivo</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">98%</p>
                </div>
              </div>

              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {classificationInfo.description}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="finanzas" className="space-y-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 border border-border rounded-xs bg-card p-5 space-y-4">
                <div className="border-b border-border pb-3">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                    Costos y márgenes
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    Valores actuales del producto
                  </p>
                </div>

                <div className="divide-y divide-border text-xs font-mono">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground uppercase">Costo unitario</span>
                    <span className="font-bold text-foreground">Bs. {costo.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground uppercase">Precio de venta</span>
                    <span className="font-bold text-foreground">Bs. {precio.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground uppercase">Ganancia por unidad</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +Bs. {gananciaUnitaria.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground uppercase">Margen sobre venta</span>
                    <span className="font-bold text-foreground">{marginPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground uppercase">Multiplicador sobre costo</span>
                    <span className="font-bold text-foreground">{markupMultiplier}x</span>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 border border-border rounded-xs font-mono text-xs space-y-2">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-xs">
                    En almacén ({stockActual} unidades):
                  </span>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Inversión a costo:</span>
                    <strong className="text-foreground">Bs. {formatNumberBO(valorInventarioCosto)}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor estimado a venta:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Bs. {formatNumberBO(valorInventarioVenta)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 border border-border rounded-xs bg-card p-5 space-y-4">
                <div className="border-b border-border pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                      Simulador de precios
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      Calcula el margen según el precio o descuento
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSimulatedCustomPrice(precio);
                      setSimulatedDiscount(0);
                    }}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-mono rounded-xs border-border cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-muted-foreground uppercase font-medium">
                      Precio de venta simulado (Bs.):
                    </label>
                    <Input
                      type="number"
                      step="0.50"
                      value={simulatedCustomPrice}
                      onChange={(e) => setSimulatedCustomPrice(Number(e.target.value) || 0)}
                      className="h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-muted-foreground uppercase font-medium">
                        Descuento comercial:
                      </label>
                      <span className="font-bold text-foreground">{simulatedDiscount}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={simulatedDiscount}
                      onChange={(e) => setSimulatedDiscount(Number(e.target.value) || 0)}
                      className="w-full accent-foreground cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xs border border-border bg-muted/20 space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Precio final al cliente:</span>
                      <span className="font-bold text-sm text-foreground">
                        Bs. {simulatedResults.effectivePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Ganancia por unidad:</span>
                      <span
                        className={cn(
                          "font-bold",
                          simulatedResults.effectiveMarginBs >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        )}
                      >
                        Bs. {simulatedResults.effectiveMarginBs.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Margen final:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">
                          {simulatedResults.effectiveMarginPct.toFixed(1)}%
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            simulatedResults.marginDiffPct >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          )}
                        >
                          ({simulatedResults.marginDiffPct >= 0 ? "+" : ""}
                          {simulatedResults.marginDiffPct.toFixed(1)}% vs actual)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="descripcion" className="space-y-4 pt-2">
            <div className="border border-border rounded-xs bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                    Descripción del producto
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    Texto oficial para fichas y reportes
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleGenerarDescripcion}
                    disabled={generandoDescripcion}
                    variant="outline"
                    className="h-9 gap-2 rounded-xs font-mono text-xs uppercase px-3 border-border hover:bg-muted/40 cursor-pointer"
                  >
                    {generandoDescripcion ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Generar con IA</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSaveDescription}
                    disabled={guardandoDescripcion}
                    className="h-9 gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-xs font-mono text-xs uppercase px-3.5 cursor-pointer"
                  >
                    {guardandoDescripcion ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Guardar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe la descripción técnica del producto..."
                  className="min-h-36 font-mono text-xs leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{descripcion.length} caracteres</span>
                  <span>Incluido en el PDF exportado</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveProductForm}>
            <DialogHeader>
              <DialogTitle>Editar producto</DialogTitle>
              <DialogDescription>
                Modifica los datos y umbrales de reorden del SKU {productData.sku || "N/A"}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 font-mono text-xs">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Nombre</label>
                <Input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">SKU</label>
                <Input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Unidad de medida</label>
                <Input
                  type="text"
                  value={formData.unidad_medida}
                  placeholder="unidad, galón, pack..."
                  onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Precio de venta (Bs.)</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio_venta}
                  onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Costo unitario (Bs.)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costo_unitario_base}
                  onChange={(e) => setFormData({ ...formData, costo_unitario_base: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Stock actual</label>
                <Input
                  type="number"
                  value={formData.stock_actual}
                  onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Punto de reorden</label>
                <Input
                  type="number"
                  value={formData.punto_reorden}
                  onChange={(e) => setFormData({ ...formData, punto_reorden: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Stock de seguridad</label>
                <Input
                  type="number"
                  value={formData.stock_seguridad}
                  onChange={(e) => setFormData({ ...formData, stock_seguridad: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Lote sugerido (EOQ)</label>
                <Input
                  type="number"
                  value={formData.eoq}
                  onChange={(e) => setFormData({ ...formData, eoq: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Ubicación</label>
                <Input
                  type="text"
                  value={formData.ubicacion}
                  placeholder="Pasillo 3, Bahía B-04"
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Ubicación objetivo</label>
                <Input
                  type="text"
                  value={formData.ubicacion_objetivo}
                  placeholder="Bahía Picking"
                  onChange={(e) => setFormData({ ...formData, ubicacion_objetivo: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Origen</label>
                <Input
                  type="text"
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase font-medium">Política de inventario</label>
                <Input
                  type="text"
                  value={formData.politica_inventario}
                  onChange={(e) => setFormData({ ...formData, politica_inventario: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-muted-foreground uppercase font-medium">URL de imagen</label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.url_imagen}
                  onChange={(e) => setFormData({ ...formData, url_imagen: e.target.value })}
                  className="h-8 font-mono"
                />
              </div>

              <div className="sm:col-span-2 p-3 bg-muted/20 border border-border rounded-xs space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="es_perecedero_check"
                    checked={formData.es_perecedero}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_perecedero: Boolean(checked) })}
                  />
                  <label htmlFor="es_perecedero_check" className="font-mono text-xs font-semibold cursor-pointer select-none">
                    Producto perecedero (requiere control de vencimiento)
                  </label>
                </div>

                {formData.es_perecedero && (
                  <div className="pl-7 space-y-1">
                    <label className="text-muted-foreground uppercase text-xs">
                      Días de aviso previo a vencimiento:
                    </label>
                    <Input
                      type="number"
                      value={formData.dias_alerta_vencimiento}
                      onChange={(e) => setFormData({ ...formData, dias_alerta_vencimiento: e.target.value })}
                      className="h-8 w-40 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1 border-t border-border/60">
                  <Checkbox
                    id="activo_check"
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: Boolean(checked) })}
                  />
                  <label htmlFor="activo_check" className="font-mono text-xs font-semibold cursor-pointer select-none">
                    Producto activo en catálogo
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="rounded-xs font-mono text-xs uppercase"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingProduct}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xs font-mono text-xs uppercase px-4"
              >
                {isSavingProduct ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
