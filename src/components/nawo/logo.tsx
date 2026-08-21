import { Link } from "@tanstack/react-router";

export function NawoLogo({ to = "/", subtitle }: { to?: string; subtitle?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span className="bg-brand grid size-9 place-items-center rounded-xl text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
        <span className="text-[15px] font-extrabold tracking-tight">N</span>
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight">NAWO</span>
        {subtitle ? (
          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
