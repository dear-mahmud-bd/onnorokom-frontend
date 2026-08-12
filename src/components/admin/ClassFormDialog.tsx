"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { isApiError } from "@/lib/api/client";
import { classSchema, type ClassInput } from "@/lib/validation";
import type { ClassResponse } from "@/types";
import { AdminField } from "@/components/admin/AdminField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

interface ClassFormDialogProps {
  mode: "create" | "edit";
  initialValue?: ClassResponse | null;
  onSubmit: (values: ClassInput) => Promise<void>;
  onCancel: () => void;
}

// Rendered only while active (mounted per open), so useForm defaultValues
// pick up the current target and local state resets between opens.
export function ClassFormDialog({
  mode,
  initialValue,
  onSubmit,
  onCancel,
}: ClassFormDialogProps) {
  const [serverError, setServerError] = useState<unknown>(null);
  const form = useForm<ClassInput>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: initialValue?.name ?? "",
      gradeLevel: initialValue?.gradeLevel ?? "",
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
        error.problem.errorCode === "DuplicateName"
      ) {
        form.setError("name", {
          message: "A class with this name already exists.",
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
      aria-labelledby="class-dialog-title"
    >
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="class-dialog-title"
          className="font-display text-lg font-semibold text-foreground"
        >
          {mode === "create" ? "New class" : "Edit class"}
        </h2>

        <ServerErrorBanner error={serverError} />

        <FormProvider {...form}>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <AdminField name="name" label="Name" placeholder="Grade 5 - A" />
            <AdminField
              name="gradeLevel"
              label="Grade level"
              placeholder="5"
            />
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
