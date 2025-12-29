"use client";

import { useRol } from "@/hooks/useRol";

export function PermisoGuard({ requiereRol, children, fallback = null }) {
  const { tienePermiso, loading } = useRol();

  if (loading) {
    return null;
  }

  if (!tienePermiso(requiereRol)) {
    return fallback;
  }

  return <>{children}</>;
}
