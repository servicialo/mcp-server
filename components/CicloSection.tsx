"use client";

import { useState } from "react";
import { SectionTitle } from "./SectionTitle";
import { LIFECYCLE_STATES } from "@/lib/data";

const EXCEPTIONS = [
  {
    title: "Inasistencia del cliente",
    transition: "Confirmado → Cancelado",
    desc: "Cobra penalidad según política, libera horario del proveedor para reasignación.",
    borderColor: "border-l-rose-500",
  },
  {
    title: "Inasistencia del proveedor",
    transition: "Confirmado → Reasignación",
    desc: "Reasigna proveedor automáticamente, notifica al cliente del cambio.",
    borderColor: "border-l-amber-500",
  },
  {
    title: "Cancelación",
    transition: "Cualquier estado → Cancelado",
    desc: "Aplica política de cancelación según tiempo restante antes del servicio.",
    borderColor: "border-l-gray-400",
  },
  {
    title: "Disputa de calidad",
    transition: "Completado → En Revisión → Resuelta",
    desc: "Congela pago. Algoritmo evalúa evidencia vs contrato de servicio. Si concluyente: resolución automática (~80%). Si ambiguo: arbitraje por pares del mismo vertical.",
    borderColor: "border-l-purple",
  },
  {
    title: "Reagendamiento",
    transition: "Agendado/Confirmado → Reagendando",
    desc: "Busca nuevo horario compatible para ambas partes, mantiene el mismo proveedor.",
    borderColor: "border-l-cyan-500",
  },
  {
    title: "Servicio parcial",
    transition: "En Curso → Parcial",
    desc: "Documenta lo entregado, ajusta factura proporcionalmente, agenda continuación.",
    borderColor: "border-l-green",
  },
];

export function CicloSection() {
  const [active, setActive] = useState(0);
  const state = LIFECYCLE_STATES[active];

  return (
    <section id="ciclo" className="mb-16">
      <SectionTitle
        tag="04 — Ciclo de vida"
        title="9 estados universales"
        subtitle="Todo servicio — desde una consulta médica hasta una reparación del hogar — pasa por el mismo ciclo."
      />

      {/* Stepper interactivo del ciclo de vida */}
      <div className="bg-dark rounded-2xl p-4 md:p-7 text-white">
        {/* Indicadores — grid en mobile, línea en desktop */}
        <div className="grid grid-cols-5 gap-2 md:flex md:items-center md:gap-0 mb-6">
          {LIFECYCLE_STATES.map((s, i) => (
            <div key={s.id} className="flex items-center justify-center md:justify-start shrink-0">
              <button
                onClick={() => setActive(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold transition-all duration-200 border-2 ${
                  i === active
                    ? "bg-accent border-accent text-white"
                    : i < active
                    ? "bg-green/20 border-green text-green"
                    : "bg-dark-soft border-[#444] text-[#666]"
                }`}
              >
                {i < active ? "✓" : s.icon}
              </button>
              {i < LIFECYCLE_STATES.length - 1 && (
                <div
                  className={`hidden md:block w-6 h-0.5 transition-colors duration-300 ${
                    i < active ? "bg-green/40" : "bg-[#333]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Detalle del estado activo */}
        <div>
          <div className="font-mono text-[11px] text-accent uppercase tracking-[0.1em] mb-1.5">
            Estado {active + 1} de {LIFECYCLE_STATES.length}
          </div>
          <div className="font-serif text-2xl md:text-[28px] text-white mb-2.5">
            {state.label}
          </div>
          <div className="text-sm md:text-[15px] text-[#999] leading-[1.7]">
            {state.desc}
          </div>
        </div>

        {/* Navegación */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setActive(Math.max(0, active - 1))}
            disabled={active === 0}
            className={`font-mono text-xs py-2 px-4 rounded-lg border border-[#444] bg-transparent transition-colors ${
              active === 0
                ? "text-[#444] cursor-default"
                : "text-[#999] cursor-pointer hover:border-[#666]"
            }`}
          >
            ← Anterior
          </button>
          <button
            onClick={() =>
              setActive(Math.min(LIFECYCLE_STATES.length - 1, active + 1))
            }
            disabled={active === LIFECYCLE_STATES.length - 1}
            className={`font-mono text-xs py-2 px-4 rounded-lg border-none text-white transition-colors ${
              active === LIFECYCLE_STATES.length - 1
                ? "bg-[#333] cursor-default"
                : "bg-accent cursor-pointer hover:bg-accent-dark"
            }`}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* ¿Por qué 9 estados? */}
      <div className="mt-5 bg-surface rounded-xl py-4 px-4 md:py-5 md:px-6 border border-border">
        <div className="font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.08em] mb-3">
          ¿Por qué 9 estados?
        </div>
        <div className="text-sm text-text-body leading-[1.8]">
          Menos estados pierden información crítica — sin separar
          &quot;Completado&quot; de &quot;Documentado&quot;, no sabes si el
          registro fue generado. Más estados agregan fricción. 9 es el mínimo
          viable para que un agente AI pueda verificar con certeza que un
          servicio fue solicitado, entregado, documentado y cobrado.
        </div>
      </div>

      {/* Flujos de excepción */}
      <div className="mt-8">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          Flujos de excepción
        </div>
        <h3 className="font-serif text-2xl text-text mb-1.5">
          Cuando las cosas no salen según el plan
        </h3>
        <p className="text-sm text-text-muted mb-5 max-w-[560px]">
          Un estándar robusto no solo define el camino feliz. Define qué pasa
          cuando algo falla.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {EXCEPTIONS.map((ex) => (
            <div
              key={ex.title}
              className={`bg-surface rounded-xl py-4 px-5 border border-border-light border-l-[3px] transition-shadow duration-200 hover:shadow-sm ${ex.borderColor}`}
            >
              <div className="font-mono text-[13px] font-semibold text-text mb-1">
                {ex.title}
              </div>
              <div className="font-mono text-[11px] text-text-muted mb-2">
                {ex.transition}
              </div>
              <div className="text-[13px] text-text-body leading-relaxed">
                {ex.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
