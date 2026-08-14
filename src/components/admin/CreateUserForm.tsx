"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { createUser } from "@/lib/api/users";
import { sessionTokenProvider } from "@/lib/api/token";
import { isApiError } from "@/lib/api/client";
import { createUserSchema, type CreateUserInput } from "@/lib/validation";
import { AdminUserRole, UserRole, type CreateUserResponse } from "@/types";
import { AdminField } from "@/components/admin/AdminField";
import { ConfirmByTypingDialog } from "@/components/admin/ConfirmByTypingDialog";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";

const ROLE_OPTIONS = [
  { label: "Teacher", value: AdminUserRole.Teacher },
  { label: "Student", value: AdminUserRole.Student },
];

const ROLE_LABELS: Record<number, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Teacher]: "Teacher",
  [UserRole.Student]: "Student",
};

// One-time credentials (temp password / email OTP) are only returned by the
// create-user response, so surface them with a copy affordance — the admin has
// to hand them to the new user out-of-band.
function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure origin) — value is still visible.
    }
  };

  return (
    <span className="flex items-center gap-2">
      <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[13px] text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}

function ProvisionedCredentials({
  created,
  onDismiss,
}: {
  created: CreateUserResponse;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950"
    >
      <p className="font-medium text-emerald-800 dark:text-emerald-200">
        User provisioned
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-emerald-900 dark:text-emerald-100">
        <dt className="font-medium">User ID</dt>
        <dd>{created.userId}</dd>
        <dt className="font-medium">Email</dt>
        <dd>{created.email}</dd>
        <dt className="font-medium">Role</dt>
        <dd>{ROLE_LABELS[created.role] ?? created.role}</dd>
        <dt className="font-medium">Temporary password</dt>
        <dd>
          <CopyValue value={created.tempPassword} />
        </dd>
        <dt className="font-medium">Email OTP</dt>
        <dd>
          <CopyValue value={created.otpCode} />
        </dd>
        <dt className="font-medium">Must change password</dt>
        <dd>{created.mustChangePassword ? "Yes" : "No"}</dd>
        <dt className="font-medium">Email verified</dt>
        <dd>{created.isEmailVerified ? "Yes" : "No"}</dd>
        <dt className="font-medium">Active</dt>
        <dd>{created.isActive ? "Yes" : "No"}</dd>
      </dl>
      <p className="text-emerald-700 dark:text-emerald-300">
        Share the temporary password and email OTP with the user securely.
        They&apos;ll verify their email with the OTP (valid for 10 minutes), then
        set a new password on first sign-in. These values won&apos;t be shown
        again.
      </p>
      <div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function CreateUserForm({ onCreated }: { onCreated?: () => void } = {}) {
  const [created, setCreated] = useState<CreateUserResponse | null>(null);
  // Credentials stay hidden until the admin acknowledges the reveal gate.
  const [acknowledged, setAcknowledged] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [serverError, setServerError] = useState<unknown>(null);

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: AdminUserRole.Teacher,
    },
  });

  const dismissCredentials = () => {
    setCreated(null);
    setAcknowledged(false);
    setGateOpen(false);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const response = await createUser(values, sessionTokenProvider);
      // Hold the credentials but reveal them only after the admin passes the
      // acknowledgement gate below.
      setCreated(response);
      setAcknowledged(false);
      setGateOpen(true);
      form.reset();
      onCreated?.();
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        form.setError("email", {
          message: "A user with this email already exists.",
        });
        return;
      }
      if (isApiError(error) && error.status === 422) {
        form.setError("role", {
          message: "Only Teacher or Student accounts can be provisioned.",
        });
        return;
      }
      setServerError(error);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {created && acknowledged ? (
        <ProvisionedCredentials created={created} onDismiss={dismissCredentials} />
      ) : null}

      {created && !acknowledged && !gateOpen ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-border bg-surface-muted p-4 text-sm"
        >
          <p className="font-medium text-foreground">
            User created — credentials hidden
          </p>
          <p className="text-muted">
            The temporary password and email OTP are shown only once. Reveal them
            when you&apos;re ready to hand them over securely.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="text-xs font-medium text-accent underline-offset-2 hover:underline"
            >
              Reveal credentials
            </button>
            <button
              type="button"
              onClick={dismissCredentials}
              className="text-xs font-medium text-muted underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {created && !acknowledged && gateOpen ? (
        <ConfirmByTypingDialog
          title="Before you reveal the credentials"
          message={`This account (${created.email}) must verify its email and change its password within 10 minutes — the one-time code expires. The temporary password and OTP are shown only once, so share them securely.`}
          confirmWord="confirm"
          confirmLabel="Reveal credentials"
          onConfirm={() => {
            setAcknowledged(true);
            setGateOpen(false);
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}

      <ServerErrorBanner error={serverError} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <AdminField
            name="fullName"
            label="Full name"
            autoComplete="name"
            placeholder="Jane Doe"
          />
          <AdminField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="jane@school.com"
          />
          <AdminField
            name="role"
            label="Role"
            variant="select"
            valueAsNumber
            options={ROLE_OPTIONS}
          />
          <SubmitButton isSubmitting={form.formState.isSubmitting}>
            Create user
          </SubmitButton>
        </form>
      </FormProvider>
    </div>
  );
}
