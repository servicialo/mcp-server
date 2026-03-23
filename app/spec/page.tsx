import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Servicialo Protocol Spec v0.9.0",
  description:
    "Especificación completa del protocolo: 9 estados, 8 dimensiones, 34 herramientas, servidor MCP, protocolo de servicios profesionales. Complete protocol specification: 9 states, 8 dimensions, 34 tools, MCP server, professional services protocol.",
  openGraph: {
    title: "Servicialo Protocol Spec v0.9.0",
    description:
      "Especificación completa del protocolo: 9 estados, 8 dimensiones, 34 herramientas MCP. Complete specification: 9 states, 8 dimensions, 34 MCP tools.",
  },
};

export default function SpecPage() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      {/* Volver */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted hover:text-accent transition-colors mb-8"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver al inicio
      </Link>

      {/* Header */}
      <section className="mb-14 md:mb-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          Especificaci&oacute;n del protocolo
        </div>
        <h1 className="font-serif text-[32px] md:text-[52px] font-normal text-text leading-[1.12] tracking-[-0.02em] mb-5">
          Servicialo Protocol Spec v0.9.0
        </h1>
        <p className="text-[15px] md:text-lg text-text-muted leading-[1.7] max-w-[600px] mb-3">
          Referencia autocontenida para desarrolladores y agentes IA que
          eval&uacute;an o implementan el protocolo.{" "}
          <span className="text-accent">
            8 dimensiones, 9 estados, 34 herramientas.
          </span>
        </p>
        <p className="text-[14px] text-text-dim leading-[1.7] max-w-[600px] mb-6 italic">
          Self-contained reference for developers and AI agents evaluating or
          implementing the protocol. 8 dimensions, 9 states, 34 tools.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-text-dim">
          <span>&#9670; Protocol v0.9.0</span>
          <span>&#9670; MCP Server v0.8.0</span>
          <span>&#9670; Sincronizado: 2026-03-23</span>
        </div>
      </section>

      {/* Tabla de contenidos / Table of contents */}
      <nav className="mb-14 border border-border rounded-lg p-5 md:p-6">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-4">
          Contenido / Contents
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-text-muted">
          <li><a href="#dimensions" className="hover:text-accent transition-colors">Las 8 dimensiones / The 8 Dimensions</a></li>
          <li><a href="#lifecycle" className="hover:text-accent transition-colors">Los 9 estados del ciclo de vida / The 9 Lifecycle States</a></li>
          <li><a href="#entities" className="hover:text-accent transition-colors">Las dos entidades / The Two Entities</a></li>
          <li><a href="#exceptions" className="hover:text-accent transition-colors">Flujos de excepci&oacute;n / Exception Flows</a></li>
          <li><a href="#tools" className="hover:text-accent transition-colors">Herramientas MCP por fase / MCP Tools by Phase</a></li>
          <li><a href="#requirements" className="hover:text-accent transition-colors">Requisitos m&iacute;nimos / Minimum Implementation Requirements</a></li>
          <li><a href="#api" className="hover:text-accent transition-colors">Superficie de API / API Surface</a></li>
        </ol>
      </nav>

      {/* Section 1: Las 8 Dimensiones */}
      <section id="dimensions" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          01
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Las 8 dimensiones <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ The 8 Dimensions</span>
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          Todo servicio se modela a trav&eacute;s de 8 dimensiones can&oacute;nicas, universales para todas las verticales.
        </p>
        <p className="text-sm text-text-dim leading-relaxed mb-6 italic">
          Every service is modeled across 8 canonical dimensions, universal across verticals.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-3 w-8">#</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Dimensi&oacute;n / Dimension</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Qu&eacute; captura / What it captures</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Campos ejemplo / Example fields</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { n: 1, dim: "Identidad (Qu\u00e9)", dimEn: "Identity (What)", what: "La actividad o resultado entregado", whatEn: "The activity or outcome being delivered", fields: "type, vertical, name, duration_minutes, requirements" },
                { n: 2, dim: "Proveedor (Qui\u00e9n entrega)", dimEn: "Provider (Who Delivers)", what: "Profesional o entidad que entrega el servicio", whatEn: "Professional or entity delivering the service", fields: "provider.id, credentials, trust_score, organization_id" },
                { n: 3, dim: "Cliente (Qui\u00e9n recibe)", dimEn: "Client (Who Receives)", what: "Beneficiario del servicio; el pagador se separa expl\u00edcitamente", whatEn: "Beneficiary of the service; payer is explicitly separated", fields: "client.id, client.payer_id" },
                { n: 4, dim: "Agenda (Cu\u00e1ndo)", dimEn: "Schedule (When)", what: "Ventana temporal del servicio", whatEn: "Temporal window for the service", fields: "requested_at, scheduled_for, duration_expected" },
                { n: 5, dim: "Ubicaci\u00f3n (D\u00f3nde)", dimEn: "Location (Where)", what: "Ubicaci\u00f3n f\u00edsica o virtual; puede referenciar un Recurso", whatEn: "Physical or virtual location; may reference a Resource entity", fields: "type (in_person/remote), address, resource_id, coordinates" },
                { n: 6, dim: "Ciclo de vida (Estados)", dimEn: "Lifecycle (States)", what: "Posici\u00f3n actual en el ciclo de 9 estados", whatEn: "Current position in the 9-state lifecycle", fields: "current_state, transitions[], exceptions[]" },
                { n: 7, dim: "Evidencia (Prueba)", dimEn: "Evidence (Proof)", what: "C\u00f3mo el servicio prueba que ocurri\u00f3", whatEn: "How the service proves it occurred", fields: "checkin, checkout, duration_actual, evidence[]" },
                { n: 8, dim: "Facturaci\u00f3n (Pago)", dimEn: "Billing (Payment)", what: "Liquidaci\u00f3n financiera, independiente del ciclo de vida", whatEn: "Financial settlement, independent from lifecycle", fields: "amount, payer, status, payment_id, tax_document" },
              ].map((row) => (
                <tr key={row.n} className="border-b border-border/50">
                  <td className="font-mono text-accent py-2.5 pr-3">{row.n}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold">{row.dim}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.dimEn}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-text-muted">{row.what}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.whatEn}</span>
                  </td>
                  <td className="py-2.5"><code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">{row.fields}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-text-muted leading-relaxed mt-4">
          Un <strong>Recurso</strong> (espacio f&iacute;sico/equipamiento) es una entidad de primera clase con{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">capacity</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">buffer_minutes</code>,
          su propio calendario de disponibilidad y lista de equipos. Opcional — pr&aacute;cticas individuales funcionan sin &eacute;l.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mt-1 italic">
          A Resource (physical space/equipment) is a first-class entity with capacity, buffer_minutes, its own availability schedule, and equipment list. Optional — solo practices work without it.
        </p>
      </section>

      {/* Section 2: Los 9 estados del ciclo de vida */}
      <section id="lifecycle" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          02
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Los 9 estados del ciclo de vida <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ The 9 Lifecycle States</span>
        </h2>
        <div className="bg-surface-alt rounded-lg p-4 mb-6 overflow-x-auto">
          <code className="text-sm text-text whitespace-nowrap">
            Requested &rarr; Scheduled &rarr; Confirmed &rarr; In Progress
            &rarr; Completed &rarr; Documented &rarr; Invoiced &rarr; Collected
            &rarr; Verified
          </code>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-3 w-8">#</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Estado / State</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Disparador / Trigger</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Notas / Notes</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { n: 1, state: "requested", trigger: "Cliente/agente env\u00eda solicitud", triggerEn: "Client/agent submits request", notes: "Punto de entrada", notesEn: "Entry point" },
                { n: 2, state: "scheduled", trigger: "Sistema encuentra disponibilidad (proveedor, opcionalmente recurso)", triggerEn: "System matches availability (provider, optionally resource)", notes: "Compromiso triple si hay recurso asignado", notesEn: "Three-way commitment if resource assigned" },
                { n: 3, state: "confirmed", trigger: "Ambas partes confirman", triggerEn: "Both parties acknowledge", notes: "Proveedor + cliente confirman", notesEn: "Provider + client confirm" },
                { n: 4, state: "in_progress", trigger: "Check-in detectado (GPS + timestamp)", triggerEn: "Check-in detected (GPS + timestamp)", notes: "Comienza la entrega", notesEn: "Delivery begins" },
                { n: 5, state: "completed", trigger: "Proveedor marca entrega completa", triggerEn: "Provider marks delivery complete", notes: "Duraci\u00f3n auto-calculada desde checkin/checkout", notesEn: "Duration auto-calculated from checkin/checkout" },
                { n: 6, state: "documented", trigger: "Nota cl\u00ednica, reporte o evidencia archivada", triggerEn: "Clinical note, report, or evidence filed", notes: "Schema de evidencia por vertical aplicado", notesEn: "Vertical-specific evidence schema applied" },
                { n: 7, state: "invoiced", trigger: "Documento tributario emitido", triggerEn: "Tax document emitted", notes: "Dimensi\u00f3n de facturaci\u00f3n actualizada", notesEn: "Billing dimension updated" },
                { n: 8, state: "collected", trigger: "Pago recibido y confirmado", triggerEn: "Payment received and confirmed", notes: "Solo sesiones collected cuentan para liquidaci\u00f3n", notesEn: "Only collected sessions count toward payroll" },
                { n: 9, state: "verified", trigger: "Cliente confirma OK, o ventana de silencio expira (auto-verify)", triggerEn: "Client confirms OK, or silence window expires (auto-verify)", notes: "Estado terminal del camino feliz", notesEn: "Terminal happy-path state" },
              ].map((row) => (
                <tr key={row.n} className="border-b border-border/50">
                  <td className="font-mono text-accent py-2.5 pr-3">{row.n}</td>
                  <td className="py-2.5 pr-4"><code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">{row.state}</code></td>
                  <td className="py-2.5 pr-4">
                    <span className="text-text-muted">{row.trigger}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.triggerEn}</span>
                  </td>
                  <td className="py-2.5">
                    <span className="text-text-muted">{row.notes}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.notesEn}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-text-muted leading-relaxed mt-4">
          <strong>Reglas:</strong> Los estados son estrictamente ordenados — no se pueden saltar. Cada transici&oacute;n registra{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">from</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">to</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">at</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">by</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">method</code>{" "}
          (auto/manual/agent), y{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">metadata</code>.
          Cuando <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">method = agent</code>,{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">mandate_id</code>{" "}
          es obligatorio.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mt-1 italic">
          Rules: States are strictly ordered — no skipping. Each transition records from, to, at, by, method (auto/manual/agent), and metadata. When method = agent, mandate_id is required.
        </p>
      </section>

      {/* Section 3: Las dos entidades */}
      <section id="entities" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          03
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-6">
          Las dos entidades <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ The Two Entities</span>
        </h2>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-2">
          Servicio (Unidad at&oacute;mica) <span className="text-text-dim font-normal text-sm">/ Service (Atomic Unit)</span>
        </h3>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          La unidad at&oacute;mica de entrega de servicios profesionales. Modelada en las 8 dimensiones. Puede existir de forma independiente o dentro de una Orden de Servicio.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-6 italic">
          The atomic unit of professional service delivery. Modeled across the 8 dimensions. May exist standalone or within a Service Order.
        </p>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-2">
          Orden de Servicio (Acuerdo comercial) <span className="text-text-dim font-normal text-sm">/ Service Order (Commercial Agreement)</span>
        </h3>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          Un acuerdo bilateral para entregar un conjunto de servicios bajo t&eacute;rminos comerciales definidos.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-4 italic">
          A bilateral agreement to deliver a set of services under defined commercial terms.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Eje / Axis</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Qu&eacute; define / What it defines</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              <tr className="border-b border-border/50">
                <td className="font-semibold py-2.5 pr-4">Alcance / Scope</td>
                <td className="py-2.5 text-text-muted">Tipos de servicio autorizados, l&iacute;mites de cantidad/horas, condici&oacute;n de expiraci&oacute;n <span className="text-text-dim italic text-xs">/ Authorized service types, quantity/hours limits, expiry condition</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="font-semibold py-2.5 pr-4">Precio / Pricing</td>
                <td className="py-2.5 text-text-muted">Modelo (fijo / tiempo y materiales / tarifa / mixto), moneda, tarifas <span className="text-text-dim italic text-xs">/ Model (fixed / time &amp; materials / rate card / mixed), currency, rates</span></td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="font-semibold py-2.5 pr-4">Calendario de pagos / Payment schedule</td>
                <td className="py-2.5 text-text-muted">Cu&aacute;ndo se mueve el dinero (anticipado / hito / peri&oacute;dico / contra entrega / personalizado) <span className="text-text-dim italic text-xs">/ When money moves (upfront / milestone / periodic / on delivery / custom)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-surface-alt rounded-lg p-4 mb-6 overflow-x-auto">
          <p className="text-sm text-text mb-1"><strong>Ciclo de vida de la Orden de Servicio / Service Order lifecycle:</strong></p>
          <code className="text-sm text-text-muted">
            draft &rarr; proposed &rarr; negotiating &rarr; active &rarr; paused
            &rarr; completed | cancelled
          </code>
        </div>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Una cotizaci&oacute;n ES una Orden de Servicio en estado{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">draft</code> o{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">proposed</code>{" "}
          — no existe un objeto de cotizaci&oacute;n separado.
          <span className="text-text-dim italic text-xs block mt-1">A quote IS a Service Order in draft or proposed state — no separate quote object.</span>
        </p>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-2">
          Libro mayor computado <span className="text-text-dim font-normal text-sm">/ Computed Ledger (read-only, on the Service Order)</span>
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Campo / Field</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Significado / Meaning</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { field: "services_verified", meaning: "Cantidad de servicios en estado verified", meaningEn: "Count of services in verified state" },
                { field: "hours_consumed", meaning: "Total de horas en servicios verificados", meaningEn: "Total hours across verified services" },
                { field: "amount_consumed", meaning: "Valor consumido a tarifas del modelo de precio", meaningEn: "Value consumed at pricing model rates" },
                { field: "amount_billed", meaning: "Total facturado a la fecha", meaningEn: "Total invoiced to date" },
                { field: "amount_collected", meaning: "Total de pagos recibidos", meaningEn: "Total payments received" },
                { field: "amount_remaining", meaning: "Alcance autorizado a\u00fan no consumido", meaningEn: "Authorized scope not yet consumed" },
              ].map((row) => (
                <tr key={row.field} className="border-b border-border/50">
                  <td className="py-2.5 pr-4"><code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">{row.field}</code></td>
                  <td className="py-2.5">
                    <span className="text-text-muted">{row.meaning}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.meaningEn}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-text-muted leading-relaxed">
          <strong>Relaci&oacute;n (Principio 6):</strong> Orden de Servicio = lo acordado. Servicio at&oacute;mico = lo entregado. El libro mayor conecta ambos.
          <span className="text-text-dim italic text-xs block mt-1">Relationship (Principle 6): Service Order = what was agreed. Atomic Service = what was delivered. The ledger bridges both.</span>
        </p>
      </section>

      {/* Section 4: Flujos de excepci&oacute;n */}
      <section id="exceptions" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          04
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Flujos de excepci&oacute;n <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ Exception Flows</span>
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          6 flujos de excepci&oacute;n de primera clase. Cualquiera puede redirigir fuera del camino feliz.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-6 italic">
          6 first-class exception flows. Any of these may redirect out of the happy path.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Excepci&oacute;n / Exception</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Disparador / Trigger</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-3">Desde / From</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-3">Hacia / To</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Regla clave / Key rule</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { exc: "No-show del cliente", excEn: "Client no-show", trigger: "Cliente ausente pasado el periodo de gracia", triggerEn: "Client absent past grace period", from: "confirmed", to: "cancelled (no_show)", rule: "Cobrar penalidad seg\u00fan pol\u00edtica; liberar slot del proveedor", ruleEn: "Charge penalty per policy; free provider slot" },
                { exc: "No-show del proveedor", excEn: "Provider no-show", trigger: "Proveedor ausente o cancelaci\u00f3n de \u00faltimo minuto", triggerEn: "Provider absent or last-minute cancel", from: "confirmed", to: "reassigning \u2192 scheduled", rule: "Buscar reemplazo autom\u00e1ticamente; notificar cliente; marcar proveedor", ruleEn: "Auto-find replacement; notify client; flag provider" },
                { exc: "Cancelaci\u00f3n", excEn: "Cancellation", trigger: "Cualquier parte cancela pre-entrega", triggerEn: "Either party cancels pre-delivery", from: "Any pre-delivery", to: "cancelled", rule: "Aplicar pol\u00edtica de cancelaci\u00f3n seg\u00fan tiempo restante", ruleEn: "Apply cancellation policy by time remaining" },
                { exc: "Disputa de calidad", excEn: "Quality dispute", trigger: "Cliente disputa dentro de ventana de disputa", triggerEn: "Client disputes within dispute window", from: "completed", to: "disputed", rule: "Congelar cobro; solicitar evidencia adicional; resolver a verified o cancelled", ruleEn: "Freeze charge; request additional evidence; resolve to verified or cancelled" },
                { exc: "Reprogramaci\u00f3n", excEn: "Rescheduling", trigger: "Cualquier parte necesita horario diferente", triggerEn: "Either party needs different time", from: "scheduled/confirmed", to: "rescheduling \u2192 scheduled", rule: "Mantener mismo proveedor si es posible; manejar conflictos de recurso", ruleEn: "Maintain same provider when possible; handle resource conflicts" },
                { exc: "Entrega parcial", excEn: "Partial delivery", trigger: "Servicio no puede completarse en su totalidad", triggerEn: "Service cannot be completed in full", from: "in_progress", to: "partial", rule: "Documentar lo entregado; ajustar factura proporcionalmente", ruleEn: "Document what was delivered; adjust invoice proportionally" },
              ].map((row) => (
                <tr key={row.exc} className="border-b border-border/50">
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold whitespace-nowrap">{row.exc}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.excEn}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-text-muted">{row.trigger}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.triggerEn}</span>
                  </td>
                  <td className="py-2.5 pr-3"><code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">{row.from}</code></td>
                  <td className="py-2.5 pr-3"><code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">{row.to}</code></td>
                  <td className="py-2.5">
                    <span className="text-text-muted">{row.rule}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.ruleEn}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Herramientas MCP por fase */}
      <section id="tools" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          05
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Herramientas MCP por fase <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ MCP Tools by Phase</span>
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          34 herramientas implementadas en{" "}
          <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">@servicialo/mcp-server</code>{" "}
          v0.8.0. 9 p&uacute;blicas (sin auth) + 25 autenticadas (API key + org ID).
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-8 italic">
          34 tools implemented in @servicialo/mcp-server v0.8.0. 9 public (no auth) + 25 authenticated (API key + org ID).
        </p>

        {/* Phase 0 */}
        <ToolPhase
          phase="Fase 0 / Phase 0"
          title="Resoluci\u00f3n DNS / DNS Resolution"
          count={3}
          isPublic
          tools={[
            { tool: "resolve.lookup", desc: "Resolver orgSlug \u2192 endpoint + nivel de confianza / Resolve orgSlug \u2192 endpoint + trust level", auth: "No" },
            { tool: "resolve.search", desc: "Buscar resolver global por pa\u00eds y vertical / Search global resolver by country and vertical", auth: "No" },
            { tool: "trust.get_score", desc: "Puntaje de confianza (0\u2013100), nivel, \u00faltima actividad / Trust score (0\u2013100), level, last activity", auth: "No" },
          ]}
        />

        {/* Phase 1 */}
        <ToolPhase
          phase="Fase 1 / Phase 1"
          title="Descubrimiento / Discovery"
          count={6}
          isPublic
          tools={[
            { tool: "registry.search", desc: "Buscar organizaciones por vertical, ubicaci\u00f3n, pa\u00eds / Search organizations by vertical, location, country", auth: "No" },
            { tool: "registry.get_organization", desc: "Detalles p\u00fablicos: servicios, proveedores, config de reserva / Public details: services, providers, booking config", auth: "No" },
            { tool: "registry.manifest", desc: "Manifiesto del servidor: capacidades, versi\u00f3n, metadata / Server manifest: capabilities, protocol version, metadata", auth: "No" },
            { tool: "scheduling.check_availability", desc: "Slots disponibles (3 variables: proveedor \u2227 cliente \u2227 recurso) / Available slots (3-variable: provider \u2227 client \u2227 resource)", auth: "No" },
            { tool: "services.list", desc: "Cat\u00e1logo p\u00fablico de servicios de una organizaci\u00f3n / Public service catalog of an organization", auth: "No" },
            { tool: "a2a.get_agent_card", desc: "Agent Card A2A para descubrimiento inter-agente / A2A Agent Card for inter-agent discovery", auth: "No" },
          ]}
        />

        {/* Phase 2 */}
        <ToolPhase
          phase="Fase 2 / Phase 2"
          title="Entender / Understand"
          count={2}
          tools={[
            { tool: "service.get", desc: "Las 8 dimensiones completas de un servicio / Full 8 dimensions of a service", auth: "service:read" },
            { tool: "contract.get", desc: "T\u00e9rminos del contrato: evidencia requerida, pol\u00edtica de cancelaci\u00f3n, ventana de disputa / Contract terms: evidence required, cancellation policy, dispute window", auth: "service:read order:read" },
          ]}
        />

        {/* Phase 3 */}
        <ToolPhase
          phase="Fase 3 / Phase 3"
          title="Comprometer / Commit"
          count={3}
          tools={[
            { tool: "clients.get_or_create", desc: "Buscar o crear cliente por email/tel\u00e9fono / Find or create client by email/phone", auth: "patient:write" },
            { tool: "scheduling.book", desc: "Reservar sesi\u00f3n \u2192 requested. resource_id opcional / Book session \u2192 requested. Optional resource_id", auth: "schedule:write" },
            { tool: "scheduling.confirm", desc: "Confirmar reserva \u2192 confirmed / Confirm booking \u2192 confirmed", auth: "schedule:write" },
          ]}
        />

        {/* Phase 4 */}
        <ToolPhase
          phase="Fase 4 / Phase 4"
          title="Ciclo de vida / Lifecycle"
          count={4}
          tools={[
            { tool: "lifecycle.get_state", desc: "Estado actual, transiciones disponibles, historial / Current state, available transitions, history", auth: "service:read" },
            { tool: "lifecycle.transition", desc: "Ejecutar transici\u00f3n de estado con evidencia / Execute state transition with evidence", auth: "service:write" },
            { tool: "scheduling.reschedule", desc: "Reprogramar (pol\u00edtica de contrato puede aplicar) / Reschedule (contract policy may apply)", auth: "schedule:write" },
            { tool: "scheduling.cancel", desc: "Cancelar (pol\u00edtica de cancelaci\u00f3n aplicada) / Cancel (cancellation policy applied)", auth: "schedule:write" },
          ]}
        />

        {/* Phase 5 */}
        <ToolPhase
          phase="Fase 5 / Phase 5"
          title="Verificar entrega / Verify Delivery"
          count={3}
          tools={[
            { tool: "delivery.checkin", desc: "Check-in: GPS + timestamp \u2192 in_progress", auth: "evidence:write" },
            { tool: "delivery.checkout", desc: "Check-out: GPS + timestamp \u2192 completed (duraci\u00f3n auto-calculada / duration auto-calculated)", auth: "evidence:write" },
            { tool: "delivery.record_evidence", desc: "Registrar evidencia: gps, firma, foto, documento, duraci\u00f3n, notas / Record evidence: gps, signature, photo, document, duration, notes", auth: "evidence:write" },
          ]}
        />

        {/* Phase 6 */}
        <ToolPhase
          phase="Fase 6 / Phase 6"
          title="Cerrar / Close"
          count={4}
          tools={[
            { tool: "documentation.create", desc: "Generar registro de servicio \u2192 documented / Generate service record \u2192 documented", auth: "document:write" },
            { tool: "payments.create_sale", desc: "Crear cobro \u2192 invoiced / Create charge \u2192 invoiced", auth: "payment:write" },
            { tool: "payments.record_payment", desc: "Registrar pago recibido / Record payment received", auth: "payment:write" },
            { tool: "payments.get_status", desc: "Estado de pago o saldo del cliente / Payment status or client account balance", auth: "payment:read" },
          ]}
        />

        {/* Resource Management */}
        <ToolPhase
          phase=""
          title="Gesti\u00f3n de recursos / Resource Management"
          count={6}
          tools={[
            { tool: "resource.list", desc: "Listar recursos f\u00edsicos por organizaci\u00f3n / List physical resources by organization", auth: "resource:read" },
            { tool: "resource.get", desc: "Detalles del recurso + slots disponibles / Resource details + availability slots", auth: "resource:read" },
            { tool: "resource.create", desc: "Crear recurso (sala, box, equipo) / Create resource (room, box, equipment)", auth: "resource:write" },
            { tool: "resource.update", desc: "Actualizar recurso (patch semantics) / Update resource (patch semantics)", auth: "resource:write" },
            { tool: "resource.delete", desc: "Eliminaci\u00f3n l\u00f3gica (is_active = false) / Soft delete (is_active = false)", auth: "resource:write" },
            { tool: "resource.get_availability", desc: "Disponibilidad por rango de fechas / Availability by date range", auth: "resource:read" },
          ]}
        />

        {/* Resolver Administration */}
        <ToolPhase
          phase=""
          title="Administraci\u00f3n del resolver / Resolver Administration"
          count={3}
          tools={[
            { tool: "resolve.register", desc: "Registrar org en resolver global / Register org in global resolver", auth: "resolve:write" },
            { tool: "resolve.update_endpoint", desc: "Actualizar endpoints (portabilidad de backend) / Update endpoints (backend portability)", auth: "resolve:write" },
            { tool: "telemetry.heartbeat", desc: "Heartbeat: nodo activo / Heartbeat: node is alive", auth: "telemetry:write" },
          ]}
        />
      </section>

      {/* Section 6: Requisitos m&iacute;nimos de implementaci&oacute;n */}
      <section id="requirements" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          06
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Requisitos m&iacute;nimos <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ Minimum Implementation Requirements</span>
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          Para ser listado como una implementaci&oacute;n compatible de Servicialo:
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-6 italic">
          To be listed as a compatible Servicialo implementation:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-3 w-8">#</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Requisito / Requirement</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Referencia / Reference</th>
                <th className="font-mono text-[11px] text-text-dim py-2 text-center">Obligatorio / Mandatory</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { n: 1, req: "Modelar servicios usando las 8 dimensiones", reqEn: "Model services using the 8 dimensions", ref: "\u00a75", mandatory: true },
                { n: 2, req: "Implementar los 9 estados del ciclo de vida", reqEn: "Implement the 9 lifecycle states", ref: "\u00a76", mandatory: true },
                { n: 3, req: "Manejar al menos 3 flujos de excepci\u00f3n", reqEn: "Handle at least 3 exception flows", ref: "\u00a77", mandatory: true },
                { n: 4, req: "Exponer una API a la que un servidor MCP pueda conectarse", reqEn: "Expose an API that an MCP server can connect to", ref: "\u00a713", mandatory: true },
                { n: 5, req: "Modelar \u00d3rdenes de Servicio (schema \u00a78)", reqEn: "Model Service Orders (\u00a78 schema)", ref: "\u00a78", mandatory: false },
                { n: 6, req: "Implementar el Modelo de Agencia Delegada", reqEn: "Implement the Delegated Agency Model", ref: "\u00a710", mandatory: false },
                { n: 7, req: "Implementar Perfiles de Proveedor", reqEn: "Implement Provider Profiles", ref: "\u00a712", mandatory: false },
                { n: 8, req: "Contribuir a la Inteligencia de Red", reqEn: "Contribute to Network Intelligence", ref: "\u00a714", mandatory: false },
              ].map((row) => (
                <tr key={row.n} className="border-b border-border/50">
                  <td className="font-mono text-accent py-2.5 pr-3">{row.n}</td>
                  <td className="py-2.5 pr-4">
                    <span>{row.req}</span>
                    <br />
                    <span className="text-text-dim text-xs italic">{row.reqEn}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-text-muted">{row.ref}</td>
                  <td className="py-2.5 text-center">
                    {row.mandatory ? (
                      <span className="text-accent font-semibold">S&iacute; / Yes</span>
                    ) : (
                      <span className="text-text-dim">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 7: Superficie de API */}
      <section id="api" className="mb-14 md:mb-20 scroll-mt-20">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
          07
        </div>
        <h2 className="font-serif text-[24px] md:text-[32px] text-text leading-tight mb-4">
          Superficie de API <span className="text-text-dim font-normal text-[18px] md:text-[22px]">/ API Surface</span>
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          El servidor MCP se conecta a un backend via adaptador. El backend debe exponer endpoints cubriendo estas operaciones. Las rutas HTTP no son prescritas por el protocolo — cada implementaci&oacute;n elige su propia superficie REST.
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-8 italic">
          The MCP server connects to a backend via an adapter. The backend must expose endpoints covering these operations. HTTP routes are not prescribed by the protocol — each implementation chooses its own REST surface.
        </p>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-4">
          Descubrimiento / Discovery <span className="text-text-dim font-normal text-sm">(p&uacute;blico, sin auth / public, no auth)</span>
        </h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Operaci&oacute;n / Operation</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Input</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Output</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { op: "Buscar organizaciones / Search organizations", input: "vertical, location, country", output: "Lista de organizaciones / Organization list" },
                { op: "Obtener detalles / Get organization details", input: "org_id or slug", output: "Perfil p\u00fablico, servicios, proveedores / Public profile, services, providers" },
                { op: "Obtener manifiesto / Get server manifest", input: "\u2014", output: "Capacidades, versi\u00f3n, metadata / Capabilities, protocol version, org metadata" },
                { op: "Verificar disponibilidad / Check availability", input: "service_id, provider_id?, resource_id?, date_from, date_to", output: "Slots disponibles con puntaje de confianza / Available time slots with confidence scores" },
                { op: "Listar servicios / List services", input: "org_id", output: "Cat\u00e1logo de servicios / Service catalog" },
                { op: "Obtener agent card A2A / Get A2A agent card", input: "org_id", output: "A2A Agent Card JSON" },
              ].map((row) => (
                <tr key={row.op} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-semibold">{row.op}</td>
                  <td className="py-2.5 pr-4 text-text-muted"><code className="text-xs">{row.input}</code></td>
                  <td className="py-2.5 text-text-muted">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-4">
          Resoluci&oacute;n DNS / DNS Resolution <span className="text-text-dim font-normal text-sm">(p&uacute;blico, sin auth / public, no auth)</span>
        </h3>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Operaci&oacute;n / Operation</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Input</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Output</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { op: "Buscar endpoint de org / Lookup org endpoint", input: "org_slug", output: "URL de endpoint MCP/REST, nivel de confianza / MCP/REST endpoint URL, trust level" },
                { op: "Buscar en resolver / Search resolver", input: "country, vertical", output: "Organizaciones coincidentes / Matching organizations" },
                { op: "Obtener puntaje de confianza / Get trust score", input: "org_slug", output: "Puntaje 0\u2013100, nivel, \u00faltima actividad / Score 0\u2013100, level, last activity" },
              ].map((row) => (
                <tr key={row.op} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-semibold">{row.op}</td>
                  <td className="py-2.5 pr-4 text-text-muted"><code className="text-xs">{row.input}</code></td>
                  <td className="py-2.5 text-text-muted">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-4">
          Operaciones autenticadas / Authenticated operations <span className="text-text-dim font-normal text-sm">(API key + org ID)</span>
        </h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Operaci&oacute;n / Operation</th>
                <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Input</th>
                <th className="font-mono text-[11px] text-text-dim py-2">Output</th>
              </tr>
            </thead>
            <tbody className="text-text-body">
              {[
                { op: "Obtener servicio (8 dimensiones) / Get service (8 dimensions)", input: "service_id", output: "Objeto servicio completo / Full service object" },
                { op: "Obtener contrato / Get contract", input: "service_id or order_id", output: "T\u00e9rminos del contrato / Contract terms" },
                { op: "Obtener o crear cliente / Get or create client", input: "email or phone, name", output: "Registro de cliente / Client record" },
                { op: "Reservar sesi\u00f3n / Book session", input: "service_id, provider_id, client_id, datetime, resource_id?", output: "Reserva en estado requested / Booking in requested state" },
                { op: "Confirmar sesi\u00f3n / Confirm session", input: "booking_id", output: "Reserva en estado confirmed / Booking in confirmed state" },
                { op: "Obtener estado / Get lifecycle state", input: "session_id", output: "Estado actual + transiciones + historial / Current state + transitions + history" },
                { op: "Transicionar estado / Transition state", input: "session_id, to_state, evidence?", output: "Estado actualizado / Updated state" },
                { op: "Reprogramar / Reschedule", input: "session_id, new_datetime", output: "Sesi\u00f3n reprogramada / Rescheduled session" },
                { op: "Cancelar / Cancel", input: "session_id, reason?", output: "Sesi\u00f3n cancelada / Cancelled session" },
                { op: "Check-in", input: "session_id, gps, timestamp", output: "Sesi\u00f3n en in_progress / Session in in_progress" },
                { op: "Check-out", input: "session_id, gps, timestamp", output: "Sesi\u00f3n en completed / Session in completed" },
                { op: "Registrar evidencia / Record evidence", input: "session_id, type, payload", output: "Evidencia adjunta / Evidence attached" },
                { op: "Crear documentaci\u00f3n / Create documentation", input: "session_id, content", output: "Sesi\u00f3n en documented / Session in documented" },
                { op: "Crear cobro / Create sale", input: "session_id, amount?", output: "Venta/factura creada / Sale/invoice created" },
                { op: "Registrar pago / Record payment", input: "sale_id, method, amount", output: "Pago registrado / Payment recorded" },
                { op: "Estado de pago / Get payment status", input: "sale_id or client_id", output: "Estado de pago / saldo / Payment status / balance" },
                { op: "CRUD recursos / CRUD resources", input: "resource_id?, fields", output: "Entidad recurso / Resource entity" },
                { op: "Disponibilidad de recurso / Resource availability", input: "resource_id, date_from, date_to", output: "Slots disponibles / Available slots" },
                { op: "Registrar en resolver / Register in resolver", input: "org_slug, endpoints", output: "Registro confirmado / Registration confirmed" },
                { op: "Actualizar endpoint / Update endpoint", input: "org_slug, endpoints", output: "Endpoints actualizados / Endpoints updated" },
                { op: "Enviar heartbeat / Send heartbeat", input: "org_slug", output: "Heartbeat confirmado / Heartbeat acknowledged" },
              ].map((row) => (
                <tr key={row.op} className="border-b border-border/50">
                  <td className="py-2.5 pr-4 font-semibold">{row.op}</td>
                  <td className="py-2.5 pr-4 text-text-muted"><code className="text-xs">{row.input}</code></td>
                  <td className="py-2.5 text-text-muted">{row.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-alt rounded-lg p-4">
          <p className="text-sm text-text-muted leading-relaxed">
            <strong>Autenticaci&oacute;n:</strong> Todas las operaciones autenticadas requieren{" "}
            <code className="text-xs bg-bg px-1.5 py-0.5 rounded">X-API-Key</code> +{" "}
            <code className="text-xs bg-bg px-1.5 py-0.5 rounded">X-Org-Id</code>{" "}
            como headers. Cuando{" "}
            <code className="text-xs bg-bg px-1.5 py-0.5 rounded">actor.type = agent</code>,
            un ServiceMandate v&aacute;lido con los scopes apropiados es adicionalmente requerido.
          </p>
          <p className="text-xs text-text-dim leading-relaxed mt-2 italic">
            Authentication: All authenticated operations require X-API-Key + X-Org-Id headers. When actor.type = agent, a valid ServiceMandate with appropriate scopes is additionally required.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border pt-8">
        <p className="text-sm text-text-muted leading-relaxed mb-1">
          Esta p&aacute;gina refleja la Servicialo Protocol Spec v0.9.0 completa. Para la
          especificaci&oacute;n completa incluyendo JSON Schemas, gobernanza y extensiones
          por vertical, consulta el{" "}
          <a
            href="https://github.com/servicialo/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            repositorio en GitHub
          </a>
          .
        </p>
        <p className="text-xs text-text-dim leading-relaxed mb-5 italic">
          This page mirrors the full Servicialo Protocol Spec v0.9.0. For the complete protocol specification including JSON Schemas, governance, and vertical-specific extensions, see the GitHub repository.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/whitepaper"
            className="inline-flex items-center gap-2 border border-accent text-accent hover:bg-accent hover:text-white font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Leer el Whitepaper
          </Link>
          <a
            href="https://www.npmjs.com/package/@servicialo/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border text-text-muted hover:border-accent hover:text-accent font-mono text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Instalar MCP Server
          </a>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper component for tool phase tables                              */
/* ------------------------------------------------------------------ */

function ToolPhase({
  phase,
  title,
  count,
  isPublic,
  tools,
}: {
  phase: string;
  title: string;
  count: number;
  isPublic?: boolean;
  tools: { tool: string; desc: string; auth: string }[];
}) {
  return (
    <div className="mb-8">
      <h3 className="font-serif text-[18px] md:text-[20px] text-text mb-1">
        {phase ? `${phase} — ` : ""}
        {title}{" "}
        <span className="font-mono text-[11px] text-text-dim font-normal">
          ({count} {isPublic ? "public " : ""}tool{count !== 1 ? "s" : ""})
        </span>
      </h3>
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Tool</th>
              <th className="font-mono text-[11px] text-text-dim py-2 pr-4">Descripci&oacute;n / Description</th>
              <th className="font-mono text-[11px] text-text-dim py-2">
                {isPublic ? "Auth" : "Scopes"}
              </th>
            </tr>
          </thead>
          <tbody className="text-text-body">
            {tools.map((t) => (
              <tr key={t.tool} className="border-b border-border/50">
                <td className="py-2.5 pr-4">
                  <code className="text-xs bg-surface-alt px-1.5 py-0.5 rounded">
                    {t.tool}
                  </code>
                </td>
                <td className="py-2.5 pr-4 text-text-muted">{t.desc}</td>
                <td className="py-2.5">
                  <code className="text-xs">{t.auth}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
