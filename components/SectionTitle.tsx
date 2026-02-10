export function SectionTitle({
  tag,
  title,
  subtitle,
}: {
  tag?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 md:mb-8">
      {tag && (
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          {tag}
        </div>
      )}
      <h2 className="font-serif text-[26px] md:text-[32px] text-text leading-[1.2] tracking-[-0.01em]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-text-muted mt-2 md:mt-2.5 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
