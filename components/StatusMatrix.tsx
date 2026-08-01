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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {columns.map((col) => (
        <div
          key={col.key}
          className="bg-surface border border-border rounded-[14px] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <MaturityBadge maturity={col.badge} label={col.title} />
          </div>
          <ul className="space-y-2.5">
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
                  <div className="text-[11px] text-text-dim">{item.sublabel}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
