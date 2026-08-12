import type { ReactNode } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <AuthCard>{children}</AuthCard>
    </div>
  );
}