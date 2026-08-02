import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MaturityBadge } from "@/components/MaturityBadge";
import { RelationDiagram } from "@/components/RelationDiagram";
import { Footer } from "@/components/Footer";
import {
  LIFECYCLE,
  MANIFEST,
  PACKAGE_VERSION,
  PROTOCOL_VERSION,
  TOOL_COUNTS,
} from "@/lib/manifest";
import { PRINCIPLES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Especificación — Servicialo",
  description: `Especificación del protocolo Servicialo v${PROTOCOL_VERSION}: objetos canónicos, dimensiones, máquinas de estado, perfiles de capacidades, bindings y requisitos de conformance.`,
};

const REPO = MANIFEST.protocol.repository;

const OBJECTS_ES: Record<string, string> = {
  service_offer: "Lo que una organización ofrece: tipo, descripción, requisitos, duración estimada, condiciones indicativas.",
  service: "Objeto wire que representa una instancia de Service Delivery, modelada en 8 dimensiones. El nombre se conserva por compatibilidad. Puede existir sola o dentro de una Orden.",
  service_order: "El acuerdo entre las partes: alcance, cliente, beneficiario, proveedor, pagador, precio, políticas, vigencia, esquema de pagos.",
  service_delivery: "La instancia atómica ejecutada: qué se entregó, quién, a quién, cuándo, dónde o por qué canal, con qué resultado. En el wire actual se representa con el objeto Service.",
  evidence_event: "Registros y atestaciones que respaldan afirmaciones sobre una entrega: confirmaciones, documentos, firmas, timestamps.",
  settlement_event: "Movimientos financieros asociados: factura, cargo, pago, devolución, contracargo, conciliación.",
  service_mandate: "Delegación explícita, acotada y revocable de un principal humano a un agente IA.",
  proof_of_service: "El expediente verificable que vincula lo acordado, lo entregado, la evidencia y la liquidación.",
};

const DIMENSIONS = [
  { n: 1, name: "Identidad (qué)", desc: "La actividad o resultado que se entrega", fields: "type, vertical, name, duration_minutes, requirements" },
  { n: 2, name: "Proveedor (quién entrega)", desc: "Profesional o entidad que entrega", fields: "provider.id, credentials, trust_score, organization_id" },
  { n: 3, name: "Cliente (quién recibe)", desc: "Beneficiario; el pagador se separa explícitamente", fields: "client.id, client.payer_id" },
  { n: 4, name: "Agenda (cuándo)", desc: "Ventana temporal del servicio", fields: "requested_at, scheduled_for, duration_expected" },
  { n: 5, name: "Ubicación (dónde)", desc: "Física o virtual; puede referenciar un Resource", fields: "type, address, resource_id, coordinates" },
  { n: 6, name: "Ciclo (estados)", desc: "Posición en las dimensiones de estado — entrega, evidencia, aceptación y liquidación, cada una con ciclo propio", fields: "current_state, transitions[], exceptions[]" },
  { n: 7, name: "Evidencia (prueba)", desc: "Cómo se respalda que ocurrió", fields: "checkin, checkout, duration_actual, evidence[], data_sensitivity" },
  { n: 8, name: "Cobro (liquidación)", desc: "Liquidación financiera, independiente del ciclo de entrega", fields: "amount, payer, status, payment_id, tax_document" },
];

const EXCEPTIONS = [
  { name: "Inasistencia del cliente", from: "confirmed", to: "cancelled (no_show)", rule: "Penalidad según política; libera el horario del proveedor" },
  { name: "Inasistencia del proveedor", from: "confirmed", to: "reassigning → scheduled", rule: "Reasignación automática; notificar al cliente" },
  { name: "Cancelación", from: "pre-entrega", to: "cancelled", rule: "Aplica política de cancelación según tiempo restante" },
  { name: "Disputa de calidad", from: "completed", to: "disputed", rule: "Congela el cobro; solicita evidencia; resuelve a verified o cancelled" },
  { name: "Reagendamiento", from: "scheduled/confirmed", to: "rescheduling → scheduled", rule: "Mantiene proveedor cuando es posible; maneja conflictos de recurso" },
  { name: "Entrega parcial", from: "in_progress", to: "partial", rule: "Documenta lo entregado; ajusta el cobro proporcionalmente" },
];

const PHASE_LABELS: Record<string, string> = {
  "0": "Fase 0 — Resolver",
  "1": "Fase 1 — Descubrimiento",
  "2": "Fase 2 — Entender",
  "3": "Fase 3 — Comprometer",
  "4": "Fase 4 — Ciclo de vida",
  "5": "Fase 5 — Verificar entrega",
  "6": "Fase 6 — Cierre",
  resource: "Gestión de recursos",
  resolver_admin: "Administración del resolver",
  network: "Inteligencia de red",
  docs: "Documentación",
};

const PHASE_ORDER = ["0", "1", "2", "3", "4", "5", "6", "resource", "resolver_admin", "network", "docs"];

const CONFORMANCE = [
  { n: 1, req: "Modelar servicios con las 8 dimensiones", ref: "§5", mandatory: true },
  { n: 2, req: "Implementar los 6 estados core del ciclo (requested → documented). Los 3 financieros son extensiones opcionales", ref: "§6", mandatory: true },
  { n: 3, req: "Manejar al menos 3 flujos de excepción", ref: "§7", mandatory: true },
  { n: 4, req: "Exponer al menos un binding máquina a máquina que implemente los perfiles Core requeridos y declare perfiles y versiones soportados — HTTP, MCP, A2A u otro equivalente. Una implementación puramente HTTP es conforme sin MCP", ref: "§13 + HTTP_PROFILE", mandatory: true },
  { n: 5, req: "Modelar Órdenes de Servicio", ref: "§8", mandatory: false },
  { n: 6, req: "Implementar el modelo de agencia delegada", ref: "§10", mandatory: false },
  { n: 7, req: "Implementar perfiles de proveedor", ref: "§12", mandatory: false },
  { n: 8, req: "Contribuir a la inteligencia de red (la red es opcional)", ref: "§14", mandatory: false },
];

function SpecSection({
  id,
  num,
  title,
  subtitle,
  children,
}: {
  id: string;
  num: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em] mb-2">
        {num}
      </div>
      <h2 className="font-serif text-[24px] md:text-[30px] text-text leading-[1.2] mb-2">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-text-muted leading-[1.7] mb-5 max-w-[640px]">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-mono text-[10px] text-text-muted uppercase tracking-[0.08em] font-semibold py-2 px-3 border-b border-border">
      {children}
    </th>
  );
}

function Td({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`py-2.5 px-3 border-b border-border-light text-[13px] align-top leading-[1.6] ${mono ? "font-mono text-[12px] text-accent" : "text-text-body"}`}>
      {children}
    </td>
  );
}

export default function SpecPage() {
  const toolsByPhaseOrdered = PHASE_ORDER.map((phase) => ({
    phase,
    label: PHASE_LABELS[phase] ?? phase,
    tools: MANIFEST.tools.filter((t) => t.phase === phase),
  })).filter((g) => g.tools.length > 0);

  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Especificación"
        title="El protocolo, en una página"
        subtitle="Referencia de lectura de la especificación. La fuente normativa es el repositorio: PROTOCOL.md (completa), SPEC.md (quick ref), los JSON Schemas y protocol/manifest.yaml (superficie legible por máquinas)."
      >
        <div className="flex flex-wrap gap-3 md:gap-5 mt-5 font-mono text-[11px] text-text-dim">
          <span>◆ Protocolo v{PROTOCOL_VERSION} ({MANIFEST.protocol.status})</span>
          <span>◆ @servicialo/mcp-server v{PACKAGE_VERSION}</span>
          <span>◆ {MANIFEST.protocol.license}</span>
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <a
            href={`${REPO}/blob/main/PROTOCOL.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            PROTOCOL.md →
          </a>
          <a
            href={`${REPO}/blob/main/SPEC.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            SPEC.md →
          </a>
          <a
            href={`${REPO}/blob/main/protocol/manifest.yaml`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            manifest.yaml →
          </a>
          <a
            href="https://spec.servicialo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-accent hover:text-text transition-colors"
          >
            spec.servicialo.com →
          </a>
        </div>
      </PageHeader>

      {/* §1 Objetos */}
      <SpecSection
        id="objects"
        num="§1 — Objetos"
        title="Objetos canónicos"
        subtitle="El protocolo define objetos y eventos legibles por máquinas. Cada uno declara si tiene JSON Schema publicado o si por ahora se especifica en prosa."
      >
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Objeto</Th>
                <Th>Qué representa</Th>
                <Th>Schema</Th>
              </tr>
            </thead>
            <tbody>
              {MANIFEST.objects.map((o) => (
                <tr key={o.id}>
                  <Td mono>
                    {o.name}
                    {o.status === "draft" && (
                      <span className="ml-2 inline-block align-middle">
                        <MaturityBadge maturity="draft" />
                      </span>
                    )}
                  </Td>
                  <Td>{OBJECTS_ES[o.id] ?? o.note ?? ""}</Td>
                  <Td>
                    {o.schema === "narrative" ? (
                      <span className="text-text-dim">prosa / derivado</span>
                    ) : (
                      <a
                        href={`${REPO}/blob/main/${o.schema}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-accent hover:underline"
                      >
                        {o.schema.replace("schema/", "")}
                      </a>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface rounded-none border border-border p-4 md:p-8">
          <RelationDiagram />
        </div>
      </SpecSection>

      {/* §2 Dimensiones */}
      <SpecSection
        id="dimensions"
        num="§2 — Dimensiones"
        title="Las 8 dimensiones de un Service"
        subtitle="Los campos mínimos para que un agente entienda y coordine un servicio."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Dimensión</Th>
                <Th>Qué captura</Th>
                <Th>Campos</Th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d.n}>
                  <Td mono>{d.n}</Td>
                  <Td><span className="font-medium text-text">{d.name}</span></Td>
                  <Td>{d.desc}</Td>
                  <Td mono>{d.fields}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpecSection>

      {/* §3 Estados */}
      <SpecSection
        id="states"
        num="§3 — Estados"
        title="Dimensiones ortogonales y camino feliz"
        subtitle="El protocolo no establece un orden total entre entrega, evidencia, aceptación y liquidación: cada dimensión conserva su propio ciclo de vida. Una implementación puede presentar una experiencia lineal; la interoperabilidad se evalúa por dimensión (PROTOCOL.md §6.0)."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              Core requerido (6)
            </div>
            <div className="font-mono text-[12px] text-text-body leading-[2]">
              {LIFECYCLE.required.join(" → ")}
            </div>
          </div>
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              Extensión financiera (3, opcional)
            </div>
            <div className="font-mono text-[12px] text-text-body leading-[2]">
              {LIFECYCLE.optional_financial.join(" → ")}
            </div>
          </div>
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              Excepción (5)
            </div>
            <div className="font-mono text-[12px] text-text-body leading-[2]">
              {LIFECYCLE.exception.join(" · ")}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-none border border-border p-5 mb-5">
          <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">
            Tracks paralelos ya presentes en el Core
          </div>
          <div className="text-[13px] text-text-body leading-[1.7] mb-3">
            El estado financiero corre en su propio track (
            <code className="font-mono text-[12px]">billing.status:</code>{" "}
            <code className="font-mono text-[12px]">{MANIFEST.state_machines.billing_status.states.join(" | ")}</code>
            ), y la Orden de Servicio tiene su propio ciclo (
            <code className="font-mono text-[12px]">{MANIFEST.state_machines.service_order.states.join(" → ")}</code>
            ).
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-text-muted">
              La proyección ortogonal completa (fulfillment / evidence /
              acceptance / financial / order) se formaliza en la extensión{" "}
              <a href="/extensions#state-dimensions" className="text-accent hover:underline">
                state-dimensions
              </a>
            </span>
            <MaturityBadge maturity="draft" />
          </div>
        </div>

        <div className="bg-surface rounded-none border border-border p-5">
          <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">
            Camino feliz (vista de 9 hitos)
          </div>
          <div className="font-mono text-[12px] text-text-body leading-[2] overflow-x-auto whitespace-nowrap">
            {LIFECYCLE.happy_path.join(" → ")}
          </div>
          <div className="mt-3 text-[12px] text-text-dim leading-[1.6]">
            Nota de implementación: el enum del tool{" "}
            <code className="font-mono">lifecycle.transition</code> de la
            implementación de referencia usa <code className="font-mono">delivered</code>/
            <code className="font-mono">charged</code> en lugar de{" "}
            <code className="font-mono">completed</code>/<code className="font-mono">invoiced</code>+
            <code className="font-mono">collected</code> — divergencia conocida,
            documentada en el manifest.
          </div>
        </div>
      </SpecSection>

      {/* §4 Excepciones */}
      <SpecSection
        id="exceptions"
        num="§4 — Excepciones"
        title="Flujos de excepción"
        subtitle="Seis flujos de primera clase. Cualquiera puede sacar la coordinación del camino feliz sin romper el protocolo."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>Excepción</Th>
                <Th>Desde</Th>
                <Th>Hacia</Th>
                <Th>Regla clave</Th>
              </tr>
            </thead>
            <tbody>
              {EXCEPTIONS.map((e) => (
                <tr key={e.name}>
                  <Td><span className="font-medium text-text">{e.name}</span></Td>
                  <Td mono>{e.from}</Td>
                  <Td mono>{e.to}</Td>
                  <Td>{e.rule}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpecSection>

      {/* §5 Perfiles */}
      <SpecSection
        id="profiles"
        num="§5 — Perfiles"
        title="Perfiles de capacidades"
        subtitle="El protocolo se organiza en perfiles. Un binding (MCP, HTTP, A2A) implementa perfiles; el número de tools de un binding puede cambiar sin redefinir el protocolo."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MANIFEST.profiles.map((p) => {
            const tools = MANIFEST.tools.filter((t) => t.profile === p.id);
            return (
              <div key={p.id} className="bg-surface rounded-none border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[13px] font-semibold text-text">
                    {p.name}
                  </span>
                  <MaturityBadge maturity={p.status} />
                </div>
                <div className="text-[12px] text-text-dim leading-[1.6]">
                  {tools.length > 0
                    ? `${tools.length} operaciones en el binding MCP de referencia`
                    : "Operaciones especificadas; sin binding implementado aún"}
                </div>
              </div>
            );
          })}
        </div>
      </SpecSection>

      {/* §6 Tools */}
      <SpecSection
        id="tools"
        num="§6 — Herramientas"
        title={`Binding MCP de referencia (${TOOL_COUNTS.total} tools)`}
        subtitle={`${TOOL_COUNTS.public} públicas (sin autenticación) + ${TOOL_COUNTS.authenticated} autenticadas (API key + org ID). Esta lista se genera desde protocol/manifest.yaml y CI la valida contra el código fuente.`}
      >
        <div className="flex flex-col gap-4">
          {toolsByPhaseOrdered.map((group) => (
            <div key={group.phase} className="bg-surface rounded-none border border-border p-4">
              <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
                {group.label} · {group.tools.length}{" "}
                {group.tools.length === 1 ? "tool" : "tools"}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {group.tools.map((t) => (
                  <span key={t.name} className="font-mono text-[12px] text-text-body">
                    {t.name}
                    {t.tier === "public" && (
                      <span className="text-green ml-1" title="pública — sin auth">°</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px] text-text-dim">
          ° = pública (sin autenticación). Operaciones especificadas pero no
          implementadas en el servidor de referencia (service_orders.*,
          mandates.*): ver{" "}
          <a href="/extensions" className="text-accent hover:underline">/extensions</a>.
        </div>
      </SpecSection>

      {/* §7 Bindings */}
      <SpecSection
        id="bindings"
        num="§7 — Bindings"
        title="Independencia del transporte"
        subtitle="Servicialo define la semántica; los bindings definen cómo se expone. La conformidad exige al menos un binding máquina a máquina que implemente los perfiles Core — ninguno en particular. MCP es la vía recomendada para integraciones agénticas, no una condición para usar el protocolo."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[13px] font-semibold text-text">HTTP</span>
              <MaturityBadge maturity={MANIFEST.bindings.http.maturity} />
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7] mb-2">
              Binding normativo para acceso máquina a máquina: perfil REST
              (v{MANIFEST.bindings.http.profile_version}) + OpenAPI 3.1. El
              protocolo no prescribe rutas: cada implementación elige su
              superficie. Suficiente por sí solo para la conformidad Core.
            </div>
            <a
              href={`${REPO}/blob/main/${MANIFEST.bindings.http.profile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:underline"
            >
              HTTP_PROFILE.md →
            </a>
          </div>
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[13px] font-semibold text-text">MCP</span>
              <MaturityBadge maturity={MANIFEST.bindings.mcp.maturity} />
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7] mb-2">
              Binding oficial que expone los perfiles como tools y resources
              MCP: {MANIFEST.bindings.mcp.package} (v{PACKAGE_VERSION}),
              transportes {MANIFEST.bindings.mcp.transports.join(" y ")}.
              Recomendado para agentes; opcional para la conformidad.
            </div>
            <a
              href="https://www.npmjs.com/package/@servicialo/mcp-server"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:underline"
            >
              npm →
            </a>
          </div>
          <div className="bg-surface rounded-none border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[13px] font-semibold text-text">A2A</span>
              <MaturityBadge maturity={MANIFEST.bindings.a2a.maturity} />
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7] mb-2">
              Binding oficial de interoperabilidad entre agentes: Agent Cards
              en {MANIFEST.bindings.a2a.agent_card} y endpoint JSON-RPC
              ({MANIFEST.bindings.a2a.endpoint}). A2A v{MANIFEST.bindings.a2a.version}.
              Superficie parcial: descubrimiento e intents de booking.
            </div>
            <a
              href="https://spec.servicialo.com/intents.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:underline"
            >
              Intents A2A →
            </a>
          </div>
        </div>
        <div className="mt-3 text-[12px] text-text-dim leading-[1.6]">
          Otros bindings son permitidos si implementan la semántica y los
          requisitos de conformidad. El header wire{" "}
          <code className="font-mono">X-Servicialo-Version: {MANIFEST.bindings.http.resolver_api_version}</code>{" "}
          versiona el API del resolver — es independiente de la versión del
          documento del protocolo (v{PROTOCOL_VERSION}).
        </div>
      </SpecSection>

      {/* §8 Conformance */}
      <SpecSection
        id="conformance"
        num="§8 — Conformance"
        title="Requisitos mínimos"
        subtitle="De PROTOCOL.md §16. Cuatro requisitos obligatorios; el resto son extensiones opcionales — incluida la red."
      >
        <div className="overflow-x-auto mb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Requisito</Th>
                <Th>Ref.</Th>
                <Th>Obligatorio</Th>
              </tr>
            </thead>
            <tbody>
              {CONFORMANCE.map((c) => (
                <tr key={c.n}>
                  <Td mono>{c.n}</Td>
                  <Td>{c.req}</Td>
                  <Td mono>{c.ref}</Td>
                  <Td>{c.mandatory ? "Sí" : "No"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface rounded-none border border-border p-5">
          <div className="font-mono text-[11px] font-semibold text-text-muted uppercase tracking-[0.08em] mb-2">
            Proceso de verificación
          </div>
          <div className="text-[13px] text-text-body leading-[1.7]">
            <span className="font-semibold text-text">Hoy es manual:</span>{" "}
            corres los tests de conformance contra tu backend, abres un PR con
            el output y el equipo revisa contra esta checklist. Una suite de
            certificación automatizada y periódica es objetivo del roadmap — no
            una capacidad actual. Nota: los mandatos delegados están
            especificados, pero la implementación de referencia no valida sus
            scopes en el boundary MCP todavía (advisory).
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <a
              href={`${REPO}/blob/main/IMPLEMENTORS.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:underline"
            >
              IMPLEMENTORS.md →
            </a>
            <a
              href={`${REPO}/blob/main/IMPLEMENTING.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-accent hover:underline"
            >
              Guía paso a paso →
            </a>
            <a href="/extensions" className="font-mono text-[11px] text-accent hover:underline">
              Extensiones y madurez →
            </a>
          </div>
        </div>
      </SpecSection>

      {/* §9 Principios */}
      <SpecSection
        id="principles"
        num="§9 — Principios"
        title="Las reglas del protocolo"
        subtitle="Siete principios que aplican a cualquier servicio en cualquier vertical (PROTOCOL.md §9)."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.title}
              className="bg-surface rounded-none py-4 px-4 md:py-[22px] md:px-6 border border-border"
            >
              <div className="font-mono text-[10px] text-accent mb-2 uppercase tracking-[0.1em]">
                Principio {String(i + 1).padStart(2, "0")}
              </div>
              <div className="font-serif text-lg text-text mb-2.5 leading-[1.3]">
                {p.title}
              </div>
              <div className="text-[13px] text-text-muted leading-[1.7]">
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </SpecSection>

      <Footer />
    </div>
  );
}
