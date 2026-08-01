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
    <div className={`bg-dark rounded-[20px] py-6 px-4 md:py-8 md:px-9 text-white ${className}`}>
      {label && (
        <div className="font-mono text-[10px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
