import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with support, or contact your school administrator for account access.",
};

// NOTE: There is no contact-form / message backend endpoint. This page
// intentionally uses a static mailto: link instead of stubbing a fake form
// POST. An interactive contact form would require a backend endpoint.

const SUPPORT_EMAIL = "support@onnorokom.example";

const CHANNELS: {
  title: string;
  description: string;
  action: { label: string; href: string };
}[] = [
  {
    title: "Email support",
    description:
      "Questions about the platform, bugs, or general help — email the support team and we'll get back to you.",
    action: { label: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
  },
  {
    title: "Account access",
    description:
      "Accounts are created by your school administrator. For a new account, a password reset, or role changes, contact your administrator directly.",
    action: { label: "Read the FAQ", href: "/faq" },
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col">
      {/* Intro */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-20 sm:pt-24">
        <div className="flex max-w-3xl flex-col gap-6">
          <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
            Contact
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Get in touch
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted">
            We&apos;re happy to help. Reach the support team by email, or contact
            your administrator for anything account-related.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2">
          {CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-6"
            >
              <h2 className="text-base font-semibold text-foreground">
                {channel.title}
              </h2>
              <p className="text-sm leading-6 text-muted">
                {channel.description}
              </p>
              {channel.action.href.startsWith("mailto:") ? (
                <a
                  href={channel.action.href}
                  className="mt-1 w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {channel.action.label}
                </a>
              ) : (
                <Link
                  href={channel.action.href}
                  className="mt-1 w-fit text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  {channel.action.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ pointer */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Looking for a quick answer?
          </h2>
          <p className="text-sm text-muted">
            Many common questions are already answered in the FAQ.
          </p>
        </div>
        <Link
          href="/faq"
          className="flex h-11 shrink-0 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Read the FAQ
        </Link>
      </section>
    </div>
  );
}
