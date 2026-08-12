import Link from "next/link";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Onnorokom — home"
      className={`group inline-flex items-center gap-2.5 ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-lg font-semibold text-accent-foreground shadow-sm transition-transform group-hover:-rotate-3"
      >
        O
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">
        Onnorokom
      </span>
    </Link>
  );
}
