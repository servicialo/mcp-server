export function PageHeader({
  tag,
  title,
  subtitle,
  children,
}: {
  tag: string;
  title: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10 md:mb-14">
      <a
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-dim hover:text-accent transition-colors mb-7"
      >
        ← servicialo.com
      </a>
      <div className="flex items-center gap-3 mb-4">
        <span aria-hidden className="h-px w-7 bg-accent" />
        <div className="font-mono text-[11px] font-semibold text-text uppercase tracking-[0.16em]">
          {tag}
        </div>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      <h1 className="font-serif text-[32px] md:text-[44px] font-medium text-text leading-[1.12] tracking-[-0.01em] mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[15px] md:text-base text-text-muted leading-[1.7] max-w-[640px]">
          {subtitle}
        </p>
      )}
      {children}
    </header>
  );
}
