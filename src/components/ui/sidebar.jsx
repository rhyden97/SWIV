"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRol, clearRolCache } from "@/hooks/useRol";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { ROUTE_PERMISSIONS } from "@/lib/permissions";
let cachedUserData = null;
let pendingUserPromise = null;
const userListeners = new Set();
function updateUserData(data) {
  cachedUserData = data;
  userListeners.forEach((fn) => fn(data));
}
import { LayoutDashboard, Package, Factory, ShoppingCart, Users, BrainCircuit, LineChart, Building2, User, LogOut, Kanban, Settings, UserCog, Warehouse, ClipboardCheck, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navigationGroups = [
  {
    label: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ROUTE_PERMISSIONS["/dashboard"],
      },
      {
        name: "Dashboard Almacén",
        href: "/dashboard/almacen",
        icon: Warehouse,
        roles: ROUTE_PERMISSIONS["/dashboard/almacen"],
      },
      {
        name: "Inventario",
        href: "/dashboard/inventario",
        icon: Package,
        roles: ROUTE_PERMISSIONS["/dashboard/inventario"],
      },
      {
        name: "Pedidos",
        href: "/dashboard/pedidos",
        icon: Kanban,
        roles: ROUTE_PERMISSIONS["/dashboard/pedidos"],
      },
    ],
  },
  {
    label: "Ventas y Clientes",
    items: [
      {
        name: "Ventas",
        href: "/dashboard/ventas",
        icon: ShoppingCart,
        roles: ROUTE_PERMISSIONS["/dashboard/ventas"],
      },
      {
        name: "Clientes",
        href: "/dashboard/clientes",
        icon: Users,
        roles: ROUTE_PERMISSIONS["/dashboard/clientes"],
      },
    ],
  },
  {
    label: "Compras y Proveedores",
    items: [
      {
        name: "Órdenes de Compra",
        href: "/dashboard/ordenes-de-compra",
        icon: Factory,
        roles: ROUTE_PERMISSIONS["/dashboard/ordenes-de-compra"],
      },
      {
        name: "Proveedores",
        href: "/dashboard/proveedores",
        icon: Building2,
        roles: ROUTE_PERMISSIONS["/dashboard/proveedores"],
      },
    ],
  },
  {
    label: "Análisis",
    roles: ROUTE_PERMISSIONS["/dashboard"],
    items: [
      {
        name: "Predicciones IA",
        href: "/dashboard/predicciones",
        icon: BrainCircuit,
        roles: ROUTE_PERMISSIONS["/dashboard/predicciones"],
      },
      {
        name: "Reportes",
        href: "/dashboard/reportes",
        icon: LineChart,
        roles: ROUTE_PERMISSIONS["/dashboard/reportes"],
      },
      {
        name: "Auditoría y 5S",
        href: "/dashboard/auditoria",
        icon: ClipboardCheck,
        roles: ROUTE_PERMISSIONS["/dashboard/auditoria"],
      },
    ],
  },
  {
    label: "Administración",
    roles: ROUTE_PERMISSIONS["/dashboard"],
    items: [
      {
        name: "Usuarios",
        href: "/dashboard/usuarios",
        icon: UserCog,
        roles: ROUTE_PERMISSIONS["/dashboard/usuarios"],
      },
    ],
  },
];

export function SidebarContent({ onLinkClick, className }) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const { tienePermiso, rol: hookRol, esVisitante } = useRol();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState(
    cachedUserData || {
      nombre: "Usuario",
      email: "",
      rol: "",
    }
  );

  const fetchUserData = useCallback(async () => {
    if (cachedUserData) return cachedUserData;
    if (pendingUserPromise) return pendingUserPromise;

    pendingUserPromise = (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const userMetaRol = user.user_metadata?.rol || "";
          let nextData = {
            nombre:
              user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
            email: user.email || "",
            rol: userMetaRol,
          };

          const { data: perfil } = await supabase
            .from("usuarios")
            .select("nombre, apellido, rol")
            .eq("id", user.id)
            .single();

          if (perfil?.nombre) {
            nextData = {
              nombre: `${perfil.nombre} ${perfil.apellido || ""}`.trim(),
              email: user.email || "",
              rol: perfil.rol || userMetaRol || "",
            };
          } else if (perfil?.rol) {
            nextData.rol = perfil.rol;
          }

          updateUserData(nextData);
          return nextData;
        }
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        pendingUserPromise = null;
      }
    })();

    return pendingUserPromise;
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const handleUserChange = (newData) => {
      if (isMounted && newData) {
        setUserData(newData);
      }
    };
    userListeners.add(handleUserChange);

    if (!cachedUserData) {
      fetchUserData().then((data) => {
        if (isMounted && data) setUserData(data);
      });
    }

    return () => {
      isMounted = false;
      userListeners.delete(handleUserChange);
    };
  }, [fetchUserData]);

  const rolDisplay = userData.rol || hookRol || "";
  const isGuest = esVisitante || rolDisplay === "visitante";

  const filteredNavigationGroups = navigationGroups
    .map((group) => {
      if (group.roles && !tienePermiso(group.roles)) {
        return null;
      }

      const filteredItems = group.items.filter((item) => {
        if (!item.roles) return true;
        return tienePermiso(item.roles);
      });

      if (filteredItems.length === 0) return null;

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter(Boolean);

  const handleLogout = async () => {
    try {
      if (onLinkClick) onLinkClick();
      cachedUserData = null;
      clearRolCache();
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      router.push("/login");
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className={cn("flex h-full w-full flex-col bg-sidebar select-none", className)}>
      <div className="flex items-center gap-3 px-3.5 pr-12 lg:pr-3.5 py-3.5 border-b border-border bg-sidebar">
        <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-primary text-primary-foreground font-mono text-xs font-bold shrink-0 border border-primary/30 shadow-xs">
          SW
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold tracking-tight text-foreground">
              SWGVI
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            v2.0
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2.5">
        <div className="space-y-3">
          {filteredNavigationGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <div className="px-2 pt-1.5 pb-1 flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              <ul className="space-y-0.5 mt-0.5">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onLinkClick}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xs px-2.5 py-1.5 text-xs font-mono transition-colors border",
                          isActive
                            ? "bg-primary/10 text-primary border-primary/30 font-medium"
                            : "border-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-2 bg-sidebar">
        <div className="flex items-center gap-1 w-full">
          <DropdownMenu className="flex-1 min-w-0">
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-muted/70 px-2 py-1.5 h-auto rounded-xs border border-transparent hover:border-border transition-colors group"
              >
                <div className="flex aspect-square size-7 items-center justify-center rounded-xs bg-muted text-foreground border border-border shrink-0 font-mono text-xs font-semibold">
                  {userData.nombre ? userData.nombre.charAt(0).toUpperCase() : <User className="size-3.5" />}
                </div>
                <div className="grid flex-1 text-left leading-tight ml-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-mono text-xs font-semibold text-foreground">
                      {userData.nombre}
                    </span>
                    {rolDisplay && (
                      <span className="shrink-0 text-xs font-mono uppercase px-1 py-0.5 rounded-xs bg-muted text-muted-foreground border border-border">
                        {rolDisplay}
                      </span>
                    )}
                  </div>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {userData.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 mb-2 rounded-xs border border-border bg-popover shadow-sm p-1">
              <div className="px-2 py-1.5 border-b border-border/60 mb-1">
                <p className="font-mono text-xs font-semibold text-foreground truncate">
                  {userData.nombre}
                </p>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  {userData.email}
                </p>
                {rolDisplay && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded-xs bg-muted text-muted-foreground border border-border">
                      Rol: {rolDisplay}
                    </span>
                  </div>
                )}
              </div>
              {!isGuest && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsProfileOpen(true)}
                    className="cursor-pointer font-mono text-xs rounded-xs"
                  >
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-mono text-xs rounded-xs"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="h-8 w-8 shrink-0 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="sr-only">Cerrar Sesión</span>
          </Button>
        </div>
        {!isGuest && (
          <EditProfileDialog
            open={isProfileOpen}
            onOpenChange={setIsProfileOpen}
            onSuccess={fetchUserData}
          />
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 flex-col border-r border-border shrink-0">
      <SidebarContent />
    </aside>
  );
}
