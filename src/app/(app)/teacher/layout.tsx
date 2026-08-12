import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TeacherShell } from "@/components/teacher/TeacherShell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allowedRoles={["Teacher"]}>
      <TeacherShell>{children}</TeacherShell>
    </RequireAuth>
  );
}
