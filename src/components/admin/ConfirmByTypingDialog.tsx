"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

interface ConfirmByTypingDialogProps {
  title: string;
  message: string;
  // The admin must type this word (case-insensitive) to enable confirm.
  confirmWord?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A confirm dialog that gates its action behind typing a keyword — used before
 * revealing one-time credentials so the admin has to deliberately acknowledge
 * the message first. The parent conditionally mounts this (rather than passing
 * an `open` prop) so the input resets every time it opens.
 */
export function ConfirmByTypingDialog({
  title,
  message,
  confirmWord = "confirm",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmByTypingDialogProps) {
  // Portals need the DOM; render nothing until hydrated on the client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [value, setValue] = useState("");

  if (!mounted) {
    return null;
  }

  const matches = value.trim().toLowerCase() === confirmWord.toLowerCase();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-typing-title"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <h2
            id="confirm-typing-title"
            className="font-display text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          <p className="text-sm text-muted">{message}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm-typing-input"
            className="text-sm font-medium text-foreground"
          >
            Type <span className="font-mono text-accent">{confirmWord}</span> to
            continue
          </label>
          <input
            id="confirm-typing-input"
            type="text"
            autoComplete="off"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches) {
                onConfirm();
              }
            }}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-accent"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches}
            className="flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
