"use client";

import { useEffect, useState } from "react";

const sections = [
  { name: "Definición", id: "que-es" },
  { name: "Origen", id: "origen" },
  { name: "Anatomía", id: "anatomia" },
  { name: "Ciclo de vida", id: "ciclo" },
  { name: "Principios", id: "principios" },
  { name: "Estándar", id: "estandar" },
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
    <nav className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
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
        </div>

        {/* Menú hamburguesa — solo mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
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
