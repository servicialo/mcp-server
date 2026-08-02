export function SectionTitle({
  tag,
  title,
  subtitle,
}: {
  tag?: string;
  title: string;
  subtitle?: string;
}) {
  // Los tags de sección vienen como "01 — El problema"; el número se separa
  // para tratarlo como numeración de documento (§). Tags sin número se
  // muestran enteros.
  const match = tag?.match(/^(\d+)\s*—\s*(.+)$/);
  const num = match?.[1];
  const label = match?.[2] ?? tag;

  return (
    <div className="mb-7 md:mb-9">
      {tag && (
        <div className="flex items-center gap-3 mb-4">
          {num && (
            <span className="font-mono text-[11px] font-semibold text-text tabular-nums">
              § {num}
            </span>
          )}
          <span className="font-mono text-[11px] text-text-muted uppercase tracking-[0.16em]">
            {label}
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>
      )}
      <h2 className="font-serif text-[27px] md:text-[34px] font-medium text-text leading-[1.15] tracking-[-0.01em]">
        {title}
      </h2>
      {subtitle && (
        <p className="font-serif italic text-[15px] md:text-[17px] text-text-muted mt-2.5 leading-[1.6] max-w-[600px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
