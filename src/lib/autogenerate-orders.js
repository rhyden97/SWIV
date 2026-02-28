const mapItem = (prod, orderId) => {
  const eoq = prod.eoq && prod.eoq > 0 ? prod.eoq : 1;
  const costoUnitario = prod.costo_unitario_base ? Number(prod.costo_unitario_base) : 0;
  const item = {
    producto_id: prod.id,
    cantidad: eoq,
    costo_unitario: costoUnitario,
    subtotal: eoq * costoUnitario,
  };
  if (orderId) item.orden_compra_id = orderId;
  return item;
};

export async function checkAndCreateDraftOrder(supabase, userId) {
  try {
    const { data: products, error: prodError } = await supabase
      .from("productos")
      .select(
        "id, nombre, stock_actual, punto_reorden, clasificacion_abc, proveedor_id, costo_unitario_base, eoq",
      )
      .eq("activo", true)
      .eq("clasificacion_abc", "A");

    if (prodError) {
      console.error("Error fetching products for auto-draft:", prodError);
      return;
    }

    const productsBelowRop = (products || []).filter(
      (p) => p.proveedor_id && p.stock_actual <= (p.punto_reorden || 0),
    );

    if (productsBelowRop.length === 0) return;

    const productsBySupplier = {};
    productsBelowRop.forEach((p) => {
      if (!productsBySupplier[p.proveedor_id]) {
        productsBySupplier[p.proveedor_id] = [];
      }
      productsBySupplier[p.proveedor_id].push(p);
    });

    for (const proveedorId of Object.keys(productsBySupplier)) {
      const itemsToOrder = productsBySupplier[proveedorId];

      const { data: existingOrders, error: ordersError } = await supabase
        .from("ordenes_compra")
        .select(
          `
          id,
          estado,
          items:orden_compra_items(producto_id)
        `,
        )
        .eq("proveedor_id", proveedorId)
        .in("estado", ["borrador", "emitida"]);

      if (ordersError) {
        console.error("Error checking existing orders for auto-draft:", ordersError);
        continue;
      }

      const productsNotYetOrdered = itemsToOrder.filter((prod) => {
        return !existingOrders?.some((order) =>
          order.items?.some((item) => item.producto_id === prod.id),
        );
      });

      if (productsNotYetOrdered.length === 0) continue;

      const existingDraftOrder = existingOrders?.find(
        (o) => o.estado === "borrador",
      );

      if (existingDraftOrder) {
        const itemsToInsert = productsNotYetOrdered.map((prod) =>
          mapItem(prod, existingDraftOrder.id),
        );
        const addedTotal = itemsToInsert.reduce((sum, item) => sum + item.subtotal, 0);

        const { error: itemInsertError } = await supabase
          .from("orden_compra_items")
          .insert(itemsToInsert);

        if (itemInsertError) {
          console.error("Error appending items to draft order:", itemInsertError);
          continue;
        }

        const { data: currentOrder } = await supabase
          .from("ordenes_compra")
          .select("total_orden")
          .eq("id", existingDraftOrder.id)
          .single();

        const currentTotal = currentOrder?.total_orden
          ? Number(currentOrder.total_orden)
          : 0;

        await supabase
          .from("ordenes_compra")
          .update({ total_orden: currentTotal + addedTotal })
          .eq("id", existingDraftOrder.id);
      } else {
        const { data: prov } = await supabase
          .from("proveedores")
          .select("costo_pedido")
          .eq("id", proveedorId)
          .single();

        const costoPedido = prov?.costo_pedido ? Number(prov.costo_pedido) : 0;
        const itemsToInsert = productsNotYetOrdered.map((prod) => mapItem(prod));
        const itemsTotal = itemsToInsert.reduce((sum, item) => sum + item.subtotal, 0);
        const total = itemsTotal + costoPedido;

        const { data: newOrder, error: createOrderError } = await supabase
          .from("ordenes_compra")
          .insert([
            {
              proveedor_id: proveedorId,
              usuario_id: userId,
              fecha_pedido: new Date().toISOString().split("T")[0],
              estado: "borrador",
              total_orden: total,
              notas: "Borrador autogenerado para productos Clase A por debajo de ROP.",
            },
          ])
          .select()
          .single();

        if (createOrderError) {
          console.error("Error creating new draft order:", createOrderError);
          continue;
        }

        if (newOrder) {
          const finalItems = itemsToInsert.map((item) => ({
            ...item,
            orden_compra_id: newOrder.id,
          }));

          const { error: itemsError } = await supabase
            .from("orden_compra_items")
            .insert(finalItems);

          if (itemsError) {
            console.error("Error inserting items for new draft order:", itemsError);
          }
        }
      }
    }
  } catch (err) {
    console.error("Critical error in checkAndCreateDraftOrder helper:", err);
  }
}
