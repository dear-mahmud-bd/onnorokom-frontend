"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/teacher",
    label: "Overview",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: "/teacher/assignments",
    label: "Assignments",
    icon: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/teacher") {
    return pathname === "/teacher";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Teacher sections" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${
                active ? "text-accent" : "text-muted group-hover:text-foreground"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full"
              >
                {item.icon}
              </svg>
            </span>
            <span className="truncate">{item.label}</span>
            {active ? (
              <span
                aria-hidden
                className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
