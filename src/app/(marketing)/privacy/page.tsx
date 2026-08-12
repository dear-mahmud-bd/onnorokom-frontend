import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How the assignment & submission management system collects, uses, and protects data.",
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

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-20 pt-20 sm:pt-24">
      <div className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
          Legal
        </span>
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="mt-12 flex flex-col gap-10">
        <p className="text-sm leading-6 text-muted">
          This policy explains what information the assignment &amp; submission
          management system collects, how it is used, and the choices available
          to you. It applies to the platform provided to your school.
        </p>

        <Section title="Information we collect">
          <p>
            We process the data needed to operate the platform: account and
            profile details (name, email, role), the classes and subjects you
            are associated with, assignments and submissions you create, and
            activity logs generated as you use the system.
          </p>
        </Section>

        <Section title="How we use information">
          <p>
            Information is used to provide core functionality — authenticating
            users, showing the right assignments and submissions for your role,
            recording grades, sending notifications, and keeping the service
            secure and reliable.
          </p>
        </Section>

        <Section title="Accounts & access">
          <p>
            Accounts are created by your school administrator; there is no public
            sign-up. Access to data is scoped by role — admins, teachers, and
            students each see only what their role permits.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Data is retained for as long as your account is active or as needed
            to provide the service, and may be removed at the direction of your
            school administrator or in line with applicable requirements.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We take reasonable measures to protect data, including access
            controls, authentication, and activity logging. No system is
            perfectly secure, so we encourage keeping your credentials private.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy? Reach us through the{" "}
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
