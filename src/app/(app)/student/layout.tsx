import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StudentShell } from "@/components/student/StudentShell";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth allowedRoles={["Student"]}>
      <NotificationsProvider>
        <StudentShell>{children}</StudentShell>
      </NotificationsProvider>
    </RequireAuth>
  );
}
