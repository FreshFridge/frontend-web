import type { ReactNode } from "react";

type SectionHeaderProps = {
  actions?: ReactNode;
  subtitle?: string;
  title: string;
};

function SectionHeader({ actions, subtitle, title }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  );
}

export default SectionHeader;
