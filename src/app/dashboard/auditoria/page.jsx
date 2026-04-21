"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRol } from "@/hooks/useRol";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CheckCircle2, Sparkles, Clock, AlertTriangle, Check, X, Search, Plus, User, Image as ImageIcon, ThumbsUp, ThumbsDown, Settings2, ExternalLink, ShieldAlert, Pencil } from "lucide-react";
import {
  ProgramarTareaDialog,
  NuevaAreaDialog,
  AuditarRegistroDialog,
  ConfigurarAreasDialog,
} from "@/components/audit-dialogs";
import { StatCard } from "@/components/ui/stat-card";

function AuditoriaPage() {
  const router = useRouter();
  const {
    rol,
    loading: rolLoading,
    tienePermiso,
    esVisitante: hookEsVisitante,
  } = useRol();
  const esVisitante = hookEsVisitante || rol === "visitante";

  const [activeTab, setActiveTab] = useState("conteo");
  const [loading, setLoading] = useState(true);

  const [tareasConteo, setTareasConteo] = useState([]);
  const [filtroEstadoConteo, setFiltroEstadoConteo] = useState("Todos");
  const [buscarProducto, setBuscarProducto] = useState("");

  const [areasLimpieza, setAreasLimpieza] = useState([]);
  const [registrosLimpieza, setRegistrosLimpieza] = useState([]);
  const [filtroEstadoLimpieza, setFiltroEstadoLimpieza] = useState("Todos");

  const [usuariosList, setUsuariosList] = useState([]);

  const [isNuevoConteoOpen, setIsNuevoConteoOpen] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [selectedProductoId, setSelectedProductoId] = useState("");
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("");
  const [creandoTarea, setCreandoTarea] = useState(false);

  const [isNuevaTareaLimpiezaOpen, setIsNuevaTareaLimpiezaOpen] =
    useState(false);
  const [selectedAreaIdLimpieza, setSelectedAreaIdLimpieza] = useState("");
  const [selectedUsuarioIdLimpieza, setSelectedUsuarioIdLimpieza] =
    useState("");
  const [creandoTareaLimpieza, setCreandoTareaLimpieza] = useState(false);

  const [isConfigurarAreasOpen, setIsConfigurarAreasOpen] = useState(false);
  const [buscarAreaLimpieza, setBuscarAreaLimpieza] = useState("");

  const [isNuevaAreaOpen, setIsNuevaAreaOpen] = useState(false);
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState("");
  const [nuevaAreaDescripcion, setNuevaAreaDescripcion] = useState("");
  const [nuevaAreaFrecuencia, setNuevaAreaFrecuencia] = useState(7);
  const [nuevaAreaCriterios, setNuevaAreaCriterios] = useState([]);
  const [criterioTemp, setCriterioTemp] = useState("");
  const [creandoArea, setCreandoArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState(null);

  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [actualizandoRegistro, setActualizandoRegistro] = useState(false);

  const [stats, setStats] = useState({
    totalConteos: 0,
    conteosCompletados: 0,
    conteosAjustados: 0,
    conteosPendientes: 0,
    diferenciaNeta: 0,
    totalLimpiezas: 0,
    limpiezasAprobadas: 0,
    limpiezasAccion: 0,
    limpiezasRechazadas: 0,
  });

  useEffect(() => {
    if (!rolLoading && !tienePermiso(["administrador", "visitante"])) {
      router.push("/dashboard/inventario");
    }
  }, [rolLoading, tienePermiso, router]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auditoria");
      if (!res.ok) throw new Error("Error al cargar auditoría");
      const data = await res.json();
      setUsuariosList(data.usuarios || []);
      setTareasConteo(data.tareasConteo || []);
      setAreasLimpieza(data.areasLimpieza || []);
      setRegistrosLimpieza(data.registrosLimpieza || []);
      setProductosDisponibles(data.productosDisponibles || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar información operativa");
    } finally {
      setLoading(false);
    }
  };

  const obtenerUsuarios = async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) {
      const data = await res.json();
      setUsuariosList(data.usuarios || []);
    }
  };

  const obtenerTareasConteo = async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) {
      const data = await res.json();
      setTareasConteo(data.tareasConteo || []);
    }
  };

  const obtenerAreasLimpieza = async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) {
      const data = await res.json();
      setAreasLimpieza(data.areasLimpieza || []);
    }
  };

  const obtenerRegistrosLimpieza = async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) {
      const data = await res.json();
      setRegistrosLimpieza(data.registrosLimpieza || []);
    }
  };

  const obtenerProductos = async () => {
    const res = await fetch("/api/auditoria");
    if (res.ok) {
      const data = await res.json();
      setProductosDisponibles(data.productosDisponibles || []);
    }
  };

  const cargarProductosActivos = obtenerProductos;

  useEffect(() => {
    const totalConteos = tareasConteo.length;
    const conteosCompletados = tareasConteo.filter(
      (t) => t.estado === "Completada",
    ).length;
    const conteosAjustados = tareasConteo.filter(
      (t) => t.estado === "Ajustada",
    ).length;
    const conteosPendientes = tareasConteo.filter(
      (t) => t.estado === "Pendiente",
    ).length;

    const diferenciaNeta = tareasConteo.reduce(
      (acc, curr) => acc + (curr.diferencia || 0),
      0,
    );

    const totalLimpiezas = registrosLimpieza.length;
    const limpiezasAprobadas = registrosLimpieza.filter(
      (r) => r.estado === "aprobado",
    ).length;
    const limpiezasAccion = registrosLimpieza.filter(
      (r) => r.estado === "realizado",
    ).length;
    const limpiezasRechazadas = registrosLimpieza.filter(
      (r) => r.estado === "rechazado",
    ).length;

    setStats({
      totalConteos,
      conteosCompletados,
      conteosAjustados,
      conteosPendientes,
      diferenciaNeta,
      totalLimpiezas,
      limpiezasAprobadas,
      limpiezasAccion,
      limpiezasRechazadas,
    });
  }, [tareasConteo, registrosLimpieza]);

  const getUsuarioNombre = (userId) => {
    if (!userId) return "No asignado";
    const u = usuariosList.find((x) => x.id === userId);
    return u ? `${u.nombre} ${u.apellido || ""}`.trim() : "Usuario Desconocido";
  };

  const handleCrearTareaManual = async (e) => {
    e.preventDefault();
    if (esVisitante) {
      toast.error("Los usuarios con rol visitante no pueden crear tareas");
      return;
    }
    if (!selectedProductoId) {
      toast.error("Por favor selecciona un producto");
      return;
    }

    setCreandoTarea(true);
    try {
      const prod = productosDisponibles.find(
        (p) => p.id === selectedProductoId,
      );
      if (!prod) throw new Error("Producto no encontrado");

      const res = await fetch("/api/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "crear_tarea_conteo",
          producto_id: selectedProductoId,
          stock_logico_snapshot: prod.stock_actual,
          usuario_asignado_id:
            selectedUsuarioId && selectedUsuarioId !== "none"
              ? selectedUsuarioId
              : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear tarea de conteo");
      }

      toast.success("Tarea de conteo creada exitosamente");
      setIsNuevoConteoOpen(false);
      setSelectedProductoId("");
      setSelectedUsuarioId("");
      await obtenerTareasConteo();
    } catch (error) {
      console.error("Error al crear tarea de conteo:", error);
      toast.error("Error al programar la tarea de conteo");
    } finally {
      setCreandoTarea(false);
    }
  };

  const handleCrearArea = async (e) => {
    e.preventDefault();
    if (esVisitante) {
      toast.error("Los usuarios con rol visitante no pueden crear ni editar áreas");
      return;
    }
    if (!nuevaAreaNombre) {
      toast.error("El nombre del área es requerido");
      return;
    }
    if (nuevaAreaCriterios.length === 0) {
      toast.error("Por favor añade al menos un criterio al checklist");
      return;
    }

    setCreandoArea(true);
    try {
      if (editingAreaId) {
        const res = await fetch("/api/auditoria", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "actualizar_area",
            id: editingAreaId,
            nombre: nuevaAreaNombre,
            descripcion: nuevaAreaDescripcion,
            frecuencia_dias: parseInt(nuevaAreaFrecuencia) || 7,
            criterios_checklist: nuevaAreaCriterios,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al actualizar la zona de limpieza");
        }

        toast.success("Zona de limpieza actualizada exitosamente");
      } else {
        const res = await fetch("/api/auditoria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "crear_area",
            nombre: nuevaAreaNombre,
            descripcion: nuevaAreaDescripcion,
            frecuencia_dias: parseInt(nuevaAreaFrecuencia) || 7,
            criterios_checklist: nuevaAreaCriterios,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Error al crear la zona de limpieza");
        }

        toast.success("Zona de limpieza creada exitosamente");
      }

      setIsNuevaAreaOpen(false);
      setNuevaAreaNombre("");
      setNuevaAreaDescripcion("");
      setNuevaAreaFrecuencia(7);
      setNuevaAreaCriterios([]);
      setEditingAreaId(null);
      await obtenerAreasLimpieza();
    } catch (error) {
      console.error("Error al registrar/actualizar área:", error);
      toast.error(
        editingAreaId
          ? "Error al actualizar la zona de limpieza"
          : "Error al registrar la nueva zona de limpieza",
      );
    } finally {
      setCreandoArea(false);
    }
  };

  const handleEditArea = (area) => {
    if (esVisitante) return;
    setEditingAreaId(area.id);
    setNuevaAreaNombre(area.nombre || "");
    setNuevaAreaDescripcion(area.descripcion || "");
    setNuevaAreaFrecuencia(area.frecuencia_dias || 7);
    setNuevaAreaCriterios(area.criterios_checklist || []);
    setIsConfigurarAreasOpen(false);
    setIsNuevaAreaOpen(true);
  };

  const handleAddCriterio = () => {
    if (criterioTemp.trim() === "") return;
    if (nuevaAreaCriterios.includes(criterioTemp.trim())) {
      toast.warning("Este criterio ya está en la lista");
      return;
    }
    setNuevaAreaCriterios([...nuevaAreaCriterios, criterioTemp.trim()]);
    setCriterioTemp("");
  };

  const handleRemoveCriterio = (indexToRemove) => {
    setNuevaAreaCriterios(
      nuevaAreaCriterios.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const handleActualizarEstadoLimpieza = async (nuevoEstado) => {
    if (!selectedRegistro || esVisitante) return;

    setActualizandoRegistro(true);
    try {
      const res = await fetch("/api/auditoria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "actualizar_estado_limpieza",
          id: selectedRegistro.id,
          estado: nuevoEstado,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar estado");
      }

      toast.success(
        `Registro de limpieza actualizado: ${getLimpiezaEstadoLabel(nuevoEstado)}`,
      );

      setRegistrosLimpieza((prev) =>
        prev.map((r) =>
          r.id === selectedRegistro.id ? { ...r, estado: nuevoEstado } : r,
        ),
      );

      setSelectedRegistro(null);
    } catch (error) {
      console.error("Error al actualizar limpieza:", error);
      toast.error("Error al actualizar el estado de la limpieza");
    } finally {
      setActualizandoRegistro(false);
    }
  };

  const handleInicializarLimpieza = async () => {
    if (esVisitante) return;
    try {
      const res = await fetch("/api/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inicializar_limpieza" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar las tareas de limpieza");
      }

      toast.success("Tareas de limpieza generadas para el día de hoy");
      await obtenerRegistrosLimpieza();
    } catch (error) {
      console.error("Error al inicializar limpieza:", error);
      toast.error("Error al generar las tareas de limpieza");
    }
  };

  const handleCrearTareaLimpiezaManual = async (e) => {
    e.preventDefault();
    if (esVisitante) {
      toast.error("Los usuarios con rol visitante no pueden programar limpiezas");
      return;
    }
    if (!selectedAreaIdLimpieza) {
      toast.error("Por favor selecciona un área");
      return;
    }

    setCreandoTareaLimpieza(true);
    try {
      const res = await fetch("/api/auditoria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "crear_tarea_limpieza",
          area_id: selectedAreaIdLimpieza,
          usuario_id:
            selectedUsuarioIdLimpieza && selectedUsuarioIdLimpieza !== "none"
              ? selectedUsuarioIdLimpieza
              : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al programar la tarea de limpieza");
      }

      toast.success("Tarea de limpieza programada exitosamente");
      setIsNuevaTareaLimpiezaOpen(false);
      setSelectedAreaIdLimpieza("");
      setSelectedUsuarioIdLimpieza("");
      await obtenerRegistrosLimpieza();
    } catch (error) {
      console.error("Error al crear tarea de limpieza:", error);
      toast.error("Error al programar la tarea de limpieza");
    } finally {
      setCreandoTareaLimpieza(false);
    }
  };

  const handleAsignarUsuarioLimpieza = async (registroId, usuarioId) => {
    if (esVisitante) return;
    try {
      const uId = usuarioId === "none" ? null : usuarioId;
      const res = await fetch("/api/auditoria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "asignar_usuario_limpieza",
          id: registroId,
          usuario_id: uId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al asignar el operario");
      }

      toast.success("Operario asignado exitosamente a la tarea de limpieza");
      setRegistrosLimpieza((prev) =>
        prev.map((r) => (r.id === registroId ? { ...r, usuario_id: uId } : r)),
      );
    } catch (error) {
      console.error("Error al asignar operario a la limpieza:", error);
      toast.error("Error al asignar el operario");
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "N/A";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tareasFiltradas = tareasConteo.filter((tarea) => {
    const matchesEstado =
      filtroEstadoConteo === "Todos" || tarea.estado === filtroEstadoConteo;
    const matchesSearch =
      tarea.productos?.nombre
        ?.toLowerCase()
        .includes(buscarProducto.toLowerCase()) ||
      tarea.productos?.sku
        ?.toLowerCase()
        .includes(buscarProducto.toLowerCase()) ||
      false;
    return matchesEstado && matchesSearch;
  });

  const registrosFiltrados = registrosLimpieza.filter((registro) => {
    const matchesEstado =
      filtroEstadoLimpieza === "Todos" ||
      registro.estado === filtroEstadoLimpieza;
    const matchesSearch =
      registro.areas_almacen?.nombre
        ?.toLowerCase()
        .includes(buscarAreaLimpieza.toLowerCase()) ||
      registro.areas_almacen?.descripcion
        ?.toLowerCase()
        .includes(buscarAreaLimpieza.toLowerCase()) ||
      false;
    return matchesEstado && matchesSearch;
  });

  const getDiferenciaBadge = (dif) => {
    if (dif === undefined || dif === null)
      return <span className="text-muted-foreground font-mono">-</span>;
    if (dif === 0) return <Badge variant="secondary">Sin diferencia</Badge>;
    if (dif > 0) {
      return (
        <Badge variant="success">
          +{dif} Sobrante
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        {dif} Faltante
      </Badge>
    );
  };

  const getConteoEstadoBadge = (estado) => {
    switch (estado) {
      case "Pendiente":
        return (
          <Badge variant="warning">
            <Clock className="w-3.5 h-3.5" /> Pendiente
          </Badge>
        );
      case "Completada":
        return (
          <Badge variant="info">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completada
          </Badge>
        );
      case "Ajustada":
        return (
          <Badge variant="success">
            <Check className="w-3.5 h-3.5" /> Ajustada
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getLimpiezaEstadoBadge = (estado) => {
    switch (estado) {
      case "aprobado":
        return (
          <Badge variant="success">
            <ThumbsUp className="w-3 h-3" /> Aprobado
          </Badge>
        );
      case "realizado":
        return (
          <Badge variant="info">
            <Clock className="w-3 h-3" /> Por auditar
          </Badge>
        );
      case "asignado":
        return (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3" /> Asignado
          </Badge>
        );
      case "rechazado":
        return (
          <Badge variant="destructive">
            <ThumbsDown className="w-3 h-3" /> Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {estado || "Pendiente"}
          </Badge>
        );
    }
  };

  const getLimpiezaEstadoLabel = (estado) =>
    ({
      aprobado: "Aprobar Limpieza",
      realizado: "Realizado (Revisión)",
      asignado: "Asignar (Pendiente)",
      rechazado: "Rechazar Limpieza",
    })[estado] || "Seleccionar resultado";

  if (
    rolLoading ||
    (loading && tareasConteo.length === 0 && registrosLimpieza.length === 0)
  ) {
    return (
      <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
        <Loader className="w-full min-h-96" />
      </div>
    );
  }

  if (!tienePermiso(["administrador", "visitante"])) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full border border-border bg-card p-6 rounded-xs text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-foreground mb-2">
            Acceso Restringido
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Se requieren credenciales de Administrador o Auditor para acceder a
            los registros de Auditoría Operativa y 5S.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full text-xs h-10"
          >
            Regresar al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const conteoColumns = [
    {
      id: "producto",
      header: "Producto / SKU",
      cell: ({ row }) => {
        const tarea = row.original;
        return (
          <div className="min-w-36">
            <div className="font-bold text-foreground">
              {tarea.productos?.nombre || "N/A"}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              SKU: {tarea.productos?.sku || "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              Ubicación: {tarea.productos?.ubicacion || "N/A"}
            </div>
          </div>
        );
      },
    },
    {
      id: "asignado",
      header: "Asignado a",
      cell: ({ row }) => {
        const tarea = row.original;
        return tarea.usuario_asignado_id ? (
          <div className="flex items-center gap-1.5 min-w-24">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{getUsuarioNombre(tarea.usuario_asignado_id)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic">No asignado</span>
        );
      },
    },
    {
      accessorKey: "fecha_asignacion",
      header: "Fecha Asignación",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono whitespace-nowrap">
          {formatFecha(row.getValue("fecha_asignacion"))}
        </span>
      ),
    },
    {
      accessorKey: "fecha_completado",
      header: "Fecha Completado",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono whitespace-nowrap">
          {row.getValue("fecha_completado") ? (
            formatFecha(row.getValue("fecha_completado"))
          ) : (
            <span className="text-muted-foreground italic">Pendiente</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "stock_logico_snapshot",
      header: "Lógico",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          {row.getValue("stock_logico_snapshot")}
        </span>
      ),
    },
    {
      accessorKey: "conteo_fisico",
      header: "Físico",
      cell: ({ row }) => {
        const v = row.getValue("conteo_fisico");
        return (
          <span className="font-mono font-bold text-foreground">
            {v !== null && v !== undefined ? (
              v
            ) : (
              <span className="text-muted-foreground/60 italic">-</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "diferencia",
      header: "Diferencia",
      cell: ({ row }) => getDiferenciaBadge(row.getValue("diferencia")),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getConteoEstadoBadge(row.getValue("estado")),
    },
    {
      accessorKey: "justificacion",
      header: "Observación",
      cell: ({ row }) => (
        <div
          className="line-clamp-2 max-w-48 text-muted-foreground text-xs"
          title={row.getValue("justificacion")}
        >
          {row.getValue("justificacion") || (
            <span className="text-muted-foreground italic">
              Sin observaciones
            </span>
          )}
        </div>
      ),
    },
  ];

  const limpiezaColumns = [
    {
      id: "area",
      header: "Área de Almacén",
      cell: ({ row }) => {
        const reg = row.original;
        return (
          <div className="min-w-44">
            <div className="font-bold text-foreground">
              {reg.areas_almacen?.nombre || "Área Desconocida"}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {reg.areas_almacen?.descripcion}
            </div>
          </div>
        );
      },
    },
    {
      id: "usuario",
      header: "Usuario",
      cell: ({ row }) => {
        const reg = row.original;
        return reg.usuario_id ? (
          <div className="flex items-center gap-1.5 min-w-24">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{getUsuarioNombre(reg.usuario_id)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Sin asignar</span>
        );
      },
    },
    {
      accessorKey: "fecha_registro",
      header: "Fecha Reporte",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-mono whitespace-nowrap">
          {formatFecha(row.getValue("fecha_registro"))}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getLimpiezaEstadoBadge(row.getValue("estado")),
    },
    {
      accessorKey: "url_evidencia",
      header: "Evidencias",
      cell: ({ row }) => {
        const url = row.getValue("url_evidencia");
        return url ? (
          <Badge
            variant="outline"
            className="text-xs font-mono gap-1 py-0.5 rounded-xs"
          >
            <ImageIcon className="w-3 h-3" /> Con Fotos
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs font-mono italic">
            Sin fotos
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const reg = row.original;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedRegistro(reg)}
            className="text-xs flex items-center gap-1 ml-auto shadow-none cursor-pointer"
          >
            Auditar Evidencia <ExternalLink className="w-3 h-3" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Auditoría Operativa y 5S"
        titleClassName="text-xl sm:text-3xl break-words"
        subtitle="Supervisión de conteos de inventario e inspecciones 5S."
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <TabsList className="mb-4 h-auto w-full grid grid-cols-2 gap-1 bg-muted/50 border border-border p-1 rounded-xs sm:inline-flex sm:w-fit">
          <TabsTrigger
            value="conteo"
            className="min-w-0 justify-center px-2 py-2 sm:px-4 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="min-w-0 truncate sm:hidden">Conteos</span>
            <span className="hidden min-w-0 truncate sm:inline">Historial de Conteos</span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-xs text-xs font-mono font-medium bg-muted border border-border">
              {tareasConteo.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="limpieza"
            className="min-w-0 justify-center px-2 py-2 sm:px-4 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="min-w-0 truncate sm:hidden">Registros 5S</span>
            <span className="hidden min-w-0 truncate sm:inline">Zonas y Registros 5S</span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-xs text-xs font-mono font-medium bg-muted border border-border">
              {registrosLimpieza.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conteo" className="space-y-6 outline-none">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xs overflow-hidden mb-6">
            <StatCard
              title="TOTAL EVALUADO"
              value={stats.totalConteos || (tareasConteo.length || 0)}
              subtitle="Tareas registradas en sistema"
            />
            <StatCard
              title="CONTEO COMPLETADO"
              value={stats.conteosCompletados + stats.conteosAjustados}
              subtitle={`${stats.conteosAjustados} con ajuste de inventario`}
            />
            <StatCard
              title="CONTEOS PENDIENTES"
              value={stats.conteosPendientes}
              subtitle="En espera de verificación física"
            />
            <StatCard
              title="DIFERENCIA NETA"
              value={stats.diferenciaNeta > 0 ? `+${stats.diferenciaNeta}` : stats.diferenciaNeta || 0}
              subtitle="Unidades totales de desviación"
              valueClassName={
                stats.diferenciaNeta < 0
                  ? "text-destructive"
                  : stats.diferenciaNeta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
              }
            />
          </div>

          <div className="border border-border bg-card rounded-xs p-5">
            <div className="flex flex-col justify-between gap-4 mb-6 xl:flex-row xl:items-center">
              <div>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualización y estado del inventario
                </p>
                <h2 className="text-lg font-bold text-foreground">
                  Tareas de Conteo Cíclico
                </h2>
              </div>
              <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                  <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar producto o SKU..."
                      value={buscarProducto}
                      onChange={(e) => setBuscarProducto(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  <div className="w-full sm:w-45 shrink-0">
                    <Select
                      value={filtroEstadoConteo}
                      onValueChange={setFiltroEstadoConteo}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos los estados</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="Completada">Completada</SelectItem>
                        <SelectItem value="Ajustada">Ajustada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!esVisitante && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
                    <Button
                      onClick={() => setIsNuevoConteoOpen(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-none w-full xl:w-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Programar Conteo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className={TABLE_CLASSES.WRAPPER}>
              <DataTable
                columns={conteoColumns}
                data={tareasFiltradas}
                isLoading={loading}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="limpieza" className="space-y-6 outline-none">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xs overflow-hidden mb-6">
            <StatCard
              title="ZONAS REGISTRADAS"
              value={areasLimpieza.length}
              subtitle="Áreas activas bajo control 5S"
            />
            <StatCard
              title="REPORTES APROBADOS"
              value={stats.limpiezasAprobadas}
              subtitle="Conformidad con estándar 5S"
              valueClassName="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="POR AUDITAR"
              value={stats.limpiezasAccion}
              subtitle="Tareas esperando verificación"
            />
            <StatCard
              title="ZONAS RECHAZADAS"
              value={stats.limpiezasRechazadas}
              subtitle="Desviaciones pendientes de acción"
              valueClassName={stats.limpiezasRechazadas > 0 ? "text-destructive" : "text-foreground"}
            />
          </div>

          <div className="border border-border bg-card rounded-xs p-5">
            <div className="flex flex-col justify-between gap-4 mb-6 2xl:flex-row 2xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Historial de Limpieza 5S
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supervisión y control de las verificaciones operativas
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:w-auto">
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:w-auto">
                  <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar zona..."
                      value={buscarAreaLimpieza}
                      onChange={(e) => setBuscarAreaLimpieza(e.target.value)}
                      className="pl-8 h-9 text-xs font-mono rounded-xs bg-background border-border"
                    />
                  </div>
                  <div className="w-full sm:w-45 shrink-0">
                    <Select
                      value={filtroEstadoLimpieza}
                      onValueChange={setFiltroEstadoLimpieza}
                    >
                      <SelectTrigger className="w-full" aria-label="Filtrar por estado">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos los estados</SelectItem>
                        <SelectItem value="asignado">Asignado</SelectItem>
                        <SelectItem value="realizado">Por auditar</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!esVisitante && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-auto">
                    <Button
                      onClick={() => setIsConfigurarAreasOpen(true)}
                      variant="outline"
                      className="h-9 w-full sm:w-auto px-3 border-border bg-background hover:bg-muted text-foreground text-xs font-mono uppercase rounded-xs cursor-pointer shadow-none"
                    >
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Configurar Áreas
                    </Button>
                    <Button
                      onClick={() => setIsNuevaTareaLimpiezaOpen(true)}
                      className="h-9 w-full sm:w-auto px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-mono font-medium uppercase tracking-wider rounded-xs cursor-pointer shadow-none"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Programar Limpieza
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className={TABLE_CLASSES.WRAPPER}>
              <DataTable
                columns={limpiezaColumns}
                data={registrosFiltrados}
                isLoading={loading}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ProgramarTareaDialog
        open={isNuevoConteoOpen}
        onOpenChange={setIsNuevoConteoOpen}
        onSubmit={handleCrearTareaManual}
        title="Programar Auditoría de Conteo"
        description="Selecciona un producto activo del inventario para ordenar una auditoría física de stock."
        itemLabel="Producto a Contar:"
        placeholder="Selecciona un Producto"
        items={productosDisponibles}
        selectedItemId={selectedProductoId}
        onSelectedItemChange={setSelectedProductoId}
        renderItem={(prod) => (
          <>
            {prod.nombre} (SKU: {prod.sku}) — Stock actual:{" "}
            {prod.stock_actual}
          </>
        )}
        usuariosList={usuariosList}
        selectedUsuarioId={selectedUsuarioId}
        onSelectedUsuarioChange={setSelectedUsuarioId}
        submitting={creandoTarea}
        submitClassName="bg-blue-600 text-white hover:bg-blue-700"
      />

      <ProgramarTareaDialog
        open={isNuevaTareaLimpiezaOpen}
        onOpenChange={setIsNuevaTareaLimpiezaOpen}
        onSubmit={handleCrearTareaLimpiezaManual}
        title="Programar Limpieza"
        description="Selecciona una zona/área de almacén para generar una tarea de limpieza y asignarla a un operario."
        itemLabel="Área/Zona a Limpiar:"
        placeholder="Selecciona un Área"
        items={areasLimpieza}
        selectedItemId={selectedAreaIdLimpieza}
        onSelectedItemChange={setSelectedAreaIdLimpieza}
        renderItem={(area) => area.nombre}
        usuariosList={usuariosList}
        selectedUsuarioId={selectedUsuarioIdLimpieza}
        onSelectedUsuarioChange={setSelectedUsuarioIdLimpieza}
        submitting={creandoTareaLimpieza}
        submitClassName="bg-pink-600 text-white hover:bg-pink-700"
      />
      <NuevaAreaDialog
        open={isNuevaAreaOpen}
        onOpenChange={(open) => {
          setIsNuevaAreaOpen(open);
          if (!open) {
            setEditingAreaId(null);
            setNuevaAreaNombre("");
            setNuevaAreaDescripcion("");
            setNuevaAreaFrecuencia(7);
            setNuevaAreaCriterios([]);
          }
        }}
        onSubmit={handleCrearArea}
        editingAreaId={editingAreaId}
        nombre={nuevaAreaNombre}
        onNombreChange={setNuevaAreaNombre}
        descripcion={nuevaAreaDescripcion}
        onDescripcionChange={setNuevaAreaDescripcion}
        frecuencia={nuevaAreaFrecuencia}
        onFrecuenciaChange={setNuevaAreaFrecuencia}
        criterioTemp={criterioTemp}
        onCriterioTempChange={setCriterioTemp}
        onAddCriterio={handleAddCriterio}
        criterios={nuevaAreaCriterios}
        onRemoveCriterio={handleRemoveCriterio}
        creating={creandoArea}
      />

      <AuditarRegistroDialog
        open={!!selectedRegistro}
        onOpenChange={(open) => !open && setSelectedRegistro(null)}
        registro={selectedRegistro}
        formatFecha={formatFecha}
        getUsuarioNombre={getUsuarioNombre}
        getLimpiezaEstadoBadge={getLimpiezaEstadoBadge}
        getLimpiezaEstadoLabel={getLimpiezaEstadoLabel}
        esVisitante={esVisitante}
        onActualizarEstado={handleActualizarEstadoLimpieza}
        actualizando={actualizandoRegistro}
      />
      <ConfigurarAreasDialog
        open={isConfigurarAreasOpen}
        onOpenChange={setIsConfigurarAreasOpen}
        esVisitante={esVisitante}
        onAddArea={() => {
          setIsConfigurarAreasOpen(false);
          setIsNuevaAreaOpen(true);
        }}
        areas={areasLimpieza}
        onEditArea={handleEditArea}
      />
    </div>
  );
}

export default AuditoriaPage;
