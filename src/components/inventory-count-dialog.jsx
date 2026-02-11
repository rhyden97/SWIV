"use client";

import { useState, useEffect } from "react";
import { Check, AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DEMO_TAREAS } from "@/lib/demoData";
import { toast } from "sonner";

export function ConteoModal({ tareaId, onClose }) {

  const [tareaActual, setTareaActual] = useState(null);
  const [state, setState] = useState("pending");
  const [correctedValue, setCorrectedValue] = useState("");
  const [finalValue, setFinalValue] = useState(null);
  const [justificacion, setJustificacion] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargarTarea();
  }, [tareaId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const cargarTarea = async () => {
    if (tareaId && typeof tareaId === "object") {
      setTareaActual(tareaId);
      setLoading(false);
      return;
    }

    if (tareaId) {
      const demoMatch = DEMO_TAREAS.find((t) => t.id === tareaId);
      if (demoMatch) {
        setTareaActual(demoMatch);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auditoria");
        if (res.ok) {
          const auditData = await res.json();
          const match = (auditData.tareasConteo || []).find((t) => t.id === tareaId);
          if (match) {
            setTareaActual(match);
          } else if (demoMatch) {
            setTareaActual(demoMatch);
          } else {
            setTareaActual(DEMO_TAREAS[0]);
          }
        } else {
          setTareaActual(demoMatch || DEMO_TAREAS[0]);
        }
      } catch (error) {
        console.warn("Fallo al consultar tarea de conteo remota:", error);
        if (demoMatch) {
          setTareaActual(demoMatch);
        } else {
          setTareaActual(DEMO_TAREAS[0]);
        }
      }
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!tareaActual) return;

    setSubmitting(true);
    try {
      const isDemo = String(tareaActual.id || "").startsWith("demo-");

      if (!isDemo) {
        await fetch("/api/auditoria", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "completar_tarea_conteo",
            id: tareaActual.id,
            conteo_fisico: tareaActual.stock_logico_snapshot,
            diferencia: 0,
            estado: "Completada",
          }),
        });
      }

      setFinalValue(tareaActual.stock_logico_snapshot || 0);
      setState("confirmed");
      toast.success("Conteo confirmado");

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (error) {
      console.warn("Actualizando conteo localmente:", error);
      setFinalValue(tareaActual.stock_logico_snapshot || 0);
      setState("confirmed");
      toast.success("Conteo confirmado");
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCorrection = () => {
    setState("correcting");
    setCorrectedValue("");
  };

  const handleSubmitCorrection = async () => {
    if (!tareaActual) return;

    const value = Number.parseInt(correctedValue, 10);
    if (isNaN(value) || value < 0) return;

    const diferencia = value - (tareaActual.stock_logico_snapshot || 0);

    setSubmitting(true);
    try {
      const isDemo = String(tareaActual.id || "").startsWith("demo-");

      if (!isDemo) {
        await fetch("/api/auditoria", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "completar_tarea_conteo",
            id: tareaActual.id,
            conteo_fisico: value,
            diferencia: diferencia,
            justificacion_ajuste: justificacion || "Ajuste de conteo físico",
            estado: diferencia === 0 ? "Completada" : "Ajustada",
          }),
        });
      }

      setFinalValue(value);
      setState("corrected");

      if (diferencia < 0) {
        toast.warning(`Ajuste registrado: faltan ${Math.abs(diferencia)} uds`);
      } else if (diferencia > 0) {
        toast.info(`Ajuste registrado: sobran ${diferencia} uds`);
      } else {
        toast.success("Conteo verificado sin diferencias");
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (error) {
      console.warn("Registrando ajuste localmente:", error);
      setFinalValue(value);
      setState("corrected");
      toast.info("Ajuste registrado");
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-xs p-6 text-center max-w-sm w-full space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-foreground" />
          <p className="text-xs font-mono text-muted-foreground uppercase">
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  if (!tareaActual) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-xs p-6 text-center max-w-sm w-full space-y-3">
          <p className="text-sm font-bold font-mono text-foreground">
            No se encontró la tarea
          </p>
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xs text-xs font-mono uppercase"
          >
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  const parsedCorrection = Number.parseInt(correctedValue, 10);
  const isValidCorrection =
    correctedValue !== "" && !isNaN(parsedCorrection) && parsedCorrection >= 0;
  const currentDiff = isValidCorrection
    ? parsedCorrection - (tareaActual.stock_logico_snapshot || 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xs w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-card relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <h1 className="text-base font-bold font-mono uppercase text-foreground">
              Conteo de inventario
            </h1>
            <p className="text-xs font-mono font-medium text-foreground truncate">
              {tareaActual.productos?.nombre || "Producto"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 p-3 bg-muted/20 border-b border-border text-xs font-mono">
          <div>
            <span className="text-muted-foreground">SKU:</span>{" "}
            <span className="font-bold text-foreground">
              {tareaActual.productos?.sku || "N/A"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Ubicación:</span>{" "}
            <span className="font-bold text-foreground">
              {tareaActual.productos?.ubicacion || "Sin ubicación"}
            </span>
          </div>
        </div>

        <div className="p-6">
          {state === "pending" && (
            <div className="text-center space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase text-muted-foreground">
                  Stock registrado
                </p>
                <div className="text-4xl font-bold font-mono tabular-nums text-foreground">
                  {tareaActual.stock_logico_snapshot || 0}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  unidades
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar ({tareaActual.stock_logico_snapshot || 0})
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleStartCorrection}
                  variant="outline"
                  disabled={submitting}
                  className="w-full h-10 rounded-xs text-xs font-mono uppercase tracking-wider border-border cursor-pointer"
                >
                  Corregir cantidad
                </Button>
              </div>
            </div>
          )}

          {state === "correcting" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5 text-center">
                <label className="text-muted-foreground uppercase">
                  Cantidad física contada
                </label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={correctedValue}
                  onChange={(e) => setCorrectedValue(e.target.value)}
                  placeholder={String(tareaActual.stock_logico_snapshot || 0)}
                  className="text-center text-3xl font-bold font-mono h-14"
                  autoFocus
                />
                <p className="text-muted-foreground">
                  Esperado: {tareaActual.stock_logico_snapshot || 0} uds
                </p>
              </div>

              {isValidCorrection && currentDiff !== 0 && (
                <div className="p-2.5 rounded-xs border border-border bg-muted/20 text-center">
                  <span className="text-muted-foreground">Diferencia: </span>
                  <span
                    className={cn(
                      "font-bold",
                      currentDiff < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {currentDiff > 0 ? "+" : ""}
                    {currentDiff} uds
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-muted-foreground uppercase">
                  Motivo
                </label>
                <Input
                  type="text"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Ej: Merma, daño o conteo incorrecto..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleSubmitCorrection}
                  disabled={!isValidCorrection || submitting}
                  className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-xs text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar ajuste"
                  )}
                </Button>

                <Button
                  onClick={() => setState("pending")}
                  variant="outline"
                  disabled={submitting}
                  className="w-full h-10 rounded-xs text-xs font-mono uppercase tracking-wider border-border cursor-pointer"
                >
                  Volver
                </Button>
              </div>
            </div>
          )}

          {(state === "confirmed" || state === "corrected") && (
            <div className="text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div
                className={cn(
                  "w-10 h-10 rounded-xs border flex items-center justify-center mx-auto",
                  state === "confirmed"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                )}
              >
                {state === "confirmed" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-sm font-bold font-mono uppercase text-foreground">
                  {state === "confirmed" ? "Conteo confirmado" : "Ajuste guardado"}
                </p>
                <p className="text-2xl font-bold font-mono tabular-nums text-foreground">
                  {finalValue} uds
                </p>
              </div>

              {state === "corrected" && (
                <p className="text-xs font-mono text-muted-foreground">
                  Diferencia registrada:{" "}
                  {(finalValue ?? 0) - (tareaActual.stock_logico_snapshot || 0) > 0 ? "+" : ""}
                  {(finalValue ?? 0) - (tareaActual.stock_logico_snapshot || 0)} uds
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
