import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about accounts, sign-in, assignments, and submissions.",
};

const FAQ_GROUPS: {
  title: string;
  items: { question: string; answer: string }[];
}[] = [
  {
    title: "Accounts & sign-in",
    items: [
      {
        question: "How do I get an account?",
        answer:
          "Accounts are created by your school administrator — there is no public sign-up. Once an admin provisions your account, you'll receive the details needed to sign in.",
      },
      {
        question: "What happens the first time I sign in?",
        answer:
          "You'll verify your email with a one-time code, then set your own password before continuing. After that, you sign in normally.",
      },
      {
        question: "I forgot my password. What do I do?",
        answer:
          "Password changes and resets are handled through your administrator. Contact them to have your access restored.",
      },
      {
        question: "Where do I sign in?",
        answer:
          "Use the Sign in button in the top navigation, or go straight to the login page.",
      },
    ],
  },
  {
    title: "Assignments & submissions",
    items: [
      {
        question: "How are the roles different?",
        answer:
          "Admins provision accounts and manage classes, subjects, and enrollments. Teachers create and grade assignments for their classes. Students submit work and view their grades. Each role only sees what it needs.",
      },
      {
        question: "Can I submit after the deadline?",
        answer:
          "No — once an assignment's deadline passes, submissions are locked. Submit before the deadline to be sure your work is counted.",
      },
      {
        question: "Can I resubmit my work?",
        answer:
          "Resubmission is allowed while the assignment permits it and the deadline hasn't passed. Otherwise your latest on-time submission stands.",
      },
      {
        question: "When will I see my grade?",
        answer:
          "Grades appear as soon as your teacher records them, along with any status changes on your submission.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col">
      {/* Intro */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-12 pt-20 sm:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
            FAQ
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted">
            Quick answers about accounts, sign-in, and how assignments and
            submissions work.
          </p>
        </div>
      </section>

      {/* Q&A groups */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-16">
        <div className="flex flex-col gap-12">
          {FAQ_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {group.title}
              </h2>
              <div className="flex flex-col gap-3">
                {group.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-lg border border-border bg-surface px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
                      {item.question}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Still stuck?
            </h2>
            <p className="text-sm text-muted">
              Reach out to support or sign in to get back to work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/contact"
              className="flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Contact us
            </Link>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
