"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const calcDiasRestantes = (fechaStr) => {
  if (!fechaStr) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaStr.split("-");
  const vencimiento = new Date(year, month - 1, day);
  vencimiento.setHours(0, 0, 0, 0);
  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return "N/A";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
};

export function LotesPanel({ lotes = [] }) {
  const lotesFiltrados = (lotes || [])
    .filter((l) => (l.stock_lote || 0) > 0)
    .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));

  return (
    <div className="border border-border rounded-xs bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
            Lotes Críticos
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Control de Lotes y Vencimientos
          </h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          FEFO
        </span>
      </div>

      <div className="p-0 overflow-x-auto m-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40">
              <TableHead className="font-mono text-xs text-muted-foreground py-3">PRODUCTO</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground py-3">LOTE</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground py-3 text-right">EXISTENCIAS</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground py-3">VENCIMIENTO</TableHead>
              <TableHead className="font-mono text-xs text-muted-foreground py-3 text-right">ESTADO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {lotesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-xs font-mono text-muted-foreground">
                  No hay lotes con vencimiento próximo
                </TableCell>
              </TableRow>
            ) : (
              lotesFiltrados.map((lote) => {
                const diasRestantes = calcDiasRestantes(lote.fecha_vencimiento);
                let statusText = "Conforme";
                let statusClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

                if (diasRestantes !== null) {
                  if (diasRestantes <= 0) {
                    statusText = "Vencido";
                    statusClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
                  } else if (diasRestantes <= 15) {
                    statusText = "Crítico";
                    statusClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
                  } else if (diasRestantes <= 30) {
                    statusText = "Por Vencer";
                    statusClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
                  }
                }

                return (
                  <TableRow key={lote.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium text-foreground py-3 text-xs">
                      {lote.productos?.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs py-3">
                      {lote.codigo_lote}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground py-3 text-xs">
                      {lote.stock_lote} u
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono py-3">
                      {formatFecha(lote.fecha_vencimiento)}
                      {diasRestantes !== null && (
                        <span className="ml-2 opacity-75">
                          ({diasRestantes > 0 ? `${diasRestantes}d` : "expirado"})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-xs text-xs font-mono font-medium ${statusClass}`}>
                        {statusText}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default LotesPanel;
