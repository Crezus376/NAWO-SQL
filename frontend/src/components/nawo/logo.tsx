import { Link } from "@tanstack/react-router";

export function NawoLogo({
  to = "/",
  subtitle,
  inverted = false,
}: {
  to?: string;
  subtitle?: string | undefined;
  inverted?: boolean;
}) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <img
        src="/nawo-mark.png"
        alt=""
        aria-hidden="true"
        className="size-9 object-contain transition-transform group-hover:scale-105"
      />
      <span className="leading-none">
        <span
          className={`block text-lg font-extrabold tracking-tight ${inverted ? "text-primary-foreground" : ""}`}
        >
          NAWO
        </span>
        {subtitle ? (
          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
