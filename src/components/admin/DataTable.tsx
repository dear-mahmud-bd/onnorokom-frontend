import type { ReactNode } from "react";

export interface DataTableColumn<TRow> {
  header: string;
  render: (row: TRow) => ReactNode;
  className?: string;
}

interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  rowKey: (row: TRow) => string;
  emptyState?: ReactNode;
}

export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  emptyState = "No records yet.",
}: DataTableProps<TRow>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted/60">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/70 transition-colors last:border-0 hover:bg-surface-muted/50"
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={`px-4 py-3 text-foreground ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
