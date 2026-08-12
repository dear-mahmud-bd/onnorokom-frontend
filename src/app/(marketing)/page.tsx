import Link from "next/link";
import type { ReactNode } from "react";

const FEATURES: { title: string; description: string; icon: ReactNode }[] = [
  {
    title: "Assignments",
    description:
      "Teachers create, publish, and manage assignments with deadlines for their subjects and classes.",
    icon: (
      <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM14 4v5h5M8 13h8M8 17h5" />
    ),
  },
  {
    title: "Submissions",
    description:
      "Students submit work before the deadline; late attempts are locked automatically, with resubmission where allowed.",
    icon: (
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    ),
  },
  {
    title: "Grading",
    description:
      "Teachers grade submissions and move them through review states — students see results as they land.",
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  {
    title: "Role-based access",
    description:
      "Admins, teachers, and students each see exactly what they should — enforced end to end.",
    icon: (
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4zM9.5 12l1.8 1.8L15 10" />
    ),
  },
  {
    title: "Real-time notifications",
    description:
      "New assignments and grades push to the right people the moment they happen.",
    icon: (
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    ),
  },
  {
    title: "Search",
    description:
      "Find assignments fast with full-text search across titles and details.",
    icon: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" />,
  },
];

const STEPS: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Admin provisions accounts",
    description:
      "There is no self sign-up — an admin creates each teacher and student account.",
  },
  {
    step: "02",
    title: "Verify & set a password",
    description:
      "New users confirm their email with a one-time code and set their own password on first sign-in.",
  },
  {
    step: "03",
    title: "Teach, submit, grade",
    description:
      "Teachers publish assignments, students submit before the deadline, and teachers grade the results.",
  },
];

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted text-accent">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        {children}
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pt-28">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
            For schools
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            Assignments, submissions, and grading —{" "}
            <span className="text-accent">in one place.</span>
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted">
            A role-based platform where admins run the school, teachers set and
            grade work, and students submit before the deadline. Fast, clear,
            and built for how classrooms actually work.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/about"
              className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="max-w-2xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Everything a class needs, end to end
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-6"
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-6 text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How it works
          </h2>
          <p className="max-w-xl text-sm text-muted">
            Accounts are admin-provisioned and secured from the first sign-in.{" "}
            <Link
              href="/about"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Read more about the roles
            </Link>
            .
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="flex flex-col gap-2">
              <span className="font-display text-3xl font-semibold text-accent">
                {item.step}
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-6 text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ready to pick up where you left off?
            </h2>
            <p className="text-sm text-muted">
              Sign in with the account your administrator provided.
            </p>
          </div>
          <Link
            href="/login"
            className="flex h-11 shrink-0 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
