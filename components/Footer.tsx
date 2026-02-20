export function Footer() {
  return (
    <footer className="border-t border-border pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
      <div>
        <div className="font-mono text-[13px] font-semibold text-text">
          servicialo<span className="text-accent">.com</span>
        </div>
        <div className="text-xs text-text-dim mt-1">
          El estándar abierto para servicios — v0.1
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
        <a
          href="https://github.com/danioni/servicialo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent transition-colors"
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/@servicialo/mcp-server"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent transition-colors"
        >
          npm
        </a>
      </div>
    </footer>
  );
}
