"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/ui/sidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="lg:hidden h-8 px-2.5 gap-2 rounded-xs border border-border bg-background/95 backdrop-blur-xs shadow-xs hover:bg-muted font-mono text-xs uppercase tracking-wider text-foreground"
        >
          <Menu className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-mono text-xs font-semibold">MENÚ</span>
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 border-r border-border bg-sidebar shadow-lg">
        <SidebarContent onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
