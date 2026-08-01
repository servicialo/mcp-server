import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Whitepaper (archivo) — Servicialo",
  description:
    "Snapshot v0.9 del whitepaper de Servicialo (marzo 2026). Documento histórico: no refleja el estado actual del protocolo.",
  openGraph: {
    title: "Whitepaper (archivo) — Servicialo",
    description:
      "Snapshot v0.9 del whitepaper de Servicialo (marzo 2026). Documento histórico: no refleja el estado actual del protocolo.",
  },
};

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export default function WhitepaperPage() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Documento histórico"
        title="Whitepaper — snapshot v0.9"
        subtitle="El whitepaper corresponde al corte v0.9 del protocolo (marzo 2026) y no se actualiza. Sus cifras (conteos de herramientas, framing de estados, licencia mencionada) son históricas."
      />

      {/* Aviso de vigencia */}
      <section className="mb-14">
        <div className="bg-accent-soft border border-accent/20 rounded-[14px] p-5">
          <p className="text-[14px] text-text leading-[1.7]">
            Este documento no refleja el estado actual del protocolo. Para la
            superficie vigente: la especificación en{" "}
            <a href="/spec" className="text-accent hover:underline">
              /spec
            </a>
            , las extensiones y su madurez en{" "}
            <a href="/extensions" className="text-accent hover:underline">
              /extensions
            </a>
            , y la visión de largo plazo en{" "}
            <a href="/vision" className="text-accent hover:underline">
              /vision
            </a>
            .
          </p>
        </div>
      </section>

      {/* Descargas */}
      <section className="mb-14">
        <h2 className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-5">
          Descargar el snapshot
        </h2>
        <p className="text-[13px] text-text-muted leading-[1.7] max-w-[600px] mb-5">
          Los PDF se conservan tal como se publicaron en marzo de 2026 y no se
          regeneran.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/docs/servicialo-whitepaper.pdf"
            download="servicialo-whitepaper-v0.9-es.pdf"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-mono text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            <DownloadIcon />
            Descargar PDF (español) — v0.9
          </a>
          <a
            href="/docs/servicialo-whitepaper-en.pdf"
            download="servicialo-whitepaper-v0.9-en.pdf"
            className="inline-flex items-center gap-2 border border-border text-text-muted hover:border-accent hover:text-accent font-mono text-[13px] font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            <DownloadIcon />
            Download PDF (English) — v0.9
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
