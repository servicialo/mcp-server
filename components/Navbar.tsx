"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const sections = [
  { name: "Definición", id: "que-es" },
  { name: "Origen", id: "origen" },
  { name: "Anatomía", id: "anatomia" },
  { name: "Ciclo de vida", id: "ciclo" },
  { name: "Disputas", id: "resolucion" },
  { name: "Evidencia", id: "evidencia-vertical" },
  { name: "Principios", id: "principios" },
  { name: "Módulos", id: "modulos" },
  { name: "Estándar", id: "estandar" },
  { name: "Servidor MCP", id: "mcp-server" },
];

export function Navbar() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClick = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-bg-alpha backdrop-blur-md border-b border-border transition-colors duration-300">
      <div className="max-w-content mx-auto px-4 md:px-8 h-[52px] flex items-center justify-between">
        <a
          href="/"
          className="font-mono text-sm font-semibold tracking-tight shrink-0"
        >
          servicialo<span className="text-accent">.com</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={`font-mono text-[11px] px-2.5 py-2 whitespace-nowrap transition-colors border-b-2 ${
                activeId === section.id
                  ? "text-accent border-accent"
                  : "text-text-muted hover:text-accent border-transparent"
              }`}
            >
              {section.name}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
            <a
              href="https://github.com/servicialo/mcp-server"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-accent transition-colors"
              aria-label="GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <a
            href="https://github.com/servicialo/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-accent transition-colors"
            aria-label="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menú"
          >
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-[4.5px]" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-[4.5px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menú desplegable mobile */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96 border-t border-border" : "max-h-0"
        }`}
      >
        <div className="max-w-content mx-auto px-4 py-3 flex flex-col gap-0.5">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={`font-mono text-[13px] px-3 py-2.5 text-left rounded-lg transition-colors ${
                activeId === section.id
                  ? "text-accent bg-accent-soft"
                  : "text-text-body hover:bg-surface-alt"
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
