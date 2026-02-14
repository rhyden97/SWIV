"use client";

import { useState, useEffect } from "react";
import { Disciplina2SModal } from "@/components/discipline-5s-dialog";
import { ConteoModal } from "@/components/inventory-count-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useRol } from "@/hooks/useRol";
import { LAYOUT_CLASSES } from "@/lib/constants";
import { LotesPanel } from "@/components/lots-panel";
import { Loader } from "@/components/ui/loader";
import { DEMO_TAREAS, DEMO_AREAS } from "@/lib/demoData";

export default function AlmacenPage() {
  const { rol } = useRol();
  const esVisitante = rol === "visitante";

  const [tareas, setTareas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [areaSeleccionada, setAreaSeleccionada] = useState(null);
  const [registroLimpiezaSeleccionadoId, setRegistroLimpiezaSeleccionadoId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/almacen");
      if (!res.ok) throw new Error("Error al consultar datos de almacén");
      const data = await res.json();

      setTareas(data.tareas && data.tareas.length > 0 ? data.tareas : DEMO_TAREAS);
      setAreas(data.areas && data.areas.length > 0 ? data.areas : DEMO_AREAS);
      setLotes(data.lotes || []);
    } catch (err) {
      console.error("Error cargando almacén:", err);
      setTareas(DEMO_TAREAS);
      setAreas(DEMO_AREAS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Control de Almacén"
        subtitle="Monitoreo de tareas de inventario físico, lotes y áreas de almacenamiento."
      />

      {loading ? (
        <Loader columns={4} rows={4} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-border rounded-xs bg-card flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                      Conteo Cíclico
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                      Auditoría de Inventario Físico
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {tareas.length} PENDIENTES
                  </span>
                </div>

                <div className="p-5 space-y-2 max-h-110 overflow-y-auto">
                  {tareas.map((tarea) => (
                    <div
                      key={tarea.id}
                      onClick={() => !esVisitante && setTareaSeleccionada(tarea)}
                      className="p-3.5 rounded-xs border border-border bg-muted/20 flex items-center justify-between gap-4 transition-colors hover:bg-muted/40 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {tarea.productos?.nombre}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1">
                          <span>LOC: {tarea.productos?.ubicacion || "N/A"}</span>
                          <span>·</span>
                          <span>SKU: {tarea.productos?.sku || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                          PENDIENTE
                        </span>
                        <Button
                          size="sm"
                          disabled={esVisitante}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!esVisitante) setTareaSeleccionada(tarea);
                          }}
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-mono rounded-xs border-border"
                        >
                          Contar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-border rounded-xs bg-card flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-0.5">
                      Estandarización 5S
                    </div>
                    <h2 className="text-base font-semibold text-foreground">
                      Inspección de Pasillos y Estaciones
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {areas.length} ZONAS
                  </span>
                </div>

                <div className="p-5 space-y-2 max-h-110 overflow-y-auto">
                  {areas.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (!esVisitante) {
                          setAreaSeleccionada(task.area_id);
                          setRegistroLimpiezaSeleccionadoId(task.id);
                        }
                      }}
                      className="p-3.5 rounded-xs border border-border bg-muted/20 flex items-center justify-between gap-4 transition-colors hover:bg-muted/40 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {task.areas_almacen?.nombre}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.areas_almacen?.descripcion}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={esVisitante}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!esVisitante) {
                              setAreaSeleccionada(task.area_id);
                              setRegistroLimpiezaSeleccionadoId(task.id);
                            }
                          }}
                          variant="outline"
                          className="h-7 text-xs px-2.5 font-mono rounded-xs border-border"
                        >
                          Auditar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <LotesPanel lotes={lotes} />
          </div>
        </>
      )}

      {tareaSeleccionada && (
        <ConteoModal
          tareaId={tareaSeleccionada}
          onClose={() => {
            setTareaSeleccionada(null);
            loadData();
          }}
        />
      )}

      {areaSeleccionada && (
        <Disciplina2SModal
          areaId={areaSeleccionada}
          registroLimpiezaId={registroLimpiezaSeleccionadoId}
          initialArea={
            areas.find(
              (a) =>
                a.id === registroLimpiezaSeleccionadoId ||
                a.area_id === areaSeleccionada
            )?.areas_almacen
          }
          onClose={() => {
            setAreaSeleccionada(null);
            setRegistroLimpiezaSeleccionadoId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
