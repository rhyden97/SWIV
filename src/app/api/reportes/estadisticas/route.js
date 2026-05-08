import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { apiError } from "@/lib/api-response";

export async function GET(request) {
  try {
    const auth = await requireRole(["administrador", "visitante"]);
    if (auth.response) return auth.response;

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const fechaInicio = searchParams.get("fecha_inicio");
    const fechaFin = searchParams.get("fecha_fin");

    let estadisticas = {};

    switch (tipo) {
      case "ventas":
      case "ventas-detallado":
      case "ventas-resumen":
      case "ventas-productos":
        let ventasQuery = supabase
          .from("ventas")
          .select("total_venta, fecha_venta, cliente_id, clientes(nombre)");

        if (fechaInicio) {
          ventasQuery = ventasQuery.gte("fecha_venta", fechaInicio);
        }
        if (fechaFin) {
          ventasQuery = ventasQuery.lte("fecha_venta", `${fechaFin}T23:59:59.999Z`);
        }

        const { data: ventas, error: ventasError } = await ventasQuery;
        if (ventasError) throw ventasError;

        const totalVentas = ventas.reduce(
          (sum, v) => sum + parseFloat(v.total_venta || 0),
          0
        );
        const promedioVenta =
          ventas.length > 0 ? totalVentas / ventas.length : 0;

        const ventasPorCliente = {};
        ventas.forEach((v) => {
          const clienteId = v.cliente_id;
          if (!ventasPorCliente[clienteId]) {
            ventasPorCliente[clienteId] = {
              nombre: v.clientes ? v.clientes.nombre : `Cliente ${clienteId}`,
              total: 0,
            };
          }
          ventasPorCliente[clienteId].total += parseFloat(v.total_venta || 0);
        });

        estadisticas = {
          totalSales: parseFloat(totalVentas.toFixed(2)),
          totalOrders: ventas.length,
          averageOrderValue: parseFloat(promedioVenta.toFixed(2)),
          topCustomer: ventasPorCliente,
        };
        break;

      case "inventario":
      case "inventario-stock":
      case "inventario-valorizado":
        const { data: productos, error: productosError } = await supabase
          .from("productos")
          .select(
            "stock_actual, punto_reorden, precio_venta, costo_unitario_base"
          );

        if (productosError) throw productosError;

        const totalProductos = productos.length;
        const stockTotal = productos.reduce(
          (sum, p) => sum + (p.stock_actual || 0),
          0
        );
        const valorInventario = productos.reduce(
          (sum, p) =>
            sum + (p.stock_actual || 0) * (p.costo_unitario_base || 0),
          0
        );
        const productosStockBajo = productos.filter(
          (p) => p.stock_actual <= (p.punto_reorden || 0)
        ).length;

        estadisticas = {
          totalProductos,
          stockTotal,
          valorInventario: valorInventario.toFixed(2),
          productosStockBajo,
          porcentajeStockBajo:
            totalProductos > 0
              ? ((productosStockBajo / totalProductos) * 100).toFixed(1)
              : 0,
        };
        break;

      case "inventario-movimientos":
        let movimientosQuery = supabase
          .from("movimientos_inventario")
          .select("tipo_movimiento, cantidad");

        if (fechaInicio) {
          movimientosQuery = movimientosQuery.gte(
            "fecha_movimiento",
            fechaInicio
          );
        }
        if (fechaFin) {
          movimientosQuery = movimientosQuery.lte("fecha_movimiento", `${fechaFin}T23:59:59.999Z`);
        }

        const { data: movimientos, error: movimientosError } =
          await movimientosQuery;
        if (movimientosError) throw movimientosError;

        const entradas = movimientos.filter(
          (m) => m.tipo_movimiento === "entrada"
        );
        const salidas = movimientos.filter(
          (m) => m.tipo_movimiento === "salida"
        );

        estadisticas = {
          totalMovimientos: movimientos.length,
          totalEntradas: entradas.reduce(
            (sum, m) => sum + (m.cantidad || 0),
            0
          ),
          totalSalidas: salidas.reduce((sum, m) => sum + (m.cantidad || 0), 0),
          numeroEntradas: entradas.length,
          numeroSalidas: salidas.length,
        };
        break;

      default:
        estadisticas = {};
    }

    return NextResponse.json(estadisticas);
  } catch (error) {
    return apiError(error, "Error calculating statistics:");
  }
}
