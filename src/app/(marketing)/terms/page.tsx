import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern use of the assignment & submission management system.",
};

const LAST_UPDATED = "12 August 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-6 text-muted">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 sm:pt-24">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
          Legal
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="mt-12 flex flex-col gap-10">
        <p className="text-sm leading-6 text-muted">
          These terms govern your use of the assignment &amp; submission
          management system provided to your school. By using the platform, you
          agree to them.
        </p>

        <Section title="Accounts">
          <p>
            Accounts are provisioned by your school administrator. You are
            responsible for keeping your credentials confidential and for
            activity that occurs under your account.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Use the platform only for its intended educational purpose. Do not
            attempt to access data outside your role, disrupt the service, or
            misuse other users&apos; information.
          </p>
        </Section>

        <Section title="Your responsibilities">
          <p>
            Teachers are responsible for the assignments and grades they manage;
            students are responsible for the work they submit. Submit before
            deadlines — late attempts are locked automatically.
          </p>
        </Section>

        <Section title="Availability">
          <p>
            The service is provided on an &ldquo;as is&rdquo; basis. We aim for
            reliable availability but do not guarantee uninterrupted or
            error-free operation.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms from time to time. Material changes will be
            reflected here with an updated date above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Reach us through the{" "}
            <Link
              href="/contact"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              contact page
            </Link>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
