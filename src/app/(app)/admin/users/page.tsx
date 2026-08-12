import { SectionHeader } from "@/components/admin/SectionHeader";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Provision user"
        description="Create a Teacher or Student account. A temporary password and email verification code are issued out-of-band."
      />

      {/* List and deactivate await backend endpoints — UsersController is
          POST-only (no GET /api/users, no deactivate) — so this screen is
          create-only until those routes exist. */}
      <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
        Listing and deactivating users is not yet available — the backend
        currently exposes account creation only.
      </p>

      <CreateUserForm />
    </div>
  );
}
