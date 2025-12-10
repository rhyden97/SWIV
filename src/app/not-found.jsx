"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full mx-auto text-center border border-border bg-card p-8 rounded-xs shadow-xs">
        <div className="mb-4 flex justify-center">
          <div className="h-10 w-10 rounded-xs bg-primary text-primary-foreground font-mono text-sm font-bold flex items-center justify-center border border-primary/30">
            SW
          </div>
        </div>

        <h1 className="font-mono text-6xl sm:text-7xl font-bold tracking-tight text-foreground mb-2">
          404
        </h1>

        <h2 className="text-lg font-bold text-foreground tracking-tight mb-2">
          Página no encontrada
        </h2>

        <p className="font-mono text-xs text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
          La ruta solicitada no existe o ha sido reubicada.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link href="/dashboard">
            <Button
              size="sm"
              className="w-full sm:w-auto font-mono text-xs uppercase tracking-wider h-9 px-4 rounded-xs"
            >
              <Home className="mr-2 w-4 h-4" />
              Ir al Panel
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto font-mono text-xs uppercase tracking-wider h-9 px-4 rounded-xs border-border"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Volver Atrás
          </Button>
        </div>

        <div className="mt-8 pt-4 border-t border-border">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            SWGVI • Sistema de Gestión de Inventario
          </p>
        </div>
      </div>
    </div>
  );
}
