# SWGVI - Sistema Web de Gestión de Ventas e Inventario

Plataforma web para la gestión comercial, administración de inventarios en almacén y punto de venta (POS). Desarrollada con arquitectura moderna basada en Next.js, React, Tailwind CSS y Supabase (PostgreSQL).

---

## Módulos Principales

- **Punto de Venta (POS):** Registro ágil de ventas en mostrador, catálogo interactivo con búsqueda en tiempo real, múltiples modalidades de pago y generación de comprobantes en PDF.
- **Gestión de Inventario:** Control de existencias, clasificación ABC de productos, cálculo de puntos de reorden (ROP y EOQ), y trazabilidad de lotes con fechas de vencimiento.
- **Compras y Proveedores:** Flujo de órdenes de compra, tablero visual Kanban para seguimiento de pedidos y recepción de mercadería en almacén.
- **Auditoría de Calidad (5S):** Listas de verificación e inspección periódica en áreas de almacenamiento con registro de evidencias.
- **Analítica y Reportes:** Indicadores clave de rendimiento (KPIs), proyecciones de demanda basadas en historial de ventas y exportación de reportes.

---

## Tecnologías

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Base de Datos & Autenticación:** Supabase (PostgreSQL con Row Level Security)
- **Formularios y Validación:** React Hook Form, Zod
- **Reportes y Visualización:** Recharts, jsPDF, PapaParse

---

## Control de Acceso (RBAC)

El sistema implementa políticas de seguridad a nivel de base de datos (RLS) y validación de roles en servidor:

- **Administrador:** Acceso total a módulos, configuración, analítica y gestión de usuarios.
- **Almacén:** Gestión de productos, movimientos de stock, recepción de compras y despachos.
- **Ventas:** Operación del Punto de Venta (POS), registro de clientes y consulta de catálogo.
- **Auditor / Visitante:** Acceso de consulta para supervisión de inventario, reportes y métricas.

---

## Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
