"use client";

import { useFormContext } from "react-hook-form";
import type { HTMLInputTypeAttribute } from "react";

export interface AdminFieldOption {
  label: string;
  value: string | number;
}

interface AdminFieldBaseProps {
  name: string;
  label: string;
  placeholder?: string;
}

interface AdminInputFieldProps extends AdminFieldBaseProps {
  variant?: "input";
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
}

interface AdminSelectFieldProps extends AdminFieldBaseProps {
  variant: "select";
  options: AdminFieldOption[];
  valueAsNumber?: boolean;
}

type AdminFieldProps = AdminInputFieldProps | AdminSelectFieldProps;

const controlClassName =
  "rounded-lg border border-border bg-surface px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20";

export function AdminField(props: AdminFieldProps) {
  const { name, label, placeholder } = props;
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const errorMessage =
    typeof (errors[name] as { message?: string } | undefined)?.message ===
    "string"
      ? (errors[name] as { message?: string }).message
      : undefined;

  const describedBy = errorMessage ? `${name}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {props.variant === "select" ? (
        <select
          id={name}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={describedBy}
          className={controlClassName}
          {...register(name, { valueAsNumber: props.valueAsNumber })}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {props.options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={props.type ?? "text"}
          autoComplete={props.autoComplete}
          placeholder={placeholder}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={describedBy}
          className={controlClassName}
          {...register(name)}
        />
      )}
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
