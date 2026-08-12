"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { listClasses } from "@/lib/api/classes";
import { listSubjects } from "@/lib/api/subjects";
import { listTeacherAssignments } from "@/lib/api/teacherAssignments";
import { listEnrollments } from "@/lib/api/enrollments";
import { sessionTokenProvider } from "@/lib/api/token";

interface Metric {
  key: "classes" | "subjects" | "assignments" | "enrollments";
  href: string;
  label: string;
  hint: string;
  icon: ReactNode;
}

const METRICS: Metric[] = [
  {
    key: "classes",
    href: "/admin/classes",
    label: "Classes",
    hint: "Grade-level groups",
    icon: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </>
    ),
  },
  {
    key: "subjects",
    href: "/admin/subjects",
    label: "Subjects",
    hint: "Catalog entries",
    icon: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
  },
  {
    key: "assignments",
    href: "/admin/teacher-assignments",
    label: "Assignments",
    hint: "Teacher · subject · class",
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
  {
    key: "enrollments",
    href: "/admin/enrollments",
    label: "Enrollments",
    hint: "Students in classes",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M12 18v-6M9 15h6" />
      </>
    ),
  },
];

const QUICK_ACTIONS: { href: string; label: string; description: string }[] = [
  {
    href: "/admin/users",
    label: "Provision a user",
    description: "Create a teacher or student account.",
  },
  {
    href: "/admin/classes",
    label: "Add a class",
    description: "Set up a new grade-level class.",
  },
  {
    href: "/admin/teacher-assignments",
    label: "Assign a teacher",
    description: "Link a teacher to a subject and class.",
  },
  {
    href: "/admin/enrollments",
    label: "Enroll a student",
    description: "Place a student into a class.",
  },
];

type Counts = Record<Metric["key"], number | null>;

const INITIAL_COUNTS: Counts = {
  classes: null,
  subjects: null,
  assignments: null,
  enrollments: null,
};

export function AdminOverview() {
  const [counts, setCounts] = useState<Counts>(INITIAL_COUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [classes, subjects, assignments, enrollments] =
        await Promise.allSettled([
          listClasses(sessionTokenProvider),
          listSubjects(sessionTokenProvider),
          listTeacherAssignments(undefined, sessionTokenProvider),
          listEnrollments({}, sessionTokenProvider),
        ]);
      if (!active) {
        return;
      }
      const len = (r: PromiseSettledResult<unknown[]>) =>
        r.status === "fulfilled" ? r.value.length : null;
      setCounts({
        classes: len(classes),
        subjects: len(subjects),
        assignments: len(assignments),
        enrollments: len(enrollments),
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Admin console
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="max-w-xl text-sm text-muted">
          Manage users, the class and subject catalog, teacher assignments, and
          student enrollments from one place.
        </p>
      </header>

      <section aria-label="Key metrics">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <Link
              key={metric.key}
              href={metric.href}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
            >
              <div
                aria-hidden
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/5 transition-colors group-hover:bg-accent/10"
              />
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-5 w-5"
                >
                  {metric.icon}
                </svg>
              </span>
              <div className="flex flex-col gap-1">
                {loading ? (
                  <span className="h-9 w-12 animate-pulse rounded-md bg-surface-muted" />
                ) : (
                  <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
                    {counts[metric.key] ?? "—"}
                  </span>
                )}
                <span className="text-sm font-medium text-foreground">
                  {metric.label}
                </span>
                <span className="text-xs text-muted">{metric.hint}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Quick actions" className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-surface-muted"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {action.label}
                </span>
                <span className="text-sm text-muted">{action.description}</span>
              </span>
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
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
          ))}
        </div>
      </section>
    </div>
  );
}
