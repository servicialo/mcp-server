import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { MaturityBadge, type MaturityVariant } from "@/components/MaturityBadge";
import { Footer } from "@/components/Footer";
import { ADOPTION_PATH } from "@/lib/data";

export const metadata: Metadata = {
  title: "Visión — Servicialo",
  description:
    "Posibilidades futuras, líneas de investigación y visión de largo plazo del protocolo Servicialo. Nada de esta página es parte normativa del protocolo.",
};

function VisionSection({
  id,
  badge,
  tag,
  title,
  children,
}: {
  id: string;
  badge: MaturityVariant;
  tag: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-20">
      <div className="flex items-center gap-2 mb-2">
        <div className="font-mono text-[11px] font-semibold text-accent uppercase tracking-[0.12em]">
          {tag}
        </div>
        <MaturityBadge maturity={badge} />
      </div>
      <h2 className="font-serif text-[24px] md:text-[30px] text-text leading-[1.2] tracking-[-0.01em] mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function VisionPage() {
  return (
    <div className="max-w-content mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-24">
      <PageHeader
        tag="Visión"
        title="Hacia dónde apunta el protocolo"
        subtitle="Este documento describe posibilidades futuras, líneas de investigación y visión de largo plazo. Nada de esta página es parte normativa del protocolo — lo especificado vive en /spec y lo implementado en /extensions."
      />

      <div className="bg-accent-soft border border-accent/20 rounded-none py-4 px-5 mb-10">
        <div className="text-[13px] text-text-body leading-[1.7]">
          <span className="font-semibold text-text">Cómo leer esta página:</span>{" "}
          cada sección declara su estatus. <em>Visión</em> = aplicación futura
          que el protocolo podría habilitar. <em>Investigación</em> = línea de
          diseño en exploración, sin especificación ni implementación. Las
          hipótesis se enuncian como hipótesis.
        </div>
      </div>

      {/* Tesis */}
      <VisionSection id="tesis" badge="vision" tag="01 — Tesis" title="Por qué coordinar servicios merece un protocolo">
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-4">
          Los servicios son la mitad de la economía que no tiene semántica
          compartida. Los productos tienen códigos de barra, tracking y prueba
          de entrega; los servicios se confirman por WhatsApp, se registran en
          cuadernos y se liquidan contra declaraciones. El costo alto es
          sistémico: errores, rechazos, duplicidades, sobrecodificación y
          prestaciones difíciles de verificar. Quien paga absorbe la pérdida;
          el prestador legítimo cobra tarde, atrapado en la misma fila de
          sospecha. <strong>El enemigo es la ausencia de evidencia
          estructurada — no una de las partes.</strong>
        </p>
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8]">
          Si compromiso, entrega, evidencia y liquidación comparten una
          semántica común, cada capa que hoy es fricción — reembolsos,
          auditoría, reputación, acceso a crédito — puede construirse encima
          como infraestructura, no como excepción. Esa es la apuesta de largo
          plazo de Servicialo.
        </p>
      </VisionSection>

      {/* Ruta de adopción */}
      <VisionSection id="adopcion" badge="vision" tag="02 — Ruta de adopción" title="El valor no espera al pagador">
        <p className="text-sm text-text-muted leading-[1.7] mb-5 max-w-[560px]">
          No esperamos a que el pagador adopte el protocolo. Cada parte captura
          valor por su cuenta, en este orden.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ADOPTION_PATH.map((step) => (
            <div
              key={step.step}
              className="bg-surface rounded-none py-5 px-4 md:px-6 border border-border"
            >
              <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
                {step.step} · {step.actor}
              </div>
              <div className="font-serif text-lg text-text mb-2.5 leading-[1.3]">
                {step.title}
              </div>
              <div className="text-[13px] text-text-muted leading-[1.7]">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </VisionSection>

      {/* Inclusión financiera */}
      <VisionSection id="inclusion-financiera" badge="vision" tag="03 — Inclusión financiera" title="Datos de servicio como pasaporte financiero">
        <div className="bg-surface rounded-none py-5 px-4 md:px-6 border border-border mb-3">
          <div className="text-[13px] text-text-body leading-[1.7] mb-4">
            En Latinoamérica, millones de profesionales entregan servicios de
            forma informal: confirman por WhatsApp, registran pagos en un
            cuaderno y facturan con boleta. Son invisibles para la banca y para
            la tecnología, aunque sostienen la economía que los ignora.
          </div>
          <div className="text-[13px] text-text-body leading-[1.7]">
            <span className="font-semibold text-text">La hipótesis:</span>{" "}
            los datos estructurados de servicio — entregas acreditadas, tasas
            de cumplimiento, cobros conciliados contra pagos efectivos —
            podrían ser una señal de solvencia más rica que una liquidación de
            sueldo. Si esa hipótesis se valida, la Prueba de Servicio acumulada
            se convierte en una rampa de acceso a la inclusión financiera. Hoy
            no existe ningún producto de scoring ni de crédito construido sobre
            el protocolo.
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface rounded-none py-5 px-4 md:px-6 border border-border">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              El problema
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7]">
              Sin liquidación de sueldo no hay crédito. Sin crédito no hay
              tarjeta. Sin tarjeta no hay cobro automatizado. El ciclo se
              repite.
            </div>
          </div>
          <div className="bg-surface rounded-none py-5 px-4 md:px-6 border border-border">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              La señal (hipótesis)
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7]">
              Prueba de Servicio acumulada: entregas acreditadas, tasa de
              cumplimiento, cobros conciliados — como insumo de evaluación
              crediticia.
            </div>
          </div>
          <div className="bg-surface rounded-none py-5 px-4 md:px-6 border border-border">
            <div className="font-mono text-[10px] text-accent uppercase tracking-[0.08em] mb-2">
              El camino (visión)
            </div>
            <div className="text-[13px] text-text-muted leading-[1.7]">
              Contexto de servicio → scoring → productos financieros (la
              tarjeta &quot;Digitalo&quot; es una idea de producto, no un
              producto). Inclusión por diseño.
            </div>
          </div>
        </div>
      </VisionSection>

      {/* Red de confianza */}
      <VisionSection id="red-de-confianza" badge="vision" tag="04 — Red de confianza" title="Reputación derivada de entregas verificadas">
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8]">
          En una red madura de implementaciones, la reputación de un proveedor
          podría derivarse de entregas reales verificadas a través del
          protocolo — no de governance tokens, votos delegados ni métricas de
          participación. El resolver ya registra un puntaje de confianza básico
          (actividad, verificación); la reputación portable entre plataformas
          es visión: requiere múltiples implementaciones independientes y
          mecanismos de atestación que hoy no existen.
        </p>
      </VisionSection>

      {/* Arbitraje avanzado */}
      <VisionSection id="arbitraje" badge="research" tag="05 — Arbitraje avanzado" title="Disputas resueltas por evidencia, no por discrecionalidad">
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-4">
          La extensión de Disputas (en diseño,{" "}
          <a href="/extensions#disputes" className="text-accent hover:underline">
            ver /extensions
          </a>
          ) define el flujo estructurado: apertura, congelamiento del cobro,
          revisión de evidencia contra el contrato, resolución.{" "}
          <strong>Objetivo de diseño: automatizar la resolución de los casos
          cuya evidencia satisface reglas previamente acordadas.</strong>
        </p>
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8]">
          La línea de investigación va más allá: árbitros pares del mismo
          vertical profesional que evalúan los casos que la evidencia no
          resuelve, con ventanas de votación acotadas e incentivos de
          participación. No hay especificación ni implementación de arbitraje
          por pares hoy, y no publicamos porcentajes de resolución automática
          porque no existe una muestra verificable.
        </p>
      </VisionSection>

      {/* Inteligencia colectiva */}
      <VisionSection id="inteligencia-colectiva" badge="research" tag="06 — Inteligencia colectiva" title="La red que aprende de cada nodo">
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8] mb-4">
          Cada nodo que implementa el protocolo genera datos operacionales:
          patrones de agenda, tasas de inasistencia, distribuciones de precios,
          señales de demanda. Agregados con k-anonimato, esos datos podrían
          convertirse en inteligencia colectiva — como Waze, donde cada
          conductor contribuye y todos navegan mejor, sin que ningún actor sea
          dueño de la red.
        </p>
        <p className="text-sm md:text-[15px] text-text-body leading-[1.8]">
          Lo que existe hoy es la base: telemetría operacional bucketeada,
          benchmarks con k-anonimato ≥ 5 y el modelo contribuir-para-acceder
          (extensión Network Intelligence, experimental —{" "}
          <a href="/extensions#network-intelligence" className="text-accent hover:underline">
            ver /extensions
          </a>
          ). La inteligencia colectiva con efectos de red reales requiere
          decenas de nodos independientes; hoy existe una implementación en
          producción.
        </p>
      </VisionSection>

      <div className="mb-14 bg-surface rounded-none py-5 px-6 border border-border">
        <div className="text-[13px] text-text-muted leading-[1.7]">
          Lo normativo vive en{" "}
          <a href="/spec" className="text-accent hover:underline">/spec</a>; lo
          implementado y en diseño, con su madurez explícita, en{" "}
          <a href="/extensions" className="text-accent hover:underline">/extensions</a>;
          el documento histórico de origen en{" "}
          <a href="/whitepaper" className="text-accent hover:underline">/whitepaper</a>.
        </div>
      </div>

      <Footer />
    </div>
  );
}
