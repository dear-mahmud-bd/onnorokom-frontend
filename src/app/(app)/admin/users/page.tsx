"use client";

import { useCallback, useEffect, useState } from "react";
import { listUsers, setUserActive } from "@/lib/api/users";
import { sessionTokenProvider } from "@/lib/api/token";
import {
  USER_ROLE_LABEL,
  type UserSummaryResponse,
} from "@/types";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

function ActiveBadge({ isActive }: { isActive: boolean }) {
  const tone = isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    : "border-border bg-surface-muted text-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [pendingDeactivate, setPendingDeactivate] =
    useState<UserSummaryResponse | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const result = await listUsers(sessionTokenProvider);
      setUsers(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Inline load (no synchronous setState in the effect body); refetch() is
    // reused by the create/toggle event handlers where setState is fine.
    let active = true;
    listUsers(sessionTokenProvider)
      .then((result) => {
        if (active) setUsers(result);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleActive = async (user: UserSummaryResponse, isActive: boolean) => {
    setError(null);
    try {
      await setUserActive(user.id, isActive, sessionTokenProvider);
      await refetch();
    } catch (err) {
      setError(err);
    }
  };

  const columns: DataTableColumn<UserSummaryResponse>[] = [
    { header: "Name", render: (row) => row.fullName },
    { header: "Email", render: (row) => row.email },
    { header: "Role", render: (row) => USER_ROLE_LABEL[row.role] ?? row.role },
    { header: "Status", render: (row) => <ActiveBadge isActive={row.isActive} /> },
    {
      header: "",
      className: "text-right",
      render: (row) =>
        row.isActive ? (
          <button
            type="button"
            onClick={() => setPendingDeactivate(row)}
            className="text-sm font-medium text-red-600 transition-colors hover:underline dark:text-red-400"
          >
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void toggleActive(row, true)}
            className="text-sm font-medium text-accent transition-colors hover:underline"
          >
            Activate
          </button>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Users"
        description="Provision Teacher or Student accounts and manage who can sign in."
      />

      <CreateUserForm onCreated={refetch} />

      <SectionHeader
        title="All users"
        description="Activate or deactivate accounts. Deactivated users can no longer sign in."
      />

      <ServerErrorBanner error={error} />

      {loading ? (
        <p className="text-sm text-muted">Loading users…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          rowKey={(row) => row.id}
          emptyState="No users yet."
        />
      )}

      <ConfirmDialog
        open={pendingDeactivate !== null}
        title="Deactivate user"
        message={`Deactivate ${pendingDeactivate?.email ?? "this user"}? They will no longer be able to sign in.`}
        confirmLabel="Deactivate"
        onConfirm={() => {
          const target = pendingDeactivate;
          setPendingDeactivate(null);
          if (target) void toggleActive(target, false);
        }}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
