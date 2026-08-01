/**
 * Generic table used by every list page. Built on the shadcn-style
 * Table primitives -- this component only owns the shell (loading /
 * empty states, row click), each page defines its own column config.
 */

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { Inbox } from "lucide-react";

interface Column<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  isLoading,
  emptyMessage = "No records yet.",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  if (isLoading) {
    return (
      <div className="border border-border rounded-lg bg-card">
        <div className="py-16 text-center text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg bg-card">
        <div className="py-16 flex flex-col items-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((col) => (
            <TableHead key={col.header} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer" : ""}
          >
            {columns.map((col) => (
              <TableCell key={col.header} className={col.className}>
                {col.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
