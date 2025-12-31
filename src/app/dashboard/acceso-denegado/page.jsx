"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { useRol } from "@/hooks/useRol";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { rol, loading } = useRol();

  const handleGoHome = () => {
    if (loading || !rol) {
      router.push("/login");
      return;
    }

    switch (rol) {
      case "administrador":
      case "visitante":
        router.push("/dashboard");
        break;
      case "almacen":
        router.push("/dashboard/almacen");
        break;
      case "ventas":
        router.push("/dashboard/ventas");
        break;
      default:
        router.push("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      router.push("/login");
      router.refresh();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="flex min-h-128 items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-linear-to-b from-white to-red-50/10 shadow-xl dark:from-gray-950 dark:to-red-950/5 dark:border-red-900/40">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
            <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-400">
            Acceso Restringido
          </CardTitle>
          <CardDescription className="text-red-700/80 dark:text-red-300/70 mt-2">
            No tienes los privilegios necesarios para ver esta sección.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-600 dark:text-gray-400 px-6 py-2">
          <p className="mb-4">
            Tu rol actual en el sistema es{" "}
            <span className="font-semibold text-gray-900 dark:text-white uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              {loading ? "Cargando..." : rol || "Ninguno"}
            </span>
            .
          </p>
          <p>
            Esta página requiere permisos especiales. Si crees que esto es un
            error, por favor contacta con el administrador del sistema.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-6 border-t border-red-100 dark:border-red-950/40">
          <Button
            onClick={handleGoHome}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium shadow-md transition-all duration-200 gap-2"
          >
            <Home className="h-4 w-4" />
            Ir a mi Panel Autorizado
          </Button>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="flex-1 bg-red-500 text-white hover:bg-red-400 hover:text-white gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
