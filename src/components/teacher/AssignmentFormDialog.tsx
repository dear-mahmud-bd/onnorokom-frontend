"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { isApiError } from "@/lib/api/client";
import { assignmentSchema, type AssignmentInput } from "@/lib/validation";
import type { AssignmentResponse, SubjectResponse } from "@/types";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface AssignmentFormDialogProps {
  mode: "create" | "edit";
  initialValue?: AssignmentResponse | null;
  classId: string;
  className: string;
  subjects: SubjectResponse[];
  onSubmit: (values: AssignmentInput) => Promise<void>;
  onCancel: () => void;
}

const controlClassName =
  "rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

// Convert an ISO instant to the local "YYYY-MM-DDTHH:mm" a datetime-local
// input expects (it has no timezone and shows local wall-clock time).
function isoToDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Rendered only while active (mounted per open), so useForm defaultValues pick
// up the current target and local state resets between opens.
export function AssignmentFormDialog({
  mode,
  initialValue,
  classId,
  className,
  subjects,
  onSubmit,
  onCancel,
}: AssignmentFormDialogProps) {
  const [serverError, setServerError] = useState<unknown>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: initialValue?.title ?? "",
      description: initialValue?.description ?? "",
      subjectId: initialValue?.subjectId ?? "",
      classId: initialValue?.classId ?? classId,
      deadline: initialValue ? isoToDatetimeLocal(initialValue.deadline) : "",
      maxMarks: initialValue?.maxMarks ?? undefined,
      allowResubmissionUntilDeadline:
        initialValue?.allowResubmissionUntilDeadline ?? false,
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const subjectOptions = subjects.map((s) => ({
    label: `${s.name} (${s.code})`,
    value: s.id,
  }));

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    setFormMessage(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (isApiError(error)) {
        // Create: teacher is not assigned to this subject in this class.
        if (
          error.status === 403 &&
          error.problem.errorCode === "NotTeachingSubjectClass"
        ) {
          form.setError("subjectId", {
            message: "You don't teach this subject in this class.",
          });
          return;
        }
        // Update: assignment is Closed and can no longer be edited.
        if (error.status === 422 && error.problem.errorCode === "Closed") {
          setFormMessage(
            "This assignment is closed and can no longer be edited.",
          );
          return;
        }
        // Update: not the owning teacher.
        if (error.status === 403) {
          setFormMessage("You can only edit your own assignments.");
          return;
        }
        // Either verb: server-side validation failure.
        if (
          error.status === 422 &&
          error.problem.errorCode === "ValidationFailed"
        ) {
          setFormMessage("Please check the assignment details and try again.");
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
      aria-labelledby="assignment-dialog-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="assignment-dialog-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          {mode === "create" ? "New assignment" : "Edit assignment"}
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
            {/* Class is fixed to the one selected on the screen. */}
            <input type="hidden" {...register("classId")} />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Class</span>
              <span className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-muted">
                {className}
              </span>
            </div>

            <AdminField
              name="title"
              label="Title"
              placeholder="Chapter 3 problem set"
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="What students need to do…"
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                className={controlClassName}
                {...register("description")}
              />
              {errors.description ? (
                <p
                  id="description-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <AdminField
              name="subjectId"
              label="Subject"
              variant="select"
              placeholder="Select a subject"
              options={subjectOptions}
            />

            <AdminField
              name="deadline"
              label="Deadline"
              type="datetime-local"
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="maxMarks"
                className="text-sm font-medium text-foreground"
              >
                Max marks
              </label>
              <input
                id="maxMarks"
                type="number"
                min={0}
                step="0.5"
                placeholder="100"
                aria-invalid={errors.maxMarks ? true : undefined}
                aria-describedby={errors.maxMarks ? "maxMarks-error" : undefined}
                className={controlClassName}
                {...register("maxMarks", { valueAsNumber: true })}
              />
              {errors.maxMarks ? (
                <p
                  id="maxMarks-error"
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errors.maxMarks.message}
                </p>
              ) : null}
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent/20"
                {...register("allowResubmissionUntilDeadline")}
              />
              Allow resubmission until the deadline
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <div className="w-32">
                <SubmitButton isSubmitting={isSubmitting}>
                  {mode === "create" ? "Create" : "Save"}
                </SubmitButton>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
