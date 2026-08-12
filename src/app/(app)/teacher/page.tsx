import Link from "next/link";

const STEPS: { title: string; description: string }[] = [
  {
    title: "Pick a class",
    description:
      "Choose one of the classes you teach to see the assignments scoped to it.",
  },
  {
    title: "Create & publish",
    description:
      "Draft an assignment with a deadline and max marks, then publish it when it is ready for students.",
  },
  {
    title: "Grade submissions",
    description:
      "Open an assignment to review each student's submission, download files, and record marks and feedback.",
  },
];

export default function TeacherOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Teacher console
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="max-w-xl text-sm text-muted">
          Create and publish assignments for your classes, then review and grade
          the submissions your students turn in.
        </p>
      </header>

      <section aria-label="How it works" className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {step.title}
              </span>
              <span className="text-sm text-muted">{step.description}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Get started">
        <Link
          href="/teacher/assignments"
          className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-surface-muted"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              Go to assignments
            </span>
            <span className="text-sm text-muted">
              Manage assignments and grade submissions for your classes.
            </span>
          </span>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </section>
    </div>
  );
}
