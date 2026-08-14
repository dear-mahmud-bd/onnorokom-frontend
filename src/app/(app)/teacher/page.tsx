"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { teacherTeachingAssignments } from "@/lib/api/graphql";
import { sessionTokenProvider } from "@/lib/api/token";
import { ServerErrorBanner } from "@/components/auth/ServerErrorBanner";
import type { TeacherSubjectClassAssignmentResponse } from "@/types";

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
  const [teaching, setTeaching] = useState<
    TeacherSubjectClassAssignmentResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await teacherTeachingAssignments(sessionTokenProvider);
        if (active) {
          setTeaching(rows);
        }
      } catch (error) {
        if (active) {
          setLoadError(error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // The admin assigns subject–class pairs; a class may host more than one of
  // the teacher's subjects, so count distinct classes for the headline stat.
  const classCount = useMemo(
    () => new Set(teaching.map((t) => t.classId)).size,
    [teaching],
  );
  const subjectPairCount = teaching.length;
  const hasAssignments = classCount > 0;

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

      <ServerErrorBanner error={loadError} />

      {loading ? (
        <p className="text-sm text-muted">Loading your classes…</p>
      ) : hasAssignments ? (
        <section
          aria-label="Your teaching assignments"
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5">
            <span className="font-display text-3xl font-semibold text-foreground">
              {classCount}
            </span>
            <span className="text-sm text-muted">
              {classCount === 1 ? "class" : "classes"} assigned to you by the
              admin
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5">
            <span className="font-display text-3xl font-semibold text-foreground">
              {subjectPairCount}
            </span>
            <span className="text-sm text-muted">
              subject–class {subjectPairCount === 1 ? "pair" : "pairs"} you can
              create assignments for
            </span>
          </div>
        </section>
      ) : (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        >
          <span className="font-medium">No classes assigned yet</span>
          <span>
            The admin has not assigned you to any subject–class yet. Once a class
            is assigned, it will appear here and you can start creating
            assignments. Please contact your admin.
          </span>
        </div>
      )}

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
