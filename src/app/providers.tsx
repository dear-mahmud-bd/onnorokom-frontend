"use client";

import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { NoticeToaster } from "@/components/NoticeToaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      {/* Toasts auto-dismiss after 5s (see docs: sonner Toaster `duration`). */}
      <Toaster position="top-center" duration={5000} richColors closeButton />
      {/* useSearchParams requires a Suspense boundary during prerender. */}
      <Suspense fallback={null}>
        <NoticeToaster />
      </Suspense>
    </AuthProvider>
  );
}
