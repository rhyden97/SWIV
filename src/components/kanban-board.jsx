"use client";

import * as React from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontalIcon, CalendarIcon, FlagIcon, Eye, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRol } from "@/hooks/useRol";

const columns = [
  {
    id: "pendiente",
    title: "Pendiente",
    indicator: "bg-amber-500",
  },
  {
    id: "en_proceso",
    title: "En Proceso",
    indicator: "bg-blue-500",
  },
  {
    id: "listo_despacho",
    title: "Listo Despacho",
    indicator: "bg-purple-500",
  },
  {
    id: "completada",
    title: "Completada",
    indicator: "bg-emerald-500",
  },
];

function TaskCard({ task, isDragging, onView, onMove, esVisitante }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: esVisitante });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!esVisitante ? attributes : {})}
      {...(!esVisitante ? listeners : {})}
      className={cn(
        !esVisitante && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50",
        isSortableDragging && "z-50"
      )}
    >
      <Card
        className={cn(
          "mb-2.5 transition-colors border border-border bg-card rounded-xs overflow-hidden hover:border-foreground/40",
          isDragging && "opacity-50 ring-1 ring-primary"
        )}
      >
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-xs uppercase font-mono font-medium tracking-wider text-muted-foreground">
                {task.id.slice(0, 10)}
              </span>
              <h4 className="font-medium text-xs text-foreground leading-snug">
                {task.title}
              </h4>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-muted rounded-xs cursor-pointer">
                    <MoreHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xs">
                  <DropdownMenuItem onClick={() => onView && onView(task)} className="cursor-pointer text-xs font-mono">
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    Detalles
                  </DropdownMenuItem>
                  {task.receiptUrl && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(task.receiptUrl, "_blank");
                      }}
                      className="cursor-pointer text-xs font-mono"
                    >
                      <FileText className="mr-2 h-3.5 w-3.5" />
                      Ver Recibo
                    </DropdownMenuItem>
                  )}
                  {!esVisitante && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onMove && onMove(task)} className="cursor-pointer text-xs font-mono">
                        <FlagIcon className="mr-2 h-3.5 w-3.5" />
                        Mover
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {task.items && task.items.length > 0 ? (
            <div className="space-y-1 bg-muted/40 p-2 rounded-xs border border-border">
              <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                Items:
              </p>
              <div className="space-y-0.5">
                {task.items.slice(0, 3).map((item, i) => (
                  <p key={i} className="text-xs text-foreground font-mono truncate">
                    • {item.cantidad}x {item.producto?.nombre || "Producto"}
                  </p>
                ))}
                {task.items.length > 3 && (
                  <p className="text-xs text-muted-foreground font-mono italic pl-2">
                    + {task.items.length - 3} más...
                  </p>
                )}
              </div>
            </div>
          ) : (
            task.description && (
              <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                {task.description}
              </p>
            )
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            {task.dueDate ? (
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-mono px-1.5 py-0.5 rounded-xs border",
                isOverdue
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString("es-BO", {
                    day: "2-digit",
                    month: "short"
                  })}
                </span>
              </div>
            ) : (
              <div className="w-1" />
            )}

            <div className="text-xs font-mono tabular-nums font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded-xs border border-border">
              Bs {Number(task.total || 0).toLocaleString("es-BO")}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({ column, tasks, onViewTask, onMoveTask, esVisitante }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    disabled: esVisitante,
    data: {
      type: "column",
      column,
    },
  });

  return (
    <div className="w-full border-r border-border last:border-r-0 pr-3 last:pr-0">
      <div className="mb-3 pb-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", column.indicator)} />
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {column.title}
            </h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono rounded-xs px-1.5 py-0.5">
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div ref={setNodeRef} className="min-h-96 space-y-2">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={onViewTask}
              onMove={onMoveTask}
              esVisitante={esVisitante}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ pedidos = [], onUpdateStatus }) {
  const { rol } = useRol();
  const esVisitante = rol === "visitante";
  const [tasks, setTasks] = React.useState(pedidos);

  React.useEffect(() => {
    setTasks(pedidos);
  }, [pedidos]);

  const [activeId, setActiveId] = React.useState(null);
  const [isViewTaskOpen, setIsViewTaskOpen] = React.useState(false);
  const [isMoveTaskOpen, setIsMoveTaskOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    if (esVisitante) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    if (esVisitante) return;
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    let newStatus = activeTask.status;

    const overColumn = columns.find((col) => col.id === overId);
    if (overColumn) {
      newStatus = overColumn.id;
    } else {
      const overTask = tasks.find((task) => task.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus !== activeTask.status) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeId ? { ...task, status: newStatus } : task
        )
      );

      if (onUpdateStatus) {
        onUpdateStatus(activeId, newStatus);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getTasksByStatus = (status) => {
    const filtered = tasks.filter((task) => task.status === status);

    if (status === "completada") {
      return filtered
        .sort(
          (a, b) =>
            new Date(a.fecha_inicio || 0) - new Date(b.fecha_inicio || 0)
        )
        .slice(-3);
    }

    return filtered;
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setIsViewTaskOpen(true);
  };

  const handleMoveTask = (task) => {
    setSelectedTask(task);
    setIsMoveTaskOpen(true);
  };

  const handleConfirmMove = (newStatus) => {
    if (selectedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id ? { ...task, status: newStatus } : task
        )
      );
      setIsMoveTaskOpen(false);
      setSelectedTask(null);
      if (onUpdateStatus) {
        onUpdateStatus(selectedTask.id, newStatus);
      }
    }
  };

  const activeTask = activeId
    ? tasks.find((task) => task.id === activeId)
    : null;

  return (
    <div className="w-full px-2 py-6 sm:py-8">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              onViewTask={handleViewTask}
              onMoveTask={handleMoveTask}
              esVisitante={esVisitante}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isDragging
              onView={handleViewTask}
              onMove={handleMoveTask}
              esVisitante={esVisitante}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isViewTaskOpen} onOpenChange={setIsViewTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido</DialogTitle>
            <DialogDescription>
              Información completa del pedido
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Producto</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTask.title}
                </p>
              </div>
              {selectedTask.receiptUrl && (
                <div>
                  <Label className="text-sm font-semibold">
                    Recibo de Venta
                  </Label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center gap-2"
                      onClick={() =>
                        window.open(selectedTask.receiptUrl, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4" />
                      Ver Recibo PDF
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-sm font-semibold">Detalles</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTask.description}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Estado</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {columns.find((col) => col.id === selectedTask.status)?.title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Proveedor</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTask.assignee}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">
                  Fecha de Entrega
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedTask.dueDate).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold">Categorías</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTask.labels.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white"
              onClick={() => setIsViewTaskOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveTaskOpen} onOpenChange={setIsMoveTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mover Pedido</DialogTitle>
            <DialogDescription>
              Selecciona la columna a la que deseas mover este pedido
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Pedido</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTask.title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Estado Actual</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {columns.find((col) => col.id === selectedTask.status)?.title}
                </p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Nueva Columna</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {columns.map((column) => (
                    <Button
                      key={column.id}
                      variant={
                        selectedTask.status === column.id
                          ? "secondary"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => handleConfirmMove(column.id)}
                      disabled={selectedTask.status === column.id}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mr-2",
                          column.indicator
                        )}
                      />
                      {column.title}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white"
              onClick={() => setIsMoveTaskOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
