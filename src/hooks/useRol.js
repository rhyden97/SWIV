"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

let cachedRol = null;
let pendingPromise = null;
const listeners = new Set();

function updateRol(newRol) {
  cachedRol = newRol;
  listeners.forEach((fn) => fn(newRol));
}

export function clearRolCache() {
  cachedRol = null;
  pendingPromise = null;
  listeners.forEach((fn) => fn(null));
}

async function fetchRol() {
  if (cachedRol !== null) return cachedRol;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.rpc("obtener_rol");
      let userRol = data;

      if (!userRol) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("rol")
            .eq("id", user.id)
            .maybeSingle();
          userRol = perfil?.rol || user.user_metadata?.rol || null;
        }
      }

      updateRol(userRol);
      return userRol;
    } catch (err) {
      console.error("Error obteniendo rol:", err?.message);
      return null;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

export function useRol() {
  const [rol, setRol] = useState(cachedRol);
  const [loading, setLoading] = useState(!cachedRol);

  useEffect(() => {
    let isMounted = true;

    const handleChange = (newRol) => {
      if (isMounted) {
        setRol(newRol);
        setLoading(false);
      }
    };

    listeners.add(handleChange);

    if (cachedRol !== null) {
      setRol(cachedRol);
      setLoading(false);
    } else {
      fetchRol().then((r) => {
        if (isMounted) {
          setRol(r);
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      listeners.delete(handleChange);
    };
  }, []);

  const tienePermiso = useCallback(
    (rolesPermitidos) => {
      if (!rol) return false;
      return Array.isArray(rolesPermitidos)
        ? rolesPermitidos.includes(rol)
        : rol === rolesPermitidos;
    },
    [rol],
  );

  return {
    rol,
    loading,
    tienePermiso,
    esVisitante: rol === "visitante",
  };
}
