"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Edit, Trash2, Eye, PackageCheck, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRol } from "@/hooks/useRol";

export function TableRowActions({
  item,
  onEdit,
  onDelete,
  onView,
  onRecepcion,
  editFields = [],
  itemType = "elemento",
  showRecepcion = false,
}) {
  const router = useRouter();
  const { rol } = useRol();
  const esVisitante = rol === "visitante";
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedItem, setEditedItem] = useState({});

  const handleEditClick = () => {
    if (esVisitante) return;
    setEditedItem({ ...item });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (onEdit) {
      const success = await onEdit(editedItem);
      if (success !== false) {
        toast.success(
          `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} actualizado`,
          {
            description: "Los cambios se han guardado correctamente",
          },
        );
        setShowEditDialog(false);
      }
    } else {
      setShowEditDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      const success = await onDelete(item);
      if (success !== false) {
        toast.success(
          `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} eliminado`,
          {
            description: "El elemento ha sido eliminado correctamente",
          },
        );
        setShowDeleteDialog(false);
      }
    } else {
      setShowDeleteDialog(false);
    }
  };

  if (esVisitante && !onView) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-7 w-7 p-0 rounded-xs hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xs border-border bg-popover shadow-sm">
          {onView && (
            <DropdownMenuItem onClick={() => onView(item)} className="cursor-pointer rounded-xs text-xs font-mono uppercase tracking-wider py-1.5">
              <Eye className="mr-2 h-3.5 w-3.5" />
              Ver
            </DropdownMenuItem>
          )}
          {!esVisitante && (
            <>
              {onView && (onEdit || onDelete) && <DropdownMenuSeparator />}
              {onEdit && (itemType !== "orden" || (item.estado !== "recibida_parcial" && item.estado !== "completada" && item.estado !== "completado" && item.estado !== "cancelada" && item.estado !== "cancelado" && item.estado !== "rechazada")) && (
                <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer rounded-xs text-xs font-mono uppercase tracking-wider py-1.5">
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  {itemType === "orden" ? "Cambiar Estado" : "Editar"}
                </DropdownMenuItem>
              )}
              {onDelete && onEdit && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-xs text-xs font-mono uppercase tracking-wider py-1.5"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Eliminar
                </DropdownMenuItem>
              )}
              {showRecepcion && (itemType !== "orden" || (item.estado !== "borrador" && item.estado !== "cancelada" && item.estado !== "cancelado")) && (
                <DropdownMenuItem
                  onClick={() => {
                    if (onRecepcion) {
                      onRecepcion(item);
                    } else {
                      router.push(
                        `/dashboard/ordenes-de-compra/recepcion?ordenId=${item.id}`,
                      );
                    }
                  }}
                  className="text-primary hover:bg-primary/10 focus:bg-primary/10 focus:text-primary cursor-pointer rounded-xs text-xs font-mono uppercase tracking-wider py-1.5"
                >
                  <PackageCheck className="mr-2 h-3.5 w-3.5" />
                  Registrar Recepción
                </DropdownMenuItem>
              )}
              {itemType === "producto" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      router.push(`/dashboard/ordenes-de-compra/nueva?productoId=${item.id}`);
                    }}
                    className="text-primary hover:bg-primary/10 focus:bg-primary/10 focus:text-primary font-medium cursor-pointer rounded-xs text-xs font-mono uppercase tracking-wider py-1.5"
                  >
                    <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                    Crear Orden
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
        <SheetContent className="w-full sm:max-w-135 overflow-y-auto rounded-none border-l border-border bg-card p-0">
          <SheetHeader className="px-6 py-5 border-b border-border bg-muted/20">
            <SheetTitle className="text-base font-semibold tracking-tight text-foreground font-mono uppercase">
              {itemType === "orden" ? "Cambiar Estado de Orden" : `Editar ${itemType}`}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground font-mono mt-1">
              {itemType === "orden" ? "Actualiza el estado y detalles de la orden de compra." : "Modifica los campos que necesites y guarda los cambios."}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-5 px-6 py-6">
            {editFields.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key} className="text-xs font-mono uppercase text-muted-foreground">{field.label}</Label>
                {field.type === "select" ? (
                  <select
                    id={field.key}
                    value={editedItem[field.key] || ""}
                    onChange={(e) =>
                      setEditedItem((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-xs border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={editedItem[field.key] || ""}
                    onChange={(e) =>
                      setEditedItem((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    rows={3}
                    className="rounded-xs border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:border-primary"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type || "text"}
                    value={editedItem[field.key] || ""}
                    onChange={(e) =>
                      setEditedItem((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className={
                      field.readonly
                        ? "h-9 rounded-xs border border-border bg-muted text-muted-foreground cursor-not-allowed font-mono text-xs"
                        : "h-9 rounded-xs border border-border bg-background font-mono text-xs text-foreground focus:border-primary"
                    }
                    disabled={field.readonly}
                    readOnly={field.readonly}
                  />
                )}
              </div>
            ))}
          </div>
          <SheetFooter className="gap-3 px-6 py-4 border-t border-border bg-muted/20">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="flex-1 rounded-xs font-mono text-xs uppercase tracking-wider h-9"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs font-mono text-xs uppercase tracking-wider h-9"
              onClick={handleEditSubmit}
            >
              Guardar cambios
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-106 rounded-xs border-border bg-card p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold tracking-tight font-mono uppercase text-foreground">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground font-mono leading-relaxed mt-2">
              Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
              {itemType === "elemento"
                ? "este elemento"
                : `${
                    itemType === "usuario" || itemType === "producto"
                      ? "este"
                      : "esta"
                  } ${itemType}`}
              {item.nombre || item.name ? (
                <span className="font-semibold text-foreground">
                  {" "}
                  &quot;{item.nombre || item.name}&quot;
                </span>
              ) : (
                ""
              )}{" "}
              de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xs font-mono text-xs uppercase tracking-wider h-9">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xs font-mono text-xs uppercase tracking-wider h-9"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
