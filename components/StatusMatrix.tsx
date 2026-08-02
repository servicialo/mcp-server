import { MaturityBadge, type MaturityVariant } from "./MaturityBadge";

export interface StatusItem {
  label: string;
  sublabel?: string;
  href?: string;
}

export interface StatusColumn {
  key: string;
  title: string;
  badge: MaturityVariant;
  items: StatusItem[];
}

export function StatusMatrix({ columns }: { columns: StatusColumn[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 border border-border bg-surface divide-y lg:divide-y-0 lg:divide-x divide-border">
      {columns.map((col) => (
        <div key={col.key} className="p-4 md:p-5 lg:p-4">
          <div className="mb-3.5">
            <MaturityBadge maturity={col.badge} label={col.title} />
          </div>
          <ul className="space-y-3">
            {col.items.map((item) => (
              <li key={item.label} className="leading-snug">
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-[13px] text-text hover:text-accent transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-[13px] text-text">{item.label}</span>
                )}
                {item.sublabel && (
                  <div className="text-[11px] text-text-dim mt-0.5">
                    {item.sublabel}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
