"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isApiError } from "@/lib/api/client";
import { loginSchema, type LoginInput } from "@/lib/validation";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { FormTextInput } from "@/components/auth/FormTextInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default function LoginPage() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<unknown>(null);
  const [invalidCredentials, setInvalidCredentials] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Only a fully set-up session leaves the login screen on its own. A
    // "requires-action" session (an admin-created user mid-setup) must NOT be
    // bounced away — otherwise a different user could never sign in on this
    // browser. Post-login routing is handled explicitly in onSubmit below.
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setInvalidCredentials(false);
    setAuthError(null);
    try {
      const action = await login(email, password);
      // Route explicitly to the next step, carrying the account's email in the
      // URL so the setup flow is identified by the URL rather than persisted
      // browser state (which would trap the /login route for other users).
      const emailParam = `?email=${encodeURIComponent(email)}`;
      if (action === "VerifyEmail") {
        router.replace(`/verify-email${emailParam}`);
      } else if (action === "ChangePassword") {
        router.replace(`/change-password${emailParam}`);
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        setInvalidCredentials(true);
      } else {
        setAuthError(error);
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to your account to continue.
        </p>
      </div>

      {invalidCredentials ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          Invalid email or password. Please try again.
        </div>
      ) : null}

      <ServerErrorBanner error={authError} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormTextInput
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@school.com"
          />
          <FormTextInput
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
          />
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Sign in
          </SubmitButton>
        </form>
      </FormProvider>
    </div>
  );
}