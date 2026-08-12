import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StudentShell } from "@/components/student/StudentShell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allowedRoles={["Student"]}>
      <StudentShell>{children}</StudentShell>
    </RequireAuth>
  );
}
