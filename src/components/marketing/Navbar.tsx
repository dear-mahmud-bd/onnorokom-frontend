"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/marketing/Logo";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-surface-muted text-foreground"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { status } = useAuth();
  const authed = status === "authenticated";
  const authAction = authed
    ? { href: "/dashboard", label: "Dashboard" }
    : { href: "/login", label: "Log in" };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={authAction.href}
            className="flex h-9 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            {authAction.label}
          </Link>
        </div>
      </div>
      <nav
        aria-label="Primary"
        className="flex items-center gap-1 overflow-x-auto px-6 pb-3 md:hidden"
      >
        <NavLinks pathname={pathname} />
      </nav>
    </header>
  );
}
