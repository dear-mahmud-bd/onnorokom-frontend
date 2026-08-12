"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { isApiError } from "@/lib/api/client";
import { gradeSchema, type GradeInput } from "@/lib/validation";
import type { SubmissionResponse } from "@/types";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface GradeDialogProps {
  submission: SubmissionResponse;
  maxMarks: number;
  onSubmit: (values: GradeInput) => Promise<void>;
  onCancel: () => void;
}

const controlClassName =
  "rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

// Rendered only while active (mounted per open), so useForm defaultValues pick
// up the current submission and local state resets between opens.
export function GradeDialog({
  submission,
  maxMarks,
  onSubmit,
  onCancel,
}: GradeDialogProps) {
  const [serverError, setServerError] = useState<unknown>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // The max-marks bound is per-assignment, so it can't live in the static
  // gradeSchema — refine on top of it for this submission.
  const schema = useMemo(
    () =>
      gradeSchema.refine((v) => v.marks <= maxMarks, {
        path: ["marks"],
        message: `Marks cannot exceed ${maxMarks}`,
      }),
    [maxMarks],
  );

  const form = useForm<GradeInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: submission.marks ?? undefined,
      feedback: submission.feedback ?? "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    setFormMessage(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (isApiError(error)) {
        if (
          error.status === 422 &&
          error.problem.errorCode === "MarksOutOfRange"
        ) {
          form.setError("marks", {
            message: `Marks must be between 0 and ${maxMarks}.`,
          });
          return;
        }
        if (error.status === 403) {
          setFormMessage(
            "You can only grade submissions for your own assignments.",
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
      aria-labelledby="grade-dialog-title"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="grade-dialog-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          Grade submission
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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="marks"
                className="text-sm font-medium text-foreground"
              >
                Marks (out of {maxMarks})
              </label>
              <input
                id="marks"
                type="number"
                min={0}
                max={maxMarks}
                step="0.5"
                aria-invalid={errors.marks ? true : undefined}
                aria-describedby={errors.marks ? "marks-error" : undefined}
                className={controlClassName}
                {...register("marks", { valueAsNumber: true })}
              />
              {errors.marks ? (
                <p
                  id="marks-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.marks.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="feedback"
                className="text-sm font-medium text-foreground"
              >
                Feedback <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="feedback"
                rows={4}
                placeholder="Notes for the student…"
                aria-invalid={errors.feedback ? true : undefined}
                aria-describedby={errors.feedback ? "feedback-error" : undefined}
                className={controlClassName}
                {...register("feedback")}
              />
              {errors.feedback ? (
                <p
                  id="feedback-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.feedback.message}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <div className="w-32">
                <SubmitButton isSubmitting={isSubmitting}>Save</SubmitButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
