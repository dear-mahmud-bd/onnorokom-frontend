"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { isApiError } from "@/lib/api/client";
import { subjectSchema, type SubjectInput } from "@/lib/validation";
import type { SubjectResponse } from "@/types";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface SubjectFormDialogProps {
  mode: "create" | "edit";
  initialValue?: SubjectResponse | null;
  onSubmit: (values: SubjectInput) => Promise<void>;
  onCancel: () => void;
}

// Rendered only while active (mounted per open), so useForm defaultValues
// pick up the current target and local state resets between opens.
export function SubjectFormDialog({
  mode,
  initialValue,
  onSubmit,
  onCancel,
}: SubjectFormDialogProps) {
  const [serverError, setServerError] = useState<unknown>(null);
  const form = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialValue?.name ?? "",
      code: initialValue?.code ?? "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (
        isApiError(error) &&
        error.status === 409 &&
        error.problem.errorCode === "DuplicateCode"
      ) {
        form.setError("code", {
          message: "A subject with this code already exists.",
        });
        return;
      }
      setServerError(error);
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-dialog-title"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="subject-dialog-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          {mode === "create" ? "New subject" : "Edit subject"}
        </h2>

        <ServerErrorBanner error={serverError} />

        <FormProvider {...form}>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <AdminField name="name" label="Name" placeholder="Mathematics" />
            <AdminField name="code" label="Code" placeholder="MATH-101" />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <div className="w-32">
                <SubmitButton isSubmitting={form.formState.isSubmitting}>
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
