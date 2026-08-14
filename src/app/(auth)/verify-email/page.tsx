"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isApiError } from "@/lib/api/client";
import {
  OTP_CODE_LENGTH,
  verifyEmailSchema,
  type VerifyEmailOtpInput,
} from "@/lib/validation";
import { normalizeVerifyEmailOtpStatus } from "@/types";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import { FormTextInput } from "@/components/auth/FormTextInput";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default function VerifyEmailPage() {
  const { status, verifyEmail } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState<unknown>(null);
  const [invalidCode, setInvalidCode] = useState(false);
  const [locked, setLocked] = useState(false);

  const form = useForm<VerifyEmailOtpInput>({
    resolver: zodResolver(verifyEmailSchema),
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return null;
  }

  const onSubmit = form.handleSubmit(async ({ code }) => {
    setInvalidCode(false);
    setAuthError(null);
    try {
      const nextAction = await verifyEmail(code);
      // Admin-created accounts still owe a password change after verifying their
      // email; send them there. Everyone else is now fully set up. The success
      // toast is fired on the destination page (see NoticeToaster) so it isn't
      // dropped by the redirect.
      router.replace(
        nextAction === "ChangePassword"
          ? "/change-password?notice=email-verified"
          : "/dashboard?notice=account-ready",
      );
    } catch (error) {
      const problemStatus = isApiError(error)
        ? normalizeVerifyEmailOtpStatus(
            (error.problem as { status?: unknown }).status,
          )
        : undefined;

      if (isApiError(error) && error.status === 400 && problemStatus === "InvalidCode") {
        setInvalidCode(true);
      } else if (
        isApiError(error) &&
        error.status === 429 &&
        problemStatus === "MaxAttemptsLocked"
      ) {
        setLocked(true);
      } else {
        setAuthError(error);
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Verify your email
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the {OTP_CODE_LENGTH}-digit code we sent to your email.
        </p>
      </div>

      {invalidCode ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          The code is incorrect. Please try again.
        </div>
      ) : null}

      {locked ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          Too many incorrect attempts. You are locked out — please try again
          later.
        </div>
      ) : null}

      <ServerErrorBanner error={authError} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormTextInput
            name="code"
            label="Verification code"
            autoComplete="one-time-code"
            placeholder="123456"
          />
          <SubmitButton isSubmitting={form.formState.isSubmitting} disabled={locked}>
            Verify
          </SubmitButton>
        </form>
      </FormProvider>
    </div>
  );
}