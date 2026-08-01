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
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-dim hover:text-accent transition-colors mb-6"
      >
        ← servicialo.com
      </a>
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-3">
        {tag}
      </div>
      <h1 className="font-serif text-[32px] md:text-[44px] text-text leading-[1.15] tracking-[-0.02em] mb-4">
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
