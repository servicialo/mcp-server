export function DarkCard({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-dark border border-dark-soft py-6 px-4 md:py-8 md:px-9 text-white ${className}`}
    >
      {label && (
        <div className="flex items-center gap-3 mb-4">
          <span aria-hidden className="h-px w-5 bg-accent" />
          <div className="font-mono text-[10px] font-semibold text-accent uppercase tracking-[0.14em]">
            {label}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
