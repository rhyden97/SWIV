import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const TELEMETRY = [
  {
    title: "Despacho en Caja",
    value: "< 120 ms",
    description: "Búsqueda inmediata por SKU y lector",
  },
  {
    title: "Reposición de Stock",
    value: "EOQ + ROP",
    description: "Puntos de reorden calculados",
  },
  {
    title: "Control Existencias",
    value: "Pareto ABC",
    description: "Priorización por volumen e impacto",
  },
  {
    title: "Seguridad y Acceso",
    value: "Postgres RLS",
    description: "Permisos y roles por usuario",
  },
];

const MODULES = [
  {
    code: "TPV",
    title: "Punto de Venta & Facturación",
    description:
      "Diseñado para mostrador de alta demanda. Compatible con lectores de código de barra, múltiples formas de pago y emisión de comprobantes en PDF.",
    features: [
      "Atajos de teclado para registro rápido",
      "Emisión y almacenamiento de recibos en PDF",
      "Actualización instantánea de inventario",
    ],
  },
  {
    code: "STOCK",
    title: "Inventario, Lotes y Reposición",
    description:
      "Control físico y digital de existencias. Clasificación ABC, seguimiento de lotes con fecha de vencimiento y alertas de rotura de stock.",
    features: [
      "Cálculo automático de Punto de Reorden (ROP)",
      "Trazabilidad por lote para control de caducidad",
      "Conteos periódicos con registro de diferencias",
    ],
  },
  {
    code: "COMPRAS",
    title: "Abastecimiento y Órdenes de Compra",
    description:
      "Circuito formal de compras: solicitud, aprobación, recepción de almacén y registro. Seguimiento del estado de envíos de proveedores.",
    features: [
      "Flujo documental: Borrador → Aprobada → Recibida",
      "Recepción física de mercancía con ajuste automático",
      "Historial de entregas y desempeño por proveedor",
    ],
  },
  {
    code: "5S",
    title: "Inspecciones de Almacén y Calidad 5S",
    description:
      "Listas de verificación digitales para orden y estandarización en áreas de depósito. Registro fotográfico y seguimiento de conformidad.",
    features: [
      "Evaluaciones de Seiri, Seiton, Seiso, Seiketsu y Shitsuke",
      "Registro de evidencia fotográfica por ítem",
      "Seguimiento del índice de conformidad por área",
    ],
  },
];

const SPECS = [
  {
    name: "Base de Datos",
    protocol: "PostgreSQL + Supabase Auth",
    scope: "Row Level Security (RLS) en tablas transaccionales",
    status: "ACTIVO",
  },
  {
    name: "Cálculo de Demanda",
    protocol: "Series temporales + Modelo EOQ/ROP",
    scope: "Detección de puntos de reorden según rotación",
    status: "ACTIVO",
  },
  {
    name: "Control de Acceso (RBAC)",
    protocol: "Roles: Admin, Almacén, Ventas, Auditor",
    scope: "Aislamiento de rutas, vistas y permisos",
    status: "ACTIVO",
  },
  {
    name: "Documentos y Reportes",
    protocol: "jsPDF + PapaParse",
    scope: "Generación de comprobantes y exportación de datos",
    status: "ACTIVO",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="border-b border-border bg-muted/40 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wider text-foreground">
                SWGVI
              </span>
            </div>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span className="text-muted-foreground hidden sm:inline">
              Gestión de Ventas e Inventario
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
            >
              <span>Acceder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-muted border border-border text-xs font-mono text-muted-foreground mb-6">
                <span>GESTIÓN DE VENTAS E INVENTARIO</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-[1.1]">
                Gestión Integral de Ventas, Almacén e Inventario
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                Plataforma integral para control de ventas, inventario y almacén.
                Facturación en mostrador, clasificación de existencias, cálculo de
                reposición y seguimiento operativo.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="rounded-xs h-11 px-6 font-medium gap-2"
                  >
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border border-x border-border">
              {TELEMETRY.map((item, i) => (
                <div key={i} className="p-5">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    {item.title}
                  </div>
                  <div className="text-2xl font-semibold tracking-tight text-foreground font-mono">
                    {item.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-border">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Módulos del Sistema
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Estructura funcional para operaciones comerciales y logísticas.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 font-mono text-xs text-muted-foreground">
                ARQUITECTURA MODULAR
              </div>
            </div>

            <div className="grid md:grid-cols-2 border border-border divide-y md:divide-y-0 md:divide-x divide-border bg-card">
              {MODULES.map((mod, i) => (
                <div
                  key={i}
                  className={`p-6 sm:p-8 flex flex-col justify-between ${
                    i > 0 && i % 2 === 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 font-mono text-xs">
                      <span className="text-muted-foreground font-medium">
                        {mod.code}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {mod.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60">
                    <div className="text-xs font-mono text-muted-foreground mb-2">
                      CAPACIDADES:
                    </div>
                    <ul className="text-xs text-foreground space-y-1.5 font-mono">
                      {mod.features.map((feat, fi) => (
                        <li key={fi} className="flex items-center gap-2">
                          <span className="text-muted-foreground select-none">
                            —
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 border-b border-border bg-muted/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                Especificaciones del Entorno
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Detalle del entorno técnico y protocolos de seguridad del sistema.
              </p>
            </div>

            <div className="border border-border rounded-xs overflow-x-auto bg-card">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">COMPONENTE</th>
                    <th className="py-3 px-4 font-semibold">PROTOCOLO</th>
                    <th className="py-3 px-4 font-semibold hidden md:table-cell">
                      ALCANCE
                    </th>
                    <th className="py-3 px-4 font-semibold text-right">
                      ESTADO
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SPECS.map((spec, i) => (
                    <tr
                      key={i}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {spec.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {spec.protocol}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                        {spec.scope}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                          {spec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-14 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="border border-border p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-muted/20">
              <div className="max-w-2xl">
                <div className="font-mono text-xs text-muted-foreground mb-1">
                  ACCESO
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Ingreso al Sistema
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Inicie sesión con sus credenciales autorizadas para acceder a los
                  módulos de facturación, inventario o gestión logística.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="rounded-xs w-full sm:w-auto px-8 font-medium gap-2"
                  >
                    <span>Acceder a SWGVI</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-xs text-muted-foreground font-mono">
            <div>
              <div className="text-foreground font-semibold flex items-center gap-2 mb-1">
                <span>SWGVI</span>
                <span>—</span>
                <span className="font-normal text-muted-foreground">
                  Sistema Web de Gestión de Ventas e Inventario
                </span>
              </div>
              <p>
                Desarrollado bajo arquitectura Next.js, React y Supabase
                PostgreSQL.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link
                href="/login"
                className="hover:text-foreground transition-colors"
              >
                Ingreso al Sistema
              </Link>
              <span>·</span>
              <span className="text-muted-foreground/80">Licencia MIT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
