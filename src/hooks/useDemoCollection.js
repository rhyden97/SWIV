"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useDemoCollection(endpoint, demoData, options = {}) {
  const { mapItem, errorLabel = "Error cargando datos:", idField = "id" } = options;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const mapItemRef = useRef(mapItem);
  const demoDataRef = useRef(demoData);

  mapItemRef.current = mapItem;
  demoDataRef.current = demoData;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) setLoading(true);

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Error ${response.status} al cargar ${endpoint}`);
        }

        const payload = await response.json();
        const mapped = Array.isArray(payload) && mapItemRef.current
          ? payload.map(mapItemRef.current)
          : payload;
        const nextData =
          Array.isArray(mapped) && mapped.length > 0
            ? mapped
            : demoDataRef.current;

        if (mountedRef.current) setData(nextData);
      } catch (error) {
        console.error(errorLabel, error);
        if (mountedRef.current) setData(demoDataRef.current);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [endpoint, errorLabel],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const updateItem = useCallback(
    async (editedItem, { idKey = idField, transform } = {}) => {
      try {
        const body = transform ? transform(editedItem) : editedItem;
        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al actualizar");
        }

        const updated = await response.json();
        setData((prev) =>
          prev.map((item) =>
            item[idKey] === (updated[idKey] ?? editedItem[idKey])
              ? { ...item, ...updated }
              : item,
          ),
        );
        return true;
      } catch (error) {
        console.error("Error al actualizar:", error);
        toast.error(error.message || "Error al actualizar");
        return false;
      }
    },
    [endpoint, idField],
  );

  const deleteItem = useCallback(
    async (itemToDelete, { idKey = idField, paramName } = {}) => {
      try {
        const idVal =
          typeof itemToDelete === "object" && itemToDelete !== null
            ? itemToDelete[idKey]
            : itemToDelete;
        const queryParam = paramName || idKey;
        const response = await fetch(
          `${endpoint}?${queryParam}=${encodeURIComponent(idVal)}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al eliminar");
        }

        setData((prev) => prev.filter((item) => item[idKey] !== idVal));
        return true;
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error(error.message || "Error al eliminar");
        return false;
      }
    },
    [endpoint, idField],
  );

  return { data, setData, loading, reload, updateItem, deleteItem };
}
