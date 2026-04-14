"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Check,
  Clock,
  Pencil,
  Plus,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

export function ProgramarTareaDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  description,
  itemLabel,
  placeholder,
  items,
  selectedItemId,
  onSelectedItemChange,
  renderItem,
  usuariosList,
  selectedUsuarioId,
  onSelectedUsuarioChange,
  submitting,
  submitLabel = "Crear Tarea",
  submitClassName,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md border-border rounded-xs">
        <form onSubmit={onSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-bold text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                {itemLabel}
              </Label>
              <Select
                value={selectedItemId}
                onValueChange={onSelectedItemChange}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {renderItem(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Asignar a Operario:
              </Label>
              <Select
                value={selectedUsuarioId}
                onValueChange={onSelectedUsuarioChange}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Selecciona un operario..." />
                </SelectTrigger>
                <SelectContent>
                  {usuariosList.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre} {usuario.apellido} ({usuario.rol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs rounded-xs"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={`text-xs font-bold rounded-xs ${submitClassName}`}
            >
              {submitting ? "Creando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NuevaAreaDialog({
  open,
  onOpenChange,
  onSubmit,
  editingAreaId,
  nombre,
  onNombreChange,
  descripcion,
  onDescripcionChange,
  frecuencia,
  onFrecuenciaChange,
  criterioTemp,
  onCriterioTempChange,
  onAddCriterio,
  criterios,
  onRemoveCriterio,
  creating,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg border-border rounded-xs">
        <form onSubmit={onSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingAreaId
                ? "Editar Área de Almacén (5S)"
                : "Añadir Nueva Área de Almacén (5S)"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configura un área física de almacén asignando el checklist de
              criterios que deben ser limpiados y revisados.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Nombre del Área:
              </Label>
              <Input
                type="text"
                value={nombre}
                onChange={(e) => onNombreChange(e.target.value)}
                placeholder="Ej. Zona de Descarga 01"
                className="h-9 text-xs rounded-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Descripción / Ubicación Física:
              </Label>
              <Textarea
                value={descripcion}
                onChange={(e) => onDescripcionChange(e.target.value)}
                placeholder="Detalle o referencia para ubicar la zona dentro del almacén..."
                className="text-xs rounded-xs min-h-16"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Frecuencia Sugerida de Limpieza:
              </Label>
              <Select value={frecuencia} onValueChange={onFrecuenciaChange}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Selecciona la frecuencia..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario (Al finalizar turno)</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual (Auditoría profunda)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-bold text-foreground">
                Checklist de Criterios 5S:
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={criterioTemp}
                  onChange={(e) => onCriterioTempChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddCriterio();
                    }
                  }}
                  placeholder="Ej. Suelo libre de grasa, cajas apiladas..."
                  className="h-9 text-xs flex-1 rounded-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddCriterio}
                  className="h-9 text-xs shrink-0 rounded-xs"
                >
                  Añadir
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-muted/40 rounded-xs border border-border">
                {criterios.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    Sin criterios. Agrega al menos uno para el checklist.
                  </span>
                ) : (
                  criterios.map((c, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs gap-1 py-1 px-2 font-normal rounded-xs"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveCriterio(i)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs rounded-xs"
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={creating}
              className="text-xs font-bold rounded-xs bg-pink-700 hover:bg-pink-800 text-white"
            >
              {creating
                ? "Guardando..."
                : editingAreaId
                ? "Actualizar Área"
                : "Crear Área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfigurarAreasDialog({
  open,
  onOpenChange,
  esVisitante,
  onAddArea,
  areas,
  onEditArea,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl border-border rounded-xs max-h-144 flex flex-col p-0 overflow-hidden">
        <div className="flex max-h-144 min-h-0 flex-col">
          <DialogHeader className="p-6 pr-10 mb-0 border-b bg-muted/30 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground">
                Configuración de Áreas (5S)
              </DialogTitle>
              <DialogDescription className="text-xs text-pink-700 dark:text-pink-300">
                Visualiza y gestiona las áreas físicas de almacén bajo control
                del estándar 5S.
              </DialogDescription>
            </div>
            {!esVisitante && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddArea}
                className="border-pink-300 dark:border-pink-500/40 text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-500/10 text-xs flex items-center justify-center gap-1 font-semibold shadow-none w-full sm:w-auto shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir Área
              </Button>
            )}
          </DialogHeader>

          <div className="p-6 min-h-0 overflow-y-auto flex-1 space-y-4 bg-muted/30">
            {areas.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                No hay áreas configuradas en el almacén.
              </div>
            ) : (
              areas.map((area) => (
                <Card
                  key={area.id}
                  className="border border-border shadow-none rounded-xs bg-card"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {area.nombre}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {area.descripcion || "Sin descripción física específica"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-mono capitalize"
                      >
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {area.frecuencia_sugerida || "semanal"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-xs text-muted-foreground mb-1.5 font-semibold">
                      Checklist de Criterios ({(area.criterios_evaluacion || []).length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(area.criterios_evaluacion || []).map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-xs border border-border"
                        >
                          <Check className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                          {c}
                        </span>
                      ))}
                    </div>
                    {!esVisitante && (
                      <div className="mt-3 pt-3 border-t border-border flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditArea(area)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Editar Configuración
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-background shrink-0">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xs w-full sm:w-auto"
              >
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuditarRegistroDialog({
  open,
  onOpenChange,
  registro,
  formatFecha,
  getUsuarioNombre,
  getLimpiezaEstadoBadge,
  getLimpiezaEstadoLabel,
  esVisitante,
  onActualizarEstado,
  actualizando,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl border-border rounded-xs max-h-144 flex flex-col p-0 overflow-hidden">
        <DialogTitle className="sr-only">
          Auditar Evidencias de Limpieza
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario para verificar y aprobar las evidencias del registro de
          limpieza.
        </DialogDescription>
        {registro && (
          <div className="flex max-h-144 min-h-0 flex-col">
            <div className="p-6 pr-10 border-b bg-muted/30 flex items-center justify-between shrink-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-pink-100 dark:bg-pink-500/15 rounded-xs flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-foreground wrap-break-word">
                    Auditar Evidencias de Limpieza:{" "}
                    {registro.areas_almacen?.nombre}
                  </h3>
                  <p className="text-xs text-pink-700 dark:text-pink-300">
                    Reportado el {formatFecha(registro.fecha_registro)}
                    {registro.usuario_id &&
                      ` por ${getUsuarioNombre(registro.usuario_id)}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 min-h-0 overflow-y-auto flex-1 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Comentario General
                </h4>
                <p className="p-3 bg-muted/30 rounded-xs text-sm text-foreground border border-border">
                  {registro.observaciones || (
                    <span className="text-muted-foreground italic">
                      No se agregaron observaciones generales
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Criterios Evaluados (Checklist)
                </h4>

                <div className="space-y-3">
                  {(() => {
                    const checklist = registro.resultados_checklist || {};
                    const keys = Object.keys(checklist);

                    if (keys.length === 0) {
                      return (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No se desglosaron evidencias individuales para este
                          registro.
                        </div>
                      );
                    }

                    return keys.map((criterio, i) => {
                      const item = checklist[criterio];
                      return (
                        <div
                          key={i}
                          className="p-4 rounded-xs border border-border bg-card space-y-3 shadow-none"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" strokeWidth={3} />
                              </div>
                              <span className="font-semibold text-foreground text-sm wrap-break-word">
                                {criterio}
                              </span>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono py-0.5 px-2 rounded-xs shrink-0">
                              Verificado
                            </Badge>
                          </div>

                          {item.comentario && (
                            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xs border border-border">
                              <span className="font-medium text-foreground block mb-0.5">
                                Comentario del operario:
                              </span>
                              {item.comentario}
                            </p>
                          )}

                          {item.foto_url && (
                            <div className="space-y-1">
                              <span className="text-xs font-mono uppercase text-muted-foreground">
                                Foto cargada:
                              </span>
                              <div className="relative inline-block max-w-sm rounded-xs overflow-hidden border border-border shadow-none">
                                <img
                                  src={item.foto_url}
                                  alt={criterio}
                                  className="max-h-60 w-auto object-cover max-w-full hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-muted/30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="font-bold">Estado actual:</span>
                {getLimpiezaEstadoBadge(registro.estado)}
              </div>

              {!esVisitante ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Definir resultado:
                  </span>
                  <Select
                    value={registro.estado || "asignado"}
                    onValueChange={onActualizarEstado}
                    disabled={actualizando}
                  >
                    <SelectTrigger className="w-full sm:w-56 h-9 text-xs font-semibold shadow-none">
                      <span className="truncate">
                        {getLimpiezaEstadoLabel(registro.estado)}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprobado">
                        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />{" "}
                          Aprobar Limpieza
                        </span>
                      </SelectItem>
                      <SelectItem value="realizado">
                        <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />{" "}
                          Realizado (Revisión)
                        </span>
                      </SelectItem>
                      <SelectItem value="asignado">
                        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />{" "}
                          Asignar (Pendiente)
                        </span>
                      </SelectItem>
                      <SelectItem value="rechazado">
                        <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-500" />{" "}
                          Rechazar Limpieza
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                  Modo solo lectura (Visitante)
                </Badge>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
