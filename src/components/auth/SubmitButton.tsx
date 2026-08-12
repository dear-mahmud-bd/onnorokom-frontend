import type { ReactNode } from "react";

interface SubmitButtonProps {
  isSubmitting?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function SubmitButton({
  isSubmitting = false,
  disabled = false,
  children,
}: SubmitButtonProps) {
  const inactive = disabled || isSubmitting;

  return (
    <button
      type="submit"
      disabled={inactive}
      aria-busy={isSubmitting}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/40 border-t-accent-foreground" />
      ) : null}
      {isSubmitting ? "Submitting…" : children}
    </button>
  );
}