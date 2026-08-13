"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyAssignments, searchAssignments } from "@/lib/api/assignments";
import { sessionTokenProvider } from "@/lib/api/token";
import {
  AssignmentStatus,
  ASSIGNMENT_STATUS_LABEL,
  type AssignmentResponse,
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

function TitleLink({ id, title }: { id: string; title: string }) {
  return (
    <Link
      href={`/student/assignments/${id}`}
      className="font-medium text-accent transition-colors hover:underline"
    >
      {title}
    </Link>
  );
}

export default function StudentAssignmentsPage() {
  // Default class-scoped browse list (GET /api/assignments/mine).
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState<unknown>(null);

  // Search overlay. `searching` switches the view from browse to results.
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeSearchText, setActiveSearchText] = useState("");
  const [activeStatus, setActiveStatus] = useState<AssignmentStatus | undefined>(
    undefined,
  );
  const [hits, setHits] = useState<SearchAssignmentHit[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [skip, setSkip] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<unknown>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    // browseLoading initializes to true; this effect runs once on mount.
    let active = true;
    listMyAssignments(sessionTokenProvider)
      .then((result) => {
        if (active) setAssignments(result);
      })
      .catch((err) => {
        if (active) setBrowseError(err);
      })
      .finally(() => {
        if (active) setBrowseLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runSearch = async (
    term: string,
    status: AssignmentStatus | undefined,
    nextSkip: number,
  ) => {
    setHint(null);
    setSearchError(null);
    setSearchLoading(true);
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
      setSearching(true);
    } catch (err) {
      setSearchError(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = () => {
    const term = searchText.trim();
    if (!term) {
      // The search endpoint returns nothing without a term — don't round-trip.
      setHint("Enter a search term to filter assignments.");
      return;
    }
    const status =
      statusFilter === ""
        ? undefined
        : (Number(statusFilter) as AssignmentStatus);
    void runSearch(term, status, 0);
  };

  const onReset = () => {
    // Drop back to the default class-scoped browse list.
    setSearchText("");
    setStatusFilter("");
    setActiveSearchText("");
    setActiveStatus(undefined);
    setHits([]);
    setTotalMatches(0);
    setSkip(0);
    setSearching(false);
    setHint(null);
    setSearchError(null);
  };

  const onPageChange = (nextSkip: number) => {
    void runSearch(activeSearchText, activeStatus, nextSkip);
  };

  const browseColumns: DataTableColumn<AssignmentResponse>[] = [
    { header: "Title", render: (row) => <TitleLink id={row.id} title={row.title} /> },
    { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { header: "Max marks", render: (row) => row.maxMarks },
    {
      header: "Deadline",
      render: (row) => new Date(row.deadline).toLocaleString(),
    },
  ];

  const searchColumns: DataTableColumn<SearchAssignmentHit>[] = [
    { header: "Title", render: (row) => <TitleLink id={row.id} title={row.title} /> },
    { header: "Subject", render: (row) => row.subjectName },
    { header: "Class", render: (row) => row.className },
    { header: "Teacher", render: (row) => row.teacherName },
    { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Deadline",
      render: (row) => new Date(row.deadline).toLocaleString(),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Assignments"
        description="Browse the published assignments for your class and open one to submit your work."
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
        Showing published assignments for your enrolled class. Use search to
        filter by keyword across published assignments.
      </p>

      {hint ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          {hint}
        </div>
      ) : null}

      <ServerErrorBanner error={searching ? searchError : browseError} />

      {searching ? (
        searchLoading ? (
          <p className="text-sm text-muted">Searching…</p>
        ) : (
          <>
            <DataTable
              columns={searchColumns}
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
        )
      ) : browseLoading ? (
        <p className="text-sm text-muted">Loading your assignments…</p>
      ) : (
        <DataTable
          columns={browseColumns}
          rows={assignments}
          rowKey={(row) => row.id}
          emptyState="You don't have any published assignments in your class yet."
        />
      )}
    </div>
  );
}
