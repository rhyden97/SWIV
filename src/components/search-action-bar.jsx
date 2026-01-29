"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermisoGuard } from "@/components/permission-guard";
import { SEARCH_CLASSES } from "@/lib/constants";

export function InputSearch({ value, setSearchTerm, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        className="h-9 w-full pl-9 pr-3 text-xs font-mono rounded-xs border-border bg-background focus-visible:ring-primary/40"
        value={value}
        onChange={setSearchTerm}
      />
    </div>
  );
}

export function SearchActionBar({
  value,
  onChange,
  placeholder = "Buscar...",
  buttonLabel,
  buttonHref,
  buttonIcon: Icon,
  roles = ["administrador"],
  children,
}) {
  const router = useRouter();

  return (
    <div className={SEARCH_CLASSES.WRAPPER}>
      <InputSearch
        value={value}
        setSearchTerm={onChange}
        placeholder={placeholder}
      />
      {children}
      {buttonLabel && buttonHref && (
        <PermisoGuard requiereRol={roles}>
          <Button
            onClick={() => router.push(buttonHref)}
            className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-mono font-medium uppercase tracking-wider rounded-xs whitespace-nowrap touch-manipulation cursor-pointer shadow-none"
          >
            {Icon && <Icon className="mr-1.5 h-4 w-4" />}
            {buttonLabel}
          </Button>
        </PermisoGuard>
      )}
    </div>
  );
}

export default SearchActionBar;
