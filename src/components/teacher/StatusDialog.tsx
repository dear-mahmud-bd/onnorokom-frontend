"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { isApiError } from "@/lib/api/client";
import { statusSchema, type StatusInput } from "@/lib/validation";
import {
  SUBMISSION_STATUS_LABEL,
  SubmissionStatus,
  type SubmissionResponse,
} from "@/types";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface StatusDialogProps {
  submission: SubmissionResponse;
  onSubmit: (newStatus: SubmissionStatus) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS = Object.values(SubmissionStatus).map((value) => ({
  label: SUBMISSION_STATUS_LABEL[value],
  value,
}));

// Rendered only while active (mounted per open), so useForm defaultValues pick
// up the current submission and local state resets between opens.
export function StatusDialog({
  submission,
  onSubmit,
  onCancel,
}: StatusDialogProps) {
  const [serverError, setServerError] = useState<unknown>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const form = useForm<StatusInput>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      newStatus: submission.status,
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    setFormMessage(null);
    try {
      await onSubmit(values.newStatus);
    } catch (error) {
      if (isApiError(error)) {
        if (
          error.status === 409 &&
          error.problem.errorCode === "InvalidTransition"
        ) {
          setFormMessage(
            "That status change isn't allowed from the current status.",
          );
          return;
        }
        if (error.status === 403) {
          setFormMessage(
            "You can only change submissions for your own assignments.",
          );
          return;
        }
      }
      setServerError(error);
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-dialog-title"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="status-dialog-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          Change status
        </h2>

        <ServerErrorBanner error={serverError} />

        {formMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {formMessage}
          </div>
        ) : null}

        <FormProvider {...form}>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <AdminField
              name="newStatus"
              label="New status"
              variant="select"
              options={STATUS_OPTIONS}
              valueAsNumber
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <div className="w-32">
                <SubmitButton isSubmitting={form.formState.isSubmitting}>
                  Update
                </SubmitButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
