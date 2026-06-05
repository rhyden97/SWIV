export const DEMO_CLIENTES = [
  {
    id: "CLI-001",
    nombre: "Distribuidora Andina SRL",
    email: "adquisiciones@andina-bo.com",
    telefono: "+591 2 278-3400",
    direccion: "Calle Murillo #890, Zona Central, La Paz",
  },
  {
    id: "CLI-002",
    nombre: "Taller Mecánico Central",
    email: "taller.central@gmail.com",
    telefono: "+591 3 352-8910",
    direccion: "Av. Cristo Redentor 3er Anillo, Santa Cruz",
  },
  {
    id: "CLI-003",
    nombre: "Transportes Illimani SA",
    email: "logistica@illimani-trans.com",
    telefono: "+591 2 284-5500",
    direccion: "Av. 6 de Marzo Km 5, El Alto",
  },
  {
    id: "CLI-004",
    nombre: "Ferretería El Cóndor",
    email: "ventas@elcondor-ferreteria.bo",
    telefono: "+591 4 425-1199",
    direccion: "Av. Heroínas #450, Cochabamba",
  },
  {
    id: "CLI-005",
    nombre: "Construcciones del Sur SRL",
    email: "compras@delsur-const.com",
    telefono: "+591 2 231-7788",
    direccion: "Av. Arce #2100, San Jorge, La Paz",
  },
];

export const DEMO_PROVEEDORES = [
  {
    id: "PRV-001",
    nombre: "Bosch Autopartes Bolivia SA",
    contacto: "Ing. Carlos Mendoza",
    email: "ventas@bosch-bolivia.com",
    telefono: "+591 2 245-8900",
    direccion: "Av. 6 de Agosto #2450, La Paz",
    tiempo_entrega: 3,
    calificacion_promedio: 4.8,
  },
  {
    id: "PRV-002",
    nombre: "Brembo Frenos Latinoamérica",
    contacto: "Mariana Rojas",
    email: "contacto@brembo-latam.com",
    telefono: "+591 3 334-1122",
    direccion: "Parque Industrial Manzana 12, Santa Cruz",
    tiempo_entrega: 5,
    calificacion_promedio: 4.9,
  },
  {
    id: "PRV-003",
    nombre: "Castrol Lubricantes de Bolivia",
    contacto: "Roberto Vaca",
    email: "distribucion@castrol.bo",
    telefono: "+591 4 458-7733",
    direccion: "Av. Blanco Galindo Km 4, Cochabamba",
    tiempo_entrega: 2,
    calificacion_promedio: 4.7,
  },
  {
    id: "PRV-004",
    nombre: "Mann+Hummel Filtros Industriales",
    contacto: "Patricia Guzmán",
    email: "pedidos@mann-hummel.bo",
    telefono: "+591 2 281-9900",
    direccion: "Av. Juan Pablo II #180, El Alto",
    tiempo_entrega: 4,
    calificacion_promedio: 4.6,
  },
];

export const DEMO_USUARIOS = [
  {
    id: "USR-001",
    nombre: "Rodrigo",
    apellido: "Hyden",
    email: "rhyden@swiv-erp.com",
    rol: "administrador",
    estado: "activo",
  },
  {
    id: "USR-002",
    nombre: "Carlos",
    apellido: "Mamani",
    email: "cmamani@swiv-erp.com",
    rol: "almacen",
    estado: "activo",
  },
  {
    id: "USR-003",
    nombre: "Valeria",
    apellido: "Mendoza",
    email: "vmendoza@swiv-erp.com",
    rol: "ventas",
    estado: "activo",
  },
  {
    id: "USR-004",
    nombre: "Fernando",
    apellido: "Quispe",
    email: "fquispe@swiv-erp.com",
    rol: "visitante",
    estado: "inactivo",
  },
];

export const DEMO_PEDIDOS = [
  {
    id: "PED-10492",
    title: "Distribuidora Andina SRL",
    description: "Despacho prioritario 4 bultos repuestos pesados",
    status: "pendiente",
    priority: "high",
    assignee: "Almacén Central",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    total: 14850,
    items: [
      { cantidad: 4, producto: { nombre: "Batería Bosch S4 75Ah" } },
      { cantidad: 8, producto: { nombre: "Pastillas de Freno Brembo" } },
    ],
  },
  {
    id: "PED-10491",
    title: "Taller Mecánico Central",
    description: "Mantenimiento flota de transporte liviano",
    status: "en_proceso",
    priority: "medium",
    assignee: "Bahía B-04",
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    total: 3420,
    items: [
      { cantidad: 6, producto: { nombre: "Aceite Castrol Edge 5W-30 (4L)" } },
      { cantidad: 6, producto: { nombre: "Filtro Mann-Filter W712" } },
    ],
  },
  {
    id: "PED-10490",
    title: "Transportes Illimani SA",
    description: "Orden amortiguadores reforzados",
    status: "listo_despacho",
    priority: "high",
    assignee: "Muelle 1",
    dueDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    total: 8900,
    items: [
      { cantidad: 4, producto: { nombre: "Amortiguador Monroe Gas-Magnum" } },
    ],
  },
  {
    id: "PED-10489",
    title: "Ferretería El Cóndor",
    description: "Entrega completada y firmada en guía",
    status: "completada",
    priority: "low",
    assignee: "Despachado",
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    total: 5120,
    items: [
      { cantidad: 12, producto: { nombre: "Bujía NGK Iridium" } },
      { cantidad: 4, producto: { nombre: "Líquido de Frenos DOT 4" } },
    ],
  },
];

export const DEMO_PRODUCTS = [
  {
    id: "demo-p1",
    sku: "BAT-75AH-01",
    nombre: "Batería Automotriz 12V 75Ah",
    clasificacion_abc: "A",
    stock_actual: 3,
    punto_reorden: 10,
    precio_venta: 750,
    costo_unitario_base: 520,
    proveedor_nombre: "Baterías del Plata S.A.",
  },
  {
    id: "demo-p2",
    sku: "BRK-CER-04",
    nombre: "Pastillas de Freno Cerámicas Delanteras",
    clasificacion_abc: "A",
    stock_actual: 5,
    punto_reorden: 15,
    precio_venta: 280,
    costo_unitario_base: 190,
    proveedor_nombre: "Frenos & Embragues Andina",
  },
  {
    id: "demo-p3",
    sku: "OIL-5W30-4L",
    nombre: "Aceite de Motor Sintético 5W-30 (Galón)",
    clasificacion_abc: "B",
    stock_actual: 42,
    punto_reorden: 20,
    precio_venta: 210,
    costo_unitario_base: 145,
    proveedor_nombre: "Lubricantes Industriales S.R.L.",
  },
  {
    id: "demo-p4",
    sku: "FLT-AIR-82",
    nombre: "Filtro de Aire de Alto Flujo AF-82",
    clasificacion_abc: "B",
    stock_actual: 18,
    punto_reorden: 12,
    precio_venta: 95,
    costo_unitario_base: 60,
    proveedor_nombre: "Repuestos Genuinos S.A.",
  },
  {
    id: "demo-p5",
    sku: "FUS-MIN-15A",
    nombre: "Fusibles Mini Cuchilla 15A (Pack x10)",
    clasificacion_abc: "C",
    stock_actual: 180,
    punto_reorden: 50,
    precio_venta: 25,
    costo_unitario_base: 12,
    proveedor_nombre: "Componentes Eléctricos del Sur",
  },
];

export const DEMO_VENTAS = [
  {
    id: "VTA-9841",
    cliente_nombre: "Distribuidora Andina SRL",
    fecha_venta: new Date(Date.now() - 3600000 * 2).toISOString(),
    total_venta: 14850.0,
    metodo_pago: "transferencia",
    estado: "Completada",
  },
  {
    id: "VTA-9840",
    cliente_nombre: "Taller Mecánico Central",
    fecha_venta: new Date(Date.now() - 3600000 * 5).toISOString(),
    total_venta: 3420.5,
    metodo_pago: "qr",
    estado: "Completada",
  },
  {
    id: "VTA-9839",
    cliente_nombre: "Transportes Illimani SA",
    fecha_venta: new Date(Date.now() - 3600000 * 18).toISOString(),
    total_venta: 8900.0,
    metodo_pago: "efectivo",
    estado: "Completada",
  },
  {
    id: "VTA-9838",
    cliente_nombre: "Ferretería El Cóndor",
    fecha_venta: new Date(Date.now() - 3600000 * 26).toISOString(),
    total_venta: 5120.0,
    metodo_pago: "tarjeta",
    estado: "Completada",
  },
  {
    id: "VTA-9837",
    cliente_nombre: "Construcciones del Sur",
    fecha_venta: new Date(Date.now() - 3600000 * 48).toISOString(),
    total_venta: 12400.0,
    metodo_pago: "por pagar",
    estado: "Por Pagar",
  },
];

export const DEMO_ORDENES = [
  {
    id: "OC-2024-089",
    proveedor_nombre: "Bosch Autopartes Bolivia",
    fecha_pedido: new Date(Date.now() - 86400000 * 3).toISOString(),
    total_orden: 28450.0,
    estado: "aprobada",
    notas: "Reposición lote baterías S4 y S5",
  },
  {
    id: "OC-2024-088",
    proveedor_nombre: "Brembo Frenos Latinoamérica",
    fecha_pedido: new Date(Date.now() - 86400000 * 6).toISOString(),
    total_orden: 14200.0,
    estado: "emitida",
    notas: "Pastillas cerámicas y discos ventilados",
  },
  {
    id: "OC-2024-087",
    proveedor_nombre: "Castrol Lubricantes SA",
    fecha_pedido: new Date(Date.now() - 86400000 * 12).toISOString(),
    total_orden: 36800.0,
    estado: "completada",
    notas: "Tambores sintético 5W-30 y 10W-40",
  },
  {
    id: "OC-2024-086",
    proveedor_nombre: "Mann+Hummel Filtros",
    fecha_pedido: new Date(Date.now() - 86400000 * 18).toISOString(),
    total_orden: 9800.0,
    estado: "completada",
    notas: "Filtros de aire, aceite y combustible",
  },
];

export const DEMO_TAREAS = [
  {
    id: "demo-t1",
    stock_logico_snapshot: 15,
    productos: {
      nombre: "Filtro de Aceite Premium PH-4967",
      sku: "FLT-OIL-4967",
      ubicacion: "Pasillo B - Estante 03",
    },
    estado: "Pendiente",
  },
  {
    id: "demo-t2",
    stock_logico_snapshot: 8,
    productos: {
      nombre: "Bomba de Agua Hidráulica 1.6L",
      sku: "PMP-WTR-16L",
      ubicacion: "Pasillo D - Estante 01",
    },
    estado: "Pendiente",
  },
  {
    id: "demo-t3",
    stock_logico_snapshot: 32,
    productos: {
      nombre: "Bujías de Iridio IX (Pack x4)",
      sku: "SPK-IRD-IX4",
      ubicacion: "Pasillo A - Estante 12",
    },
    estado: "Pendiente",
  },
];

export const DEMO_AREAS = [
  {
    id: "demo-a1",
    area_id: "demo-area-1",
    areas_almacen: {
      id: "demo-area-1",
      nombre: "Nave Central - Pasillo de Despacho",
      descripcion: "Zona de embalaje y preparación de pedidos salientes",
      criterios_checklist: [
        "Despejar pasillos de obstáculos y pallets vacíos",
        "Limpieza y barrido de la zona de embalaje",
        "Ordenar herramientas e insumos en la estación",
      ],
    },
    estado: "asignado",
  },
  {
    id: "demo-a2",
    area_id: "demo-area-2",
    areas_almacen: {
      id: "demo-area-2",
      nombre: "Muelle de Recepción 02",
      descripcion: "Control de tarimas y validación física contra albarán",
      criterios_checklist: [
        "Revisar demarcación de líneas de seguridad y tránsito",
        "Inspeccionar estado de tarimas vacías y apilado seguro",
        "Comprobar que extintores y salidas estén despejados",
      ],
    },
    estado: "asignado",
  },
];

export const DEMO_ALERTAS_A = [
  {
    id: "demo-a1",
    producto_id: "demo-p1",
    nombre_producto: "Batería Automotriz 12V 75Ah",
    nivel_alerta: "critico",
    mensaje: "Stock actual (3 u) por debajo del punto de reorden (10 u).",
    stock_al_corte: 3,
    productos: { punto_reorden: 10 },
    clasificacion_abc: "A",
    sku: "BAT-75AH-01",
  },
  {
    id: "demo-a2",
    producto_id: "demo-p2",
    nombre_producto: "Pastillas de Freno Cerámicas Delanteras",
    nivel_alerta: "critico",
    mensaje: "Stock actual (5 u) por debajo del punto de reorden (15 u).",
    stock_al_corte: 5,
    productos: { punto_reorden: 15 },
    clasificacion_abc: "A",
    sku: "BRK-CER-04",
  },
];

export const DEMO_KPIS = {
  monthSales: 128450,
  inventoryValue: 482100,
  orderCount: 142,
  lowStockAlerts: 4,
  stockoutCount: 0,
  growth: {
    sales: 14.2,
    orders: 8.5,
    inventory: 0,
    alerts: 0,
    stockout: 0,
  },
};

export {
  buildDemoSalesSeries,
  buildDemoDailySales,
  buildDemoForecast,
} from "./demoSeries";
