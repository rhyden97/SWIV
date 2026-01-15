"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DataTable, createTextColumn } from "@/components/ui/data-table";
import { SearchActionBar } from "@/components/search-action-bar";
import DialogUsers from "@/components/user-dialog";
import { PermisoGuard } from "@/components/permission-guard";
import { TableRowActions } from "@/components/table-row-actions";
import { fieldConfigs } from "@/lib/fieldConfigs";
import { DEMO_USUARIOS } from "@/lib/demoData";
import { useDemoCollection } from "@/hooks/useDemoCollection";
import { PageHeader } from "@/components/page-header";
import { LAYOUT_CLASSES, TABLE_CLASSES } from "@/lib/constants";

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: usuarios,
    loading,
    reload: loadUsuarios,
    updateItem: handleEditUsuario,
  } = useDemoCollection("/api/usuarios", DEMO_USUARIOS, {
    errorLabel: "Error cargando usuarios:",
  });

  const columns = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("nombre")}</span>
      ),
    },
    {
      accessorKey: "apellido",
      header: "Apellido",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("apellido")}</span>
      ),
    },
    createTextColumn("email", "Email"),
    {
      accessorKey: "rol",
      header: "Rol",
      cell: ({ row }) => {
        const rol = row.getValue("rol")?.toLowerCase();
        let variant = "secondary";
        let label = "Usuario";

        if (rol === "administrador") {
          variant = "info";
          label = "Administrador";
        } else if (rol === "ventas") {
          variant = "default";
          label = "Ventas";
        } else if (rol === "almacen" || rol === "almacén") {
          variant = "warning";
          label = "Almacén";
        } else if (rol === "visitante") {
          return (
            <Badge variant="outline" className="font-mono text-xs rounded-xs">
              Visitante
            </Badge>
          );
        }

        return (
          <Badge variant={variant} className="font-mono text-xs rounded-xs">
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue("estado")?.toLowerCase() || "activo";
        const variant = estado === "activo" ? "default" : "destructive";
        const label = estado === "activo" ? "Activo" : "Inactivo";
        return (
          <Badge variant={variant} className="font-mono text-xs rounded-xs">
            {label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <TableRowActions
          item={row.original}
          onEdit={handleEditUsuario}
          editFields={fieldConfigs.usuario}
          itemType="usuario"
        />
      ),
    },
  ];

  const userFilter = usuarios.filter((user) => {
    const q = searchTerm.toLowerCase();
    return (
      (user.nombre || "").toLowerCase().includes(q) ||
      (user.apellido || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q) ||
      (user.rol || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={LAYOUT_CLASSES.PAGE_CONTAINER}>
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administración de cuentas y asignación de roles."
      />

      <SearchActionBar
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre, email o rol..."
      >
        <PermisoGuard requiereRol="administrador">
          <DialogUsers onUserCreated={loadUsuarios} />
        </PermisoGuard>
      </SearchActionBar>

      <div className={TABLE_CLASSES.WRAPPER}>
        <DataTable
          columns={columns}
          data={userFilter}
          isLoading={loading}
          mobileConfig={{
            getPrimaryFields: (u) => [
              { label: "Nombre", value: `${u.nombre || ""} ${u.apellido || ""}`.trim() },
              { label: "Email", value: u.email },
            ],
            getSecondaryFields: (u) => [{ label: "ID", value: u.id }],
            getBadge: (u) => {
              const rol = u.rol?.toLowerCase();
              const estado = u.estado?.toLowerCase() || "activo";

              if (estado === "inactivo") {
                return { text: "Inactivo", variant: "destructive" };
              }

              let text = "Usuario";
              let variant = "secondary";

              if (rol === "administrador") {
                text = "Administrador";
                variant = "info";
              } else if (rol === "ventas") {
                text = "Ventas";
                variant = "default";
              } else if (rol === "almacen" || rol === "almacén") {
                text = "Almacén";
                variant = "warning";
              } else if (rol === "visitante") {
                text = "Visitante";
                variant = "secondary";
              }

              return { text, variant };
            },
            getActions: (u) => (
              <TableRowActions
                item={u}
                onEdit={handleEditUsuario}
                editFields={fieldConfigs.usuario}
                itemType="usuario"
              />
            ),
          }}
        />
      </div>
    </div>
  );
}
