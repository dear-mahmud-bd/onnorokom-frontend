"use client";

import { useState } from "react";
import Link from "next/link";
import { searchAssignments } from "@/lib/api/assignments";
import { sessionTokenProvider } from "@/lib/api/token";
import {
  AssignmentStatus,
  ASSIGNMENT_STATUS_LABEL,
  type SearchAssignmentHit,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

const STATUS_OPTIONS = Object.values(AssignmentStatus).map((value) => ({
  label: ASSIGNMENT_STATUS_LABEL[value],
  value,
}));

function StatusBadge({ status }: { status: AssignmentStatus }) {
  const label = ASSIGNMENT_STATUS_LABEL[status];
  const tone =
    status === AssignmentStatus.Published
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      : status === AssignmentStatus.Closed
        ? "border-border bg-surface-muted text-muted"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export default function StudentAssignmentsPage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [hits, setHits] = useState<SearchAssignmentHit[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hint, setHint] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const term = searchText.trim();
    if (!term) {
      // The search endpoint returns nothing without a term — don't round-trip.
      setHint("Enter a search term to find assignments.");
      return;
    }
    setHint(null);
    setError(null);
    setLoading(true);
    try {
      const status =
        statusFilter === ""
          ? undefined
          : (Number(statusFilter) as AssignmentStatus);
      const result = await searchAssignments(
        { searchText: term, status },
        sessionTokenProvider,
      );
      setHits(result.hits);
      setHasSearched(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataTableColumn<SearchAssignmentHit>[] = [
    {
      header: "Title",
      render: (row) => (
        <Link
          href={`/student/assignments/${row.id}`}
          className="font-medium text-accent transition-colors hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    { header: "Subject", render: (row) => row.subjectName },
    { header: "Class", render: (row) => row.className },
    { header: "Teacher", render: (row) => row.teacherName },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Deadline",
      render: (row) => new Date(row.deadline).toLocaleString(),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Assignments"
        description="Search published assignments and open one to submit your work."
      />

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="search-text"
            className="text-sm font-medium text-foreground"
          >
            Search
          </label>
          <input
            id="search-text"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Title or keyword…"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-foreground"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      <p className="text-xs text-muted">
        Only published assignments matching your search term are shown. A
        class-scoped list of all your assignments will arrive with a dedicated
        endpoint.
      </p>

      {hint ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          {hint}
        </div>
      ) : null}

      <ServerErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted">Searching…</p>
      ) : !hasSearched ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          Search for an assignment by keyword to get started.
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={hits}
          rowKey={(row) => row.id}
          emptyState="No assignments match your search."
        />
      )}
    </div>
  );
}
