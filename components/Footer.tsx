export function Footer() {
  return (
    <footer className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="font-mono text-[13px] font-semibold text-text">
          servicialo<span className="text-accent">.com</span>
        </div>
        <div className="text-xs text-text-dim mt-1">
          El estándar abierto para servicios — v0.1
        </div>
      </div>
      <div className="font-mono text-[11px] text-text-dim">
        Ecosistema:{" "}
        <span className="text-text-muted">Servicialo</span> →{" "}
        <span className="text-accent">Coordinalo</span> →{" "}
        <span className="text-purple">Orquestalo</span>
      </div>
    </footer>
  );
}
