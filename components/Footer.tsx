import { PROTOCOL_VERSION } from "@/lib/manifest";

const LINKS = [
  { name: "Spec", href: "/spec" },
  { name: "Extensiones", href: "/extensions" },
  { name: "Red", href: "/network" },
  { name: "Implementadores", href: "/implementors" },
  { name: "Visión", href: "/vision" },
  { name: "Whitepaper", href: "/whitepaper" },
  { name: "GitHub", href: "https://github.com/servicialo/mcp-server" },
  { name: "npm", href: "https://www.npmjs.com/package/@servicialo/mcp-server" },
];

export function Footer() {
  return (
    <footer className="border-t-[3px] border-double border-border pt-8 md:pt-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8">
        <div>
          <div className="font-mono text-[13px] font-semibold text-text">
            servicialo<span className="text-accent">.com</span>
          </div>
          <div className="text-xs text-text-dim mt-1.5 leading-relaxed">
            Protocolo abierto para servicios — v{PROTOCOL_VERSION} (borrador)
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap md:justify-end gap-x-6 gap-y-2.5 font-mono text-[11px]">
          {LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-text-muted hover:text-accent transition-colors"
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
