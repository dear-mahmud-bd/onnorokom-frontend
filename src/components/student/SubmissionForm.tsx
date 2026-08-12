"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { submitAssignment, updateSubmission } from "@/lib/api/submissions";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import { submissionFileSchema } from "@/lib/validation";
import { setStoredSubmissionId } from "@/lib/student/submissionStore";
import type { SubmissionResponse } from "@/types";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ALLOWED_SUBMISSION_EXTENSIONS } from "@/lib/validation";

const formSchema = z.object({ file: submissionFileSchema });
type FormValues = z.infer<typeof formSchema>;

interface SubmissionFormProps {
  mode: "submit" | "resubmit";
  assignmentId: string;
  submissionId?: string;
  onSuccess: (submission: SubmissionResponse) => void;
}

const controlClassName =
  "block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors file:mr-3 file:rounded-full file:border-0 file:bg-accent/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-accent focus:border-accent focus:ring-2 focus:ring-accent/20";

// Maps a submit/resubmit ApiError to an actionable message, or null when the
// caller should fall back to a generic server-error banner.
function messageForError(error: unknown): string | null {
  if (!isApiError(error)) {
    return null;
  }
  switch (error.problem.errorCode) {
    case "NotFound":
      return "This assignment could not be found.";
    case "NotPublished":
      return "This assignment isn't open for submissions yet.";
    case "Closed":
      return "This assignment is closed and no longer accepts submissions.";
    case "NotEnrolled":
      return "You're not enrolled in this assignment's class.";
    case "AlreadySubmitted":
      return "You've already submitted — reload the page to see it.";
    case "NotOwner":
      return "This submission doesn't belong to you.";
    case "ResubmissionNotAllowed":
      return "Resubmission isn't allowed for this assignment.";
    case "DeadlinePassed":
      return "The deadline has passed, so you can't resubmit.";
    case "ValidationFailed":
      return "Please choose a valid file and try again.";
    default:
      return error.status === 403 ? "You can't submit to this assignment." : null;
  }
}

export function SubmissionForm({
  mode,
  assignmentId,
  submissionId,
  onSuccess,
}: SubmissionFormProps) {
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const [hasFile, setHasFile] = useState(false);

  const {
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = handleSubmit(async ({ file }) => {
    setFormMessage(null);
    try {
      const response =
        mode === "resubmit" && submissionId
          ? await updateSubmission(submissionId, file, sessionTokenProvider)
          : await submitAssignment(assignmentId, file, sessionTokenProvider);
      setStoredSubmissionId(assignmentId, response.id);
      onSuccess(response);
    } catch (error) {
      // File-type/size rejections from the server map to the file field.
      if (
        isApiError(error) &&
        error.status === 422 &&
        (error.problem.errorCode === "NotAcceptedFileType" ||
          error.problem.errorCode === "FileTooLarge")
      ) {
        setError("file", {
          message:
            error.problem.errorCode === "FileTooLarge"
              ? "That file is too large."
              : "That file type is not accepted.",
        });
        return;
      }
      const message = messageForError(error);
      setFormMessage(message ?? "Could not upload the file. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {formMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-sm font-medium text-foreground">
          {mode === "resubmit" ? "Replacement file" : "Your file"}
        </label>
        <input
          id="file"
          type="file"
          accept={ALLOWED_SUBMISSION_EXTENSIONS.join(",")}
          aria-invalid={errors.file ? true : undefined}
          aria-describedby={errors.file ? "file-error" : undefined}
          className={controlClassName}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setHasFile(!!file);
            setValue("file", file as File, { shouldValidate: true });
          }}
        />
        <p className="text-xs text-muted">
          Accepted: {ALLOWED_SUBMISSION_EXTENSIONS.join(", ")} · up to 10 MB.
        </p>
        {errors.file ? (
          <p
            id="file-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.file.message}
          </p>
        ) : null}
      </div>

      <div className="w-44">
        <SubmitButton isSubmitting={isSubmitting} disabled={!hasFile}>
          {mode === "resubmit" ? "Resubmit" : "Submit"}
        </SubmitButton>
      </div>
    </form>
  );
}
