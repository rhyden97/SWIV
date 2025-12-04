"use client";

import * as React from "react";
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileTableCard } from "@/components/mobile-table-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function getRowMobileFields(row, mobileConfig) {
  const item = row.original;
  if (mobileConfig) {
    return {
      primaryFields: mobileConfig.getPrimaryFields(item),
      secondaryFields: mobileConfig.getSecondaryFields?.(item) || [],
      actions: mobileConfig.getActions?.(item, row),
      badge: mobileConfig.getBadge?.(item),
    };
  }

  const cells = row.getVisibleCells();
  let primaryFields = [];
  let secondaryFields = [];
  let actions = null;
  let badge = null;

  cells.forEach((cell) => {
    const colId = cell.column.id.toLowerCase();
    const headerDef = cell.column.columnDef.header;
    const headerLabel =
      typeof headerDef === "string"
        ? headerDef
        : typeof headerDef === "function"
        ? cell.column.id
        : cell.column.id;

    const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());

    if (colId === "actions" || headerLabel.toLowerCase().includes("accion")) {
      actions = rendered;
      return;
    }

    if (
      colId === "estado" ||
      colId === "status" ||
      headerLabel.toLowerCase() === "estado"
    ) {
      badge = rendered;
      return;
    }

    const fieldObj = {
      label: headerLabel,
      value: rendered,
    };

    if (primaryFields.length < 3) {
      primaryFields.push(fieldObj);
    } else {
      secondaryFields.push(fieldObj);
    }
  });

  return { primaryFields, secondaryFields, actions, badge };
}

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  mobileConfig,
  pageSize = 10,
}) {
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-xs bg-card space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const { primaryFields, secondaryFields, actions, badge } = getRowMobileFields(row, mobileConfig);
            return (
              <MobileTableCard
                key={row.id}
                item={row.original}
                primaryFields={primaryFields}
                secondaryFields={secondaryFields}
                actions={actions}
                badge={badge}
              />
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground font-mono text-xs">
            No se encontraron registros
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-3.5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground font-mono text-xs"
                >
                  No se encontraron registros
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-mono text-muted-foreground">
          <div>
            Mostrando {table.getRowModel().rows.length} de {data.length} registros (Pág. {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())})
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 h-8 text-xs font-mono uppercase tracking-wider border border-border rounded-xs bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-2.5 h-8 flex items-center justify-center border border-border bg-muted/40 rounded-xs text-foreground font-semibold">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 h-8 text-xs font-mono uppercase tracking-wider border border-border rounded-xs bg-card hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const createNameColumn = (
  accessorKey,
  header = "Nombre",
  withAvatar = false
) => ({
  accessorKey,
  header,
  cell: ({ row }) => {
    const value = row.getValue(accessorKey);
    if (withAvatar) {
      const orig = row.original || {};
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage
              src={orig.image || orig.avatar}
              alt={value}
            />
            <AvatarFallback className="text-xs">
              {value?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium whitespace-nowrap">{value}</span>
        </div>
      );
    }
    return <span className="font-medium whitespace-nowrap">{value}</span>;
  },
});

export const createTextColumn = (
  accessorKey,
  header
) => ({
  accessorKey,
  header,
  cell: ({ row }) => (
    <span className="whitespace-nowrap">{row.getValue(accessorKey)}</span>
  ),
});

export const createBadgeColumn = (
  accessorKey,
  header,
  variantMap = {}
) => ({
  accessorKey,
  header,
  cell: ({ row }) => {
    const value = String(row.getValue(accessorKey) ?? "");
    const variant = variantMap[value] || "default";
    return (
      <Badge
        variant={variant}
        className="whitespace-nowrap"
      >
        {value}
      </Badge>
    );
  },
});

export const createSortableColumn = (
  accessorKey,
  header,
  formatter
) => ({
  accessorKey,
  header: ({ column }) => {
    const isSorted = column.getIsSorted();
    return (
      <button
        type="button"
        onClick={() => column.toggleSorting(isSorted === "asc")}
        className={cn(
          "flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider hover:text-foreground whitespace-nowrap text-left transition-colors",
          isSorted ? "text-primary font-bold" : "text-muted-foreground"
        )}
      >
        <span>{header}</span>
        <ArrowUpDown className={cn("h-3 w-3", isSorted ? "text-primary opacity-100" : "opacity-40")} />
      </button>
    );
  },
  cell: ({ row }) => {
    const value = row.getValue(accessorKey);
    return (
      <span className="whitespace-nowrap font-mono tabular-nums">
        {formatter ? formatter(value) : value}
      </span>
    );
  },
});
