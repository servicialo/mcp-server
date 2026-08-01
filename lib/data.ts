/**
 * Copy compartido del sitio. Los números y versiones NO viven aquí:
 * se derivan de protocol/manifest.yaml vía lib/manifest.ts.
 */

import { PROOF_OF_SERVICE } from "./manifest";

// Los 7 principios del protocolo (PROTOCOL.md §9) — renderizados en /spec.
export const PRINCIPLES = [
  { title: "Todo servicio tiene un ciclo observable", body: "No importa si es un masaje o una auditoría. El protocolo define estados independientes para observar el ciclo completo: entrega, evidencia, aceptación y liquidación — cada dimensión con su propio ciclo de vida, sin un orden total entre ellas." },
  { title: "La entrega debe ser verificable y liquidable", body: "Sin evidencia suficiente, una entrega no puede considerarse acreditada con el nivel de certeza requerido. El protocolo define qué constituye evidencia válida para humanos y agentes IA. Y verificable no basta: la liquidación se concilia con la prueba, no con una declaración." },
  { title: "El pagador no siempre es el cliente", body: "En salud paga la aseguradora. En corporativo la empresa. En educación el apoderado. El protocolo separa explícitamente al cliente del pagador." },
  { title: "Las excepciones son la regla", body: "Inasistencias, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando algo falla." },
  { title: "Un servicio es un producto legible por máquinas", body: "Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente IA puede descubrirlo, coordinarlo y cerrarlo con la misma confianza que un humano." },
  { title: "El acuerdo es separado de la entrega", body: "La Orden de Servicio define lo acordado. Los servicios atómicos definen lo entregado. Son objetos distintos con ciclos de vida distintos." },
  { title: "El protocolo separa lo acordado, lo entregado, la evidencia y el dinero", body: "Cuatro elementos explícitos, cada uno con su propio ciclo. Una Prueba de Servicio es el expediente que los vincula — no una declaración de que todo salió bien." },
] as const;

// ── Prueba de Servicio: tres dimensiones relacionadas pero independientes ──
// Los ids, keys y estados canónicos viven en protocol/manifest.yaml
// (proof_of_service). Aquí solo vive el copy en español, keyed por `key`.

const CERTAINTY_COPY: Record<string, { name: string; desc: string }> = {
  asserted: {
    name: "Afirmado",
    desc: "Una parte afirma que la entrega ocurrió. La declaración queda registrada, sin corroboración aún.",
  },
  bilateral: {
    name: "Atestación bilateral",
    desc: "Proveedor y receptor presentan atestaciones compatibles sobre la misma entrega.",
  },
  operationally_supported: {
    name: "Respaldo operacional",
    desc: "Existe evidencia operacional adicional: registros de entrada y salida, duración real, ubicación o canal, documentos firmados.",
  },
  financially_reconciled: {
    name: "Conciliación financiera",
    desc: "Además, existe conciliación con eventos financieros relacionados. Suma evidencia — no vuelve la entrega “más verdadera” ni prueba por sí sola la calidad o el alcance entregado.",
  },
};

export const CERTAINTY_LEVELS = PROOF_OF_SERVICE.certainty_levels.map((l) => ({
  level: l.id,
  key: l.key,
  name: CERTAINTY_COPY[l.key]?.name ?? l.name,
  desc: CERTAINTY_COPY[l.key]?.desc ?? "",
}));

const DOSSIER_COPY: Record<string, { name: string; desc: string; exception?: boolean }> = {
  draft: { name: "Borrador", desc: "El expediente se está componiendo: afirmaciones y evidencia en recolección." },
  supported: { name: "Respaldado", desc: "La evidencia registrada respalda la entrega; aún no se evalúa contra una política." },
  accredited: { name: "Acreditado", desc: "La evidencia satisface la política de acreditación aplicable. Puede ocurrir en L1, L2, L3 o L4 — con o sin pago." },
  disputed: { name: "Disputado", desc: "Una parte disputa la entrega o su evidencia.", exception: true },
  revoked: { name: "Revocado", desc: "La acreditación fue retirada tras nueva evidencia o resolución.", exception: true },
};

export const DOSSIER_STATES = PROOF_OF_SERVICE.dossier_states.map((s) => ({
  id: s,
  name: DOSSIER_COPY[s]?.name ?? s,
  desc: DOSSIER_COPY[s]?.desc ?? "",
  exception: DOSSIER_COPY[s]?.exception ?? false,
}));

const SETTLEMENT_COPY: Record<string, string> = {
  not_required: "sin liquidación (entrega gratuita o interna)",
  pending: "liquidación esperada, aún sin facturar",
  invoiced: "factura o cargo emitido",
  partially_paid: "pago parcial recibido",
  paid: "pagado en su totalidad",
  refunded: "pago devuelto",
  charged_back: "pago revertido por el riel del pagador",
  written_off: "liquidación abandonada o condonada",
};

export const SETTLEMENT_STATES = PROOF_OF_SERVICE.settlement_states.map((s) => ({
  id: s,
  desc: SETTLEMENT_COPY[s] ?? "",
}));

export const ADOPTION_PATH = [
  {
    step: "01",
    actor: "Prestador",
    title: "Acredita lo que entrega",
    desc: "Cada prestación de su operación real genera una Prueba de Servicio como subproducto de trabajar, no como trabajo extra.",
  },
  {
    step: "02",
    actor: "Cliente",
    title: "Respalda su reembolso",
    desc: "Usa esa evidencia para sustentar reembolsos y reducir rechazos, sin pedirle permiso al pagador.",
  },
  {
    step: "03",
    actor: "Pagador",
    title: "Recibe un expediente verificable",
    desc: "Ve qué prestaciones ya llegan acreditadas y dónde se pierde dinero por documentación deficiente, sin cambiar su sistema.",
  },
] as const;

export const EVIDENCE_BY_VERTICAL = [
  {
    vertical: "salud",
    label: "Salud",
    icon: "\u{1F3E5}",
    color: "blue" as const,
    required: [
      { type: "check_in", label: "Registro de entrada", desc: "Marca temporal GPS del proveedor al llegar", auto: true },
      { type: "check_out", label: "Registro de salida", desc: "Marca temporal GPS del proveedor al salir", auto: true },
      { type: "clinical_record", label: "Ficha clínica firmada", desc: "Registro clínico firmado por profesional y paciente", auto: false },
      { type: "treatment_plan", label: "Adherencia al plan", desc: "Lista de verificación del plan de tratamiento ejecutado", auto: false },
    ],
    resolution_rule: "Si registros de entrada/salida existen y ficha clínica está firmada por ambas partes, la entrega se acredita. Si falta ficha o firma, escalar.",
  },
  {
    vertical: "hogar",
    label: "Hogar",
    icon: "\u{1F3E0}",
    color: "green" as const,
    required: [
      { type: "photo_before", label: "Foto antes", desc: "Foto del estado inicial con marca temporal y GPS", auto: false },
      { type: "photo_after", label: "Foto después", desc: "Foto del resultado final con marca temporal y GPS", auto: false },
      { type: "checklist", label: "Lista de verificación", desc: "Lista de tareas acordadas marcadas como completadas", auto: false },
      { type: "client_signature", label: "Firma del cliente", desc: "Firma digital del cliente confirmando recepción", auto: false },
    ],
    resolution_rule: "Si fotos antes/después existen con metadatos válidos y lista de verificación completa, la entrega se acredita. Si falta firma del cliente, escalar.",
  },
  {
    vertical: "legal",
    label: "Legal",
    icon: "\u{2696}\u{FE0F}",
    color: "purple" as const,
    required: [
      { type: "meeting_minutes", label: "Minuta de reunión", desc: "Registro de lo discutido y acordado", auto: false },
      { type: "document_delivery", label: "Entrega de documentos", desc: "Confirmación de entrega de documentos generados", auto: false },
      { type: "billing_hours", label: "Registro de horas", desc: "Registro de horas facturables con descripción de actividades", auto: false },
    ],
    resolution_rule: "Si minuta existe y horas registradas están dentro del rango acordado, la entrega se acredita. Si horas exceden lo acordado sin justificación, escalar.",
  },
  {
    vertical: "educación",
    label: "Educación",
    icon: "\u{1F4DA}",
    color: "accent" as const,
    required: [
      { type: "attendance", label: "Registro de asistencia", desc: "Confirmación de presencia del alumno y profesor", auto: true },
      { type: "material_delivery", label: "Entrega de material", desc: "Material o tareas entregadas al alumno", auto: false },
      { type: "evaluation", label: "Registro de evaluación", desc: "Evaluación o retroalimentación de la sesión", auto: false },
    ],
    resolution_rule: "Si asistencia registrada y material entregado, la entrega se acredita. Si falta evaluación y contrato la requiere, escalar.",
  },
] as const;

export const DISPUTE_RESOLUTION_FLOW = [
  {
    step: 1,
    id: "apertura",
    label: "Apertura de disputa",
    desc: "Cualquier parte puede abrir una disputa dentro del plazo definido. Se congela el cobro automáticamente.",
    actor: "cliente | proveedor | agente",
  },
  {
    step: 2,
    id: "revision_evidencia",
    label: "Revisión de evidencia",
    desc: "Se solicita evidencia adicional de ambas partes. Se compara contra lo acordado en el contrato.",
    actor: "sistema | admin",
  },
  {
    step: 3,
    id: "resolucion",
    label: "Resolución",
    desc: "Si proveedor gana: Cobrado → Verificado. Si cliente gana: Cancelado con balance restaurado.",
    actor: "admin | arbitraje",
  },
] as const;

// Copy en español por extensión del protocolo. La madurez, el orden y los
// docs canónicos vienen del manifest (EXTENSIONS) — esto es solo prosa.
export const EXTENSIONS_COPY: Record<
  string,
  { tagline: string; defines: string[]; status: string }
> = {
  "evidence-profiles": {
    tagline: "Qué constituye evidencia válida de una entrega, por vertical.",
    defines: [
      "Envelope común de evidencia (tipo, actor, método, sensibilidad)",
      "Perfiles por vertical: salud, hogar, legal, educación, consultoría",
      "Niveles de certeza acumulativos (L1–L4) de una Prueba de Servicio",
    ],
    status: "Schemas publicados y usados por la implementación de referencia. Los niveles de certeza son parte del borrador Proof of Service.",
  },
  settlement: {
    tagline: "Distribución de pagos entre profesional, organización e infraestructura.",
    defines: [
      "Track de estado financiero independiente del ciclo de entrega",
      "Distribución a múltiples destinatarios (porcentaje | monto fijo | mixto)",
      "Momentos de liquidación: por sesión | mensual | al cierre",
    ],
    status: "El track billing.* y las tools payments.* están implementados; la distribución multi-destinatario está en diseño.",
  },
  disputes: {
    tagline: "Resolución formal de desacuerdos sobre una entrega.",
    defines: [
      "Flujo estructurado: apertura → revisión de evidencia → resolución",
      "Congelamiento automático del cobro durante la disputa",
      "Contrato pre-acordado como criterio de resolución",
    ],
    status: "En diseño. Objetivo: automatizar la resolución de casos cuya evidencia satisface reglas previamente acordadas. El arbitraje por pares es una línea de investigación (ver /vision).",
  },
  "delegated-agency": {
    tagline: "Delegación explícita, acotada y revocable de un humano a un agente IA.",
    defines: [
      "ServiceMandate: principal, agente, alcances, vigencia, revocación",
      "Scopes por recurso y acción (schedule:write, payment:read, …)",
      "Registro de auditoría de acciones de agentes",
    ],
    status: "Especificada e implementada como capa de servicio; los scopes son advisory en la implementación de referencia (no se validan aún en el boundary MCP).",
  },
  "network-intelligence": {
    tagline: "Benchmarks operacionales agregados y anónimos entre nodos.",
    defines: [
      "Eventos operacionales bucketeados (sin datos individuales)",
      "k-anonimato ≥ 5 organizaciones por segmento",
      "Modelo contribuir-para-acceder",
    ],
    status: "Lado de lectura implementado (market.list_segments, market.get_benchmark); el modelo de acumulación de contribución está en progreso. Opcional: el protocolo funciona sin la red.",
  },
  "state-dimensions": {
    tagline: "Máquinas de estado ortogonales: entrega, evidencia, aceptación y liquidación.",
    defines: [
      "Cinco enums por dimensión (fulfillment, evidence, acceptance, financial, order)",
      "Regla de no-orden-total entre dimensiones",
      "Mapeo desde los enums wire actuales (aditivo, sin breaking changes)",
    ],
    status: "Borrador. Formaliza la semántica que el Core ya enuncia en PROTOCOL.md §6.0.",
  },
  "proof-of-service": {
    tagline: "El expediente verificable que vincula lo acordado, lo entregado, la evidencia y la liquidación.",
    defines: [
      "Composición del expediente a partir de objetos existentes del Core",
      "Tres dimensiones independientes: nivel de certeza (L1–L4), estado del expediente (acreditación por política) y estado de liquidación",
      "Regla de presentación: la prueba nunca se muestra sin su nivel de certeza y su estado de expediente",
    ],
    status: "Borrador. No existe objeto wire todavía — el documento especifica el compuesto objetivo, derivable de los objetos actuales.",
  },
  webhooks: {
    tagline: "Notificaciones push de eventos del registry y de benchmarks.",
    defines: [
      "Suscripciones con verificación HMAC-SHA256",
      "Reintentos con backoff y desactivación automática",
      "Eventos: registry y snapshot semanal de benchmarks",
    ],
    status: "v0.2 — eventos del registry estables; superficie en expansión.",
  },
};

// Superficie HTTP propia de servicialo.com (resolver + proxy de descubrimiento).
// El protocolo NO prescribe rutas HTTP: el binding normativo es spec/HTTP_PROFILE.md.
export const OWN_HTTP_SURFACE = [
  { method: "GET", path: "/api/servicialo/manifest", desc: "Manifest del resolver: capacidades, endpoints, bindings" },
  { method: "GET", path: "/api/servicialo/registry", desc: "Organizaciones descubribles" },
  { method: "GET", path: "/api/servicialo/resolve/{country}/{org}", desc: "Resolución slug → endpoint + nivel de confianza" },
  { method: "POST", path: "/api/servicialo/resolve/register", desc: "Alta de organización en el resolver" },
  { method: "GET", path: "/api/servicialo/{org}/services", desc: "Catálogo de servicios (proxy al endpoint registrado)" },
  { method: "GET", path: "/api/servicialo/{org}/availability", desc: "Disponibilidad (proxy al endpoint registrado)" },
  { method: "POST", path: "/api/servicialo/{org}/book", desc: "Booking (proxy al endpoint registrado)" },
  { method: "POST", path: "/api/servicialo/{org}/a2a", desc: "JSON-RPC A2A: message/send, tasks/get, tasks/cancel" },
  { method: "GET", path: "/api/registry/search", desc: "Búsqueda en el registry canónico" },
  { method: "GET", path: "/api/registry/{verticals|regions|event_types}", desc: "Descubrimiento cold-start de taxonomía" },
  { method: "GET", path: "/api/benchmarks", desc: "Benchmarks agregados (k-anonimato ≥ 5)" },
] as const;

export const CONTRATO_FIELDS = [
  { field: "evidencia_requerida", desc: "Qué evidencia debe registrarse para considerar el servicio entregado", example: "registro_entrada + registro_salida + ficha_clinica_firmada" },
  { field: "plazo_disputa", desc: "Ventana de tiempo para abrir una disputa después de la entrega", example: "48 horas" },
  { field: "política_cancelación", desc: "Reglas de penalización por cancelación según tiempo restante", example: "p. ej.: 0% si >24h, 50% si 2-24h, 100% si <2h — política ilustrativa; cada implementación define la suya" },
  { field: "política_inasistencia", desc: "Qué ocurre si una parte no se presenta", example: "p. ej.: cliente ausente → se cobra según política; proveedor ausente → reasignación + penalidad" },
  { field: "arbitraje", desc: "Configuración del arbitraje si aplica (extensión Disputas, en diseño)", example: "p. ej.: 1 árbitro si monto < $50, 3 si >= $50" },
  { field: "monto_máximo_disputa", desc: "Monto máximo que puede disputarse sin escalamiento externo", example: "p. ej.: $500 USD equivalente" },
] as const;
