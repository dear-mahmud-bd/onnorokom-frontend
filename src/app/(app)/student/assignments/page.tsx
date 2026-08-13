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
import { AssignmentSearchBar } from "@/components/search/AssignmentSearchBar";
import { SearchPagination } from "@/components/search/SearchPagination";

const PAGE_SIZE = 10;

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
  // Form inputs (may be edited between pages).
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  // Snapshot of the query that produced the current results, so paging keeps
  // using the term/status that was actually searched, not a mid-edit input.
  const [activeSearchText, setActiveSearchText] = useState("");
  const [activeStatus, setActiveStatus] = useState<AssignmentStatus | undefined>(
    undefined,
  );
  const [hits, setHits] = useState<SearchAssignmentHit[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hint, setHint] = useState<string | null>(null);

  const runSearch = async (
    term: string,
    status: AssignmentStatus | undefined,
    nextSkip: number,
  ) => {
    setHint(null);
    setError(null);
    setLoading(true);
    try {
      const result = await searchAssignments(
        { searchText: term, status, take: PAGE_SIZE, skip: nextSkip },
        sessionTokenProvider,
      );
      setHits(result.hits);
      setTotalMatches(result.totalMatches);
      setSkip(result.skip);
      setActiveSearchText(term);
      setActiveStatus(status);
      setHasSearched(true);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = () => {
    const term = searchText.trim();
    if (!term) {
      // The search endpoint returns nothing without a term — don't round-trip.
      setHint("Enter a search term to find assignments.");
      return;
    }
    const status =
      statusFilter === ""
        ? undefined
        : (Number(statusFilter) as AssignmentStatus);
    // A new search always returns to the first page.
    void runSearch(term, status, 0);
  };

  const onReset = () => {
    setSearchText("");
    setStatusFilter("");
    setActiveSearchText("");
    setActiveStatus(undefined);
    setHits([]);
    setTotalMatches(0);
    setSkip(0);
    setHasSearched(false);
    setHint(null);
    setError(null);
  };

  const onPageChange = (nextSkip: number) => {
    // Re-query the same term/status that produced the current results.
    void runSearch(activeSearchText, activeStatus, nextSkip);
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

      <AssignmentSearchBar
        searchText={searchText}
        status={statusFilter}
        onSearchTextChange={setSearchText}
        onStatusChange={setStatusFilter}
        onSubmit={onSubmit}
        onReset={onReset}
      />

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
        <>
          <DataTable
            columns={columns}
            rows={hits}
            rowKey={(row) => row.id}
            emptyState="No assignments match your search."
          />
          {totalMatches > 0 ? (
            <SearchPagination
              take={PAGE_SIZE}
              skip={skip}
              hitCount={hits.length}
              totalMatches={totalMatches}
              onPageChange={onPageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
