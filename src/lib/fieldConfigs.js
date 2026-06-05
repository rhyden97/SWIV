export const fieldConfigs = {
  cliente: [
    {
      key: "nombre",
      label: "Nombre",
      type: "text",
      placeholder: "Nombre del cliente",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "email@ejemplo.com",
    },
    {
      key: "telefono",
      label: "Teléfono",
      type: "tel",
      placeholder: "+56 9 1234 5678",
    },
    {
      key: "direccion",
      label: "Dirección",
      type: "textarea",
      placeholder: "Dirección completa",
    },
  ],

  proveedor: [
    {
      key: "nombre",
      label: "Empresa",
      type: "text",
      placeholder: "Nombre de la empresa",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "contacto@empresa.com",
    },
    {
      key: "telefono",
      label: "Teléfono",
      type: "tel",
      placeholder: "+56 9 1234 5678",
    },
    {
      key: "direccion",
      label: "Dirección",
      type: "textarea",
      placeholder: "Dirección completa",
    },
    {
      key: "tiempo_entrega",
      label: "Tiempo de Entrega (días)",
      type: "number",
      placeholder: "Ej. 5",
    },
    {
      key: "costo_pedido",
      label: "Costo de Pedido (Bs.)",
      type: "number",
      placeholder: "Ej. 120.00",
    },
  ],

  usuario: [
    {
      key: "nombre",
      label: "Nombre",
      type: "text",
      placeholder: "Nombre",
    },
    {
      key: "apellido",
      label: "Apellido",
      type: "text",
      placeholder: "Apellido",
    },
    {
      key: "rol",
      label: "Rol",
      type: "select",
      options: [
        { value: "administrador", label: "Administrador" },
        { value: "almacen", label: "Almacén" },
        { value: "ventas", label: "Ventas" },
        { value: "visitante", label: "Visitante" },
      ],
    },
    {
      key: "estado",
      label: "Estado",
      type: "select",
      options: [
        { value: "Activo", label: "Activo" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    },
  ],

  producto: [
    { key: "nombre", label: "Nombre del Producto", type: "text" },
    { key: "descripcion", label: "Descripción", type: "text" },
    { key: "sku", label: "SKU", type: "text" },
    { key: "stock_actual", label: "Stock Actual", type: "number" },
    { key: "punto_reorden", label: "Punto de Reorden", type: "number" },
    { key: "precio_venta", label: "Precio de Venta", type: "number" },
    {
      key: "clasificacion_abc",
      label: "Clasificación ABC",
      type: "select",
      options: [
        { value: "A", label: "A" },
        { value: "B", label: "B" },
        { value: "C", label: "C" },
      ],
    },
  ],

  venta: [
    { key: "fecha_venta", label: "Fecha de Venta", type: "date" },
    { key: "total_venta", label: "Total", type: "number", placeholder: "0.00" },
    {
      key: "metodo_pago",
      label: "Método de Pago",
      type: "select",
      options: [
        { value: "Efectivo", label: "Efectivo" },
        { value: "Tarjeta", label: "Tarjeta" },
        { value: "Transferencia", label: "Transferencia" },
        { value: "QR", label: "QR" },
      ],
    },
  ],

  orden: [
    { key: "fecha_pedido", label: "Fecha de Pedido", type: "date" },
    {
      key: "fecha_entrega_estimada",
      label: "Fecha Entrega Estimada",
      type: "date",
    },
    {
      key: "total_orden",
      label: "Total Orden",
      type: "number",
      placeholder: "0.00",
    },
    {
      key: "estado",
      label: "Estado",
      type: "select",
      options: [
        { value: "borrador", label: "Borrador" },
        { value: "emitida", label: "Emitida" },
        { value: "completada", label: "Completada" },
        { value: "cancelada", label: "Cancelada" },
      ],
      disabled: (item) => item?.estado === "cancelada",
    },
    {
      key: "notas",
      label: "Notas",
      type: "textarea",
      placeholder: "Observaciones...",
    },
  ],
};
