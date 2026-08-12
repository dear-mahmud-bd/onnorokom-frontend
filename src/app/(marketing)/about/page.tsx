import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How the assignment & submission management system works, and the roles it serves — admins, teachers, and students.",
};

const STEPS: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Admin provisions accounts",
    description:
      "There is no self sign-up. An administrator creates each teacher and student account and sets up classes and subjects.",
  },
  {
    step: "02",
    title: "Verify email & set a password",
    description:
      "On first sign-in, new users confirm their email with a one-time code and choose their own password.",
  },
  {
    step: "03",
    title: "Teachers publish assignments",
    description:
      "Teachers create and publish assignments — with deadlines — for the subjects and classes they are assigned to.",
  },
  {
    step: "04",
    title: "Students submit",
    description:
      "Students submit their work before the deadline. Late attempts are locked, and resubmission is allowed where the assignment permits it.",
  },
  {
    step: "05",
    title: "Teachers grade",
    description:
      "Teachers grade submissions and move them through review states; students see results as they land.",
  },
];

const ROLES: { role: string; summary: string; points: string[] }[] = [
  {
    role: "Admin",
    summary: "Runs the school.",
    points: [
      "Provisions teacher and student accounts",
      "Manages classes and subjects",
      "Assigns teachers to subjects and classes",
      "Enrolls students into classes",
    ],
  },
  {
    role: "Teacher",
    summary: "Owns the coursework.",
    points: [
      "Creates and publishes assignments",
      "Sets deadlines and submission rules",
      "Grades submissions",
      "Tracks submission status",
    ],
  },
  {
    role: "Student",
    summary: "Does the work.",
    points: [
      "Sees assignments for their classes",
      "Submits before the deadline",
      "Resubmits where allowed",
      "Views grades and feedback",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Mission */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
            About
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Built for how classrooms actually work
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted">
            This is a role-based platform for managing assignments and
            submissions in a school. Admins run the setup, teachers own the
            coursework, and students submit and track their work — each with a
            view scoped to exactly what they need.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((item) => (
              <li key={item.step} className="flex flex-col gap-2">
                <span className="font-display text-3xl font-semibold text-accent">
                  {item.step}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Three roles, clear boundaries
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {ROLES.map((role) => (
            <div
              key={role.role}
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {role.role}
                </h3>
                <p className="text-sm text-muted">{role.summary}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {role.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm leading-6 text-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Have your account?
            </h2>
            <p className="text-sm text-muted">
              Sign in with the credentials your administrator provided, or check
              the FAQ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/faq"
              className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
