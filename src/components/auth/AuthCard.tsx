import type { ReactNode } from "react";

interface AuthCardProps {
  title?: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900">
      {title ? (
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
      ) : null}
      {children}
    </div>
  );
}