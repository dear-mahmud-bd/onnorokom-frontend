"use client";

import { useFormContext } from "react-hook-form";
import type { HTMLInputTypeAttribute } from "react";

interface FormTextInputProps {
  name: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  placeholder?: string;
}

export function FormTextInput({
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
}: FormTextInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const errorMessage =
    typeof (errors[name] as { message?: string } | undefined)?.message ===
    "string"
      ? (errors[name] as { message?: string }).message
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? `${name}-error` : undefined}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-950/5 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-white/10"
        {...register(name)}
      />
      {errorMessage ? (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}