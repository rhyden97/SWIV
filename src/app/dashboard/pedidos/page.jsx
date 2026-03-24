"use client";

import { KanbanBoard } from "@/components/kanban-board";
import { Loader } from "@/components/ui/loader";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { toast } from "sonner";
import { DEMO_PEDIDOS } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";

export default function PedidosPage() {
  const {
    data: pedidos,
    setData: setPedidos,
    loading,
    reload,
  } = useDemoCollection("/api/pedidos", DEMO_PEDIDOS, {
    errorLabel: "Error loading pedidos:",
  });

  const fetchPedidos = () => reload({ showLoading: false });

  const handleUpdatePedido = async (pedidoId, newStatus) => {
    try {
      const response = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedidoId, estado: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar pedido");
      }

      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: newStatus } : p)),
      );

      toast.success("Pedido actualizado");
    } catch (error) {
      console.error("Error updating pedido:", error);
      toast.error("Error al actualizar el pedido");
    }
  };

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Pedidos"
        subtitle="Control de flujo operativo y preparación de pedidos."
      />
      {loading ? (
        <Loader columns={4} rows={6} />
      ) : (
        <KanbanBoard
          pedidos={pedidos}
          onUpdateStatus={handleUpdatePedido}
          onRefresh={fetchPedidos}
        />
      )}
    </div>
  );
}
