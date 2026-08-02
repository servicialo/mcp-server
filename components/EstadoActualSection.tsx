import { SectionTitle } from "./SectionTitle";
import { StatusMatrix, type StatusColumn } from "./StatusMatrix";
import { EXTENSIONS, MANIFEST, PACKAGE_VERSION, TOOL_COUNTS } from "@/lib/manifest";
import { EXTENSIONS_COPY } from "@/lib/data";

export function EstadoActualSection() {
  const byMaturity = (maturities: string[]) =>
    EXTENSIONS.filter((e) => maturities.includes(e.maturity)).map((e) => ({
      label: e.name,
      sublabel: EXTENSIONS_COPY[e.id]?.tagline,
      href: `/extensions#${e.id}`,
    }));

  const columns: StatusColumn[] = [
    {
      key: "disponible",
      title: "Disponible hoy",
      badge: "available",
      items: [
        {
          label: "Especificación y modelo principal",
          sublabel: `PROTOCOL.md v${MANIFEST.protocol.version} (borrador) + JSON Schemas`,
          href: "/spec",
        },
        {
          label: `Servidor MCP (${TOOL_COUNTS.total} tools)`,
          sublabel: `@servicialo/mcp-server v${PACKAGE_VERSION}`,
          href: "https://www.npmjs.com/package/@servicialo/mcp-server",
        },
        { label: "Perfil HTTP + OpenAPI", sublabel: "binding REST normativo", href: "https://github.com/servicialo/mcp-server/blob/main/spec/HTTP_PROFILE.md" },
        { label: "Registry + resolver global", sublabel: "descubrimiento y portabilidad" },
        { label: "Coordinalo (referencia, salud)", sublabel: "en producción", href: "https://coordinalo.com" },
      ],
    },
    {
      key: "experimental",
      title: "Experimental · candidata",
      badge: "experimental",
      items: [
        {
          label: "Binding A2A",
          sublabel: "descubrimiento e intents de booking",
          href: "/spec#bindings",
        },
        ...byMaturity(["experimental", "candidate"]),
      ],
    },
    {
      key: "diseno",
      title: "En diseño",
      badge: "draft",
      items: byMaturity(["draft"]),
    },
    {
      key: "vision",
      title: "Visión",
      badge: "vision",
      items: [
        { label: "Arbitraje avanzado por pares", href: "/vision#arbitraje" },
        { label: "Scoring e inclusión financiera", href: "/vision#inclusion-financiera" },
        { label: "Inteligencia colectiva de red", href: "/vision#inteligencia-colectiva" },
        { label: "Red de confianza y reputación", href: "/vision#red-de-confianza" },
      ],
    },
  ];

  return (
    <section id="estado-actual" className="mb-16 md:mb-24">
      <SectionTitle
        tag="04 — Estado actual"
        title="Qué existe hoy"
        subtitle="Distinguimos explícitamente lo disponible de lo experimental, lo que está en diseño y lo aspiracional. Las hipótesis no se presentan como resultados."
      />

      <StatusMatrix columns={columns} />

      <div className="mt-4 text-[12px] text-text-muted leading-[1.7]">
        La madurez de cada extensión vive en{" "}
        <a
          href="https://github.com/servicialo/mcp-server/blob/main/protocol/manifest.yaml"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          protocol/manifest.yaml
        </a>{" "}
        y se valida en CI —{" "}
        <a href="/extensions" className="text-accent hover:underline">
          ver extensiones y su madurez →
        </a>
      </div>
    </section>
  );
}
