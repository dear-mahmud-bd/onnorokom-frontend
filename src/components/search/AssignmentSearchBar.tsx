"use client";

import type { FormEvent } from "react";
import { AssignmentStatus, ASSIGNMENT_STATUS_LABEL } from "@/types";

const STATUS_OPTIONS = Object.values(AssignmentStatus).map((value) => ({
  label: ASSIGNMENT_STATUS_LABEL[value],
  value,
}));

interface AssignmentSearchBarProps {
  searchText: string;
  status: string;
  onSearchTextChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
}

// Controlled, fetch-free search/filter bar. The parent owns all state and data
// fetching so this stays reusable and testable (FE Phase 19). Only exposes the
// two filters the search API can serve: free-text + status.
export function AssignmentSearchBar({
  searchText,
  status,
  onSearchTextChange,
  onStatusChange,
  onSubmit,
  onReset,
}: AssignmentSearchBarProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
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
          onChange={(e) => onSearchTextChange(e.target.value)}
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
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
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
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
        >
          Search
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex h-10 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted/60"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
