"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from "@/lib/api/subjects";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import type { SubjectInput } from "@/lib/validation";
import type { SubjectResponse } from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SubjectFormDialog } from "@/components/admin/SubjectFormDialog";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface DialogState {
  mode: "create" | "edit";
  target: SubjectResponse | null;
}

export default function AdminSubjectsPage() {
  const [rows, setRows] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Refresh used after mutations (event handlers, not effects).
  const refresh = useCallback(async () => {
    setRows(await listSubjects(sessionTokenProvider));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listSubjects(sessionTokenProvider);
        if (active) {
          setRows(data);
        }
      } catch (error) {
        if (active) {
          setLoadError(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (values: SubjectInput) => {
    if (!dialog) {
      return;
    }
    setActionError(null);
    if (dialog.mode === "create") {
      await createSubject(values, sessionTokenProvider);
    } else if (dialog.target) {
      await updateSubject(
        { id: dialog.target.id, ...values },
        sessionTokenProvider,
      );
    }
    await refresh();
    setDialog(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteSubject(deleteTarget.id, sessionTokenProvider);
      setDeleteTarget(null);
      await refresh();
    } catch (error) {
      setDeleteTarget(null);
      if (
        isApiError(error) &&
        error.status === 409 &&
        error.problem.errorCode === "InUse"
      ) {
        setActionError(
          "This subject is in use and cannot be deleted while assignments reference it.",
        );
        return;
      }
      setActionError("Could not delete the subject. Please try again.");
    }
  };

  const columns: DataTableColumn<SubjectResponse>[] = [
    { header: "Name", render: (row) => row.name },
    { header: "Code", render: (row) => row.code },
    {
      header: "",
      className: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDialog({ mode: "edit", target: row })}
            className="rounded-full px-3 py-1 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-full px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Subjects"
        description="Manage subjects and their codes."
        action={
          <button
            type="button"
            onClick={() => setDialog({ mode: "create", target: null })}
            className="flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            New subject
          </button>
        }
      />

      {actionError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {actionError}
        </div>
      ) : null}

      <ServerErrorBanner error={loadError} />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          emptyState="No subjects yet. Create the first one."
        />
      )}

      {dialog !== null ? (
        <SubjectFormDialog
          mode={dialog.mode}
          initialValue={dialog.target}
          onSubmit={handleSubmit}
          onCancel={() => setDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete subject"
        message={`Delete "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
