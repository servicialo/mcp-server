/**
 * Shared syntax-highlight idiom for the dark code cards.
 * Extracted from the copies that lived in EntidadesSection / EstandarSection.
 */

export const K = "text-[#7EC8E3]"; // keys — celeste
export const T = "text-[#E5C07B]"; // types/values — amarillo suave
export const C = "text-[#5C6370] hidden md:inline"; // comments — ocultos en mobile
export const A = "text-accent"; // section keys — accent
export const H = "text-[#5C6370]"; // header comments — siempre visibles
export const TREE = "text-white/40"; // tree connectors └── ├──

export function Line({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="font-mono text-[10px] md:text-xs leading-[2] m-0 overflow-x-auto">
      {children}
    </pre>
  );
}
