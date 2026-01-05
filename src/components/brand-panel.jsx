export default function BrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between bg-zinc-950 text-zinc-100 border-r border-zinc-800 p-8 lg:p-12 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
          SWGVI • Plataforma
        </span>
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Producción
        </span>
      </div>

      <div className="space-y-8 my-auto max-w-md">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xs bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-sm tracking-wider border border-primary/20 shadow-none">
            SW
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono tracking-tight text-zinc-50 uppercase">
              SWGVI ERP
            </h2>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Sistema de Gestión de Ventas e Inventario
            </p>
          </div>
        </div>



        <div className="p-4 rounded-xs border border-zinc-800/80 bg-zinc-900/40 text-xs font-mono text-zinc-400 leading-relaxed">
          Acceso restringido para operadores autorizados. Las transacciones y modificaciones de stock son auditadas en tiempo real.
        </div>
      </div>

      <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between text-xs font-mono text-zinc-500">
        <span>SWGVI v2.0</span>
        <span>Acceso controlado</span>
      </div>
    </div>
  );
}
