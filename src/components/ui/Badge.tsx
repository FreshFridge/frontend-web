import type { ReactNode } from "react";

export type BadgeTone =
  | "success"
  | "warning"
  | "risk"
  | "danger"
  | "primary"
  | "muted";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

function Badge({ children, tone = "muted" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default Badge;
