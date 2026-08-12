import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allowedRoles={["Admin"]}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
