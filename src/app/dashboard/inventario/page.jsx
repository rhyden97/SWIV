"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchActionBar } from "@/components/search-action-bar";
import { DataTable, createNameColumn, createBadgeColumn, createSortableColumn } from "@/components/ui/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { PageHeader } from "@/components/page-header";
import { ProductDetailPage } from "@/components/product-detail-sheet";
import { PermisoGuard } from "@/components/permission-guard";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { formatCurrencyBOB } from "@/lib/format";
import { DEMO_PRODUCTS } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { toast } from "sonner";

export default function InventarioPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const {
    data: products,
    loading,
    reload: loadProducts,
    updateItem,
    deleteItem,
  } = useDemoCollection("/api/productos", DEMO_PRODUCTS, {
    errorLabel: "Error cargando productos:",
    idField: "sku",
  });

  const recalcularMetricas = async () => {
    if (
      !confirm(
        "Esta operación recalculará el ABC de todos los productos basándose en los últimos 90 días. ¿Continuar?",
      )
    )
      return;

    setRecalculating(true);
    try {
      const res = await fetch("/api/productos/recalcular", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al calcular");

      toast.success(data.message || "Cálculo completado correctamente.");
      await loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Error al calcular: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleEditProduct = (editedProduct) =>
    updateItem(editedProduct, {
      transform: ({
        proveedor_nombre,
        proveedor_tiempo_entrega,
        proveedor,
        ...productData
      }) => productData,
    });

  const handleDeleteProduct = (productToDelete) =>
    deleteItem(productToDelete, {
      idKey: "sku",
      paramName: productToDelete.sku ? "sku" : "id",
    });

  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onProductUpdated={(updated) => {
          setSelectedProduct(updated);
          handleEditProduct(updated);
        }}
      />
    );
  }

  const columns = [
    createNameColumn("nombre", "Producto", false),
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue("sku")}</span>
      ),
    },
    createSortableColumn("stock_actual", "Stock Actual"),
    createSortableColumn("punto_reorden", "Punto Reorden"),
    createSortableColumn("precio_venta", "Precio", formatCurrencyBOB),
    createBadgeColumn("clasificacion_abc", "Clase ABC", {
      A: "default",
      B: "secondary",
      C: "destructive",
    }),
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <TableRowActions
          item={row.original}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onView={() => setSelectedProduct(row.original)}
          editFields={fieldConfigs.producto}
          itemType="producto"
        />
      ),
    },
  ];

  const dataFilter = products.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.nombre || "").toLowerCase().includes(q) ||
      (item.sku || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Inventario de Productos"
        subtitle="Control de existencias, clasificación ABC y parámetros de reposición."
        actionButton={
          <PermisoGuard requiereRol={["administrador", "almacen"]}>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={recalcularMetricas}
                disabled={recalculating}
                className="rounded-xs font-mono text-xs border-border"
              >
                {recalculating ? "Calculando..." : "Recalcular ROP/ABC"}
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/inventario/nuevo")}
                className="rounded-xs font-mono text-xs bg-foreground text-background hover:bg-foreground/90"
              >
                Nuevo Producto
              </Button>
            </div>
          </PermisoGuard>
        }
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre o código SKU..."
      />

      <div className="bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={dataFilter}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (product) => [
              { label: "Producto", value: product.nombre },
              { label: "Stock Actual", value: product.stock_actual },
              {
                label: "Precio",
                value: formatCurrencyBOB(product.precio_venta),
              },
            ],
            getSecondaryFields: (product) => [
              { label: "SKU", value: product.sku },
              { label: "Punto Reorden", value: product.punto_reorden },
            ],
            getBadge: (product) => ({
              text: `Clase ${product.clasificacion_abc || "C"}`,
              variant:
                product.clasificacion_abc === "A"
                  ? "default"
                  : product.clasificacion_abc === "B"
                    ? "secondary"
                    : "destructive",
            }),
            getActions: (product) => (
              <TableRowActions
                item={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onView={() => setSelectedProduct(product)}
                editFields={fieldConfigs.producto}
                itemType="producto"
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
