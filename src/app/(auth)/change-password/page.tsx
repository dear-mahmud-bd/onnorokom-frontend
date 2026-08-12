"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isApiError } from "@/lib/api/client";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validation";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { FormTextInput } from "@/components/auth/FormTextInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

function readFailedRules(problem: unknown): string[] {
  if (typeof problem !== "object" || problem === null) {
    return [];
  }

  const body = problem as {
    errors?: Record<string, string[]>;
    failedRules?: string[] | null;
  };

  if (body.errors) {
    const flattened = Object.values(body.errors).flat();
    if (flattened.length > 0) {
      return flattened;
    }
  }

  return body.failedRules ?? [];
}

export default function ChangePasswordPage() {
  const { status, changePassword, logout } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<unknown>(null);
  const [invalidCurrent, setInvalidCurrent] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  const onSubmit = form.handleSubmit(
    async ({ currentPassword, newPassword }) => {
      setInvalidCurrent(false);
      setAuthError(null);
      try {
        await changePassword(currentPassword, newPassword);
        setSucceeded(true);
        logout();
        router.replace("/login?notice=password-changed");
      } catch (error) {
        const problemStatus = isApiError(error)
          ? (error.problem as unknown as { status?: string }).status
          : undefined;

        if (
          isApiError(error) &&
          error.status === 429 &&
          problemStatus === "EmailNotVerified"
        ) {
          router.replace("/verify-email");
        } else if (
          isApiError(error) &&
          error.status === 422 &&
          problemStatus === "PolicyViolation"
        ) {
          const rules = readFailedRules(error.problem);
          form.setError("newPassword", {
            type: "server",
            message:
              rules.length > 0
                ? rules.join(" ")
                : "Your new password does not meet the password policy.",
          });
        } else if (
          isApiError(error) &&
          error.status === 400 &&
          problemStatus === "InvalidCurrentPassword"
        ) {
          setInvalidCurrent(true);
        } else {
          setAuthError(error);
        }
      }
    },
  );

  if (succeeded) {
    return (
      <div
        role="status"
        className="flex flex-col gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
      >
        <p className="font-medium">Password changed.</p>
        <p>Redirecting you to sign in with your new password…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Change your password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Set a new password to finish securing your account.
        </p>
      </div>

      {invalidCurrent ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          Your current password is incorrect. Please try again.
        </div>
      ) : null}

      <ServerErrorBanner error={authError} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormTextInput
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            placeholder="Your current password"
          />
          <FormTextInput
            name="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="Your new password"
          />
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Change password
          </SubmitButton>
        </form>
      </FormProvider>
    </div>
  );
}
