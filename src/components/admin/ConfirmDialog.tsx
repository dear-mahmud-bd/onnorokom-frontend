"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" (default) styles the confirm button red for destructive actions;
  // "primary" uses the accent color for non-destructive ones (e.g. publish).
  tone?: "danger" | "primary";
  // While busy, both buttons are disabled and the confirm button shows busyLabel
  // (falls back to confirmLabel) — used to signal an in-flight async action.
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  busyLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Portals need the DOM; render nothing until hydrated on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <h2
            id="confirm-dialog-title"
            className="font-display text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          <p className="text-sm text-muted">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
              tone === "primary"
                ? "bg-accent text-accent-foreground"
                : "bg-red-600 text-white"
            }`}
          >
            {busy ? (busyLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
