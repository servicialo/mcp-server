export const SERVICE_ORIGINS = [
  {
    id: "asset",
    emoji: "\u{1F3E0}",
    title: "Desde un Activo",
    subtitle: "Tienes algo que otros necesitan",
    color: "blue",
    desc: "Un activo es cualquier recurso que posees y que puede generar valor para otros. No necesitas hacer nada nuevo — solo facilitar acceso.",
    examples: [
      { asset: "Un departamento vacío", service: "Hospedaje temporal", ref: "Airbnb nació así" },
      { asset: "Un auto que usas 4hrs/día", service: "Transporte bajo demanda", ref: "Uber nació así" },
      { asset: "Una cocina comercial", service: "Cocina fantasma para terceros", ref: "" },
      { asset: "Equipamiento médico", service: "Arriendo de box clínico por hora", ref: "" },
      { asset: "Un terreno", service: "Estacionamiento por hora", ref: "" },
      { asset: "Una bodega", service: "Almacenamiento bajo demanda", ref: "" },
    ],
    keyQuestion: "¿Qué tienes que otros necesitan temporalmente?",
    formula: "Activo subutilizado + Acceso facilitado = Servicio",
  },
  {
    id: "advantage",
    emoji: "\u{1F3AF}",
    title: "Desde una Ventaja",
    subtitle: "Sabes algo que otros no",
    color: "purple",
    desc: "Una ventaja es conocimiento, experiencia, red de contactos o habilidad que te da una posición privilegiada. El servicio emerge cuando transfieres esa ventaja a otros.",
    examples: [
      { asset: "Experiencia en tributación", service: "Asesoría tributaria", ref: "" },
      { asset: "Red de contactos en industria X", service: "Búsqueda de talento / reclutamiento", ref: "" },
      { asset: "Certificación en kinesiología", service: "Rehabilitación deportiva", ref: "" },
      { asset: "Dominio de un idioma", service: "Traducción / interpretación", ref: "" },
      { asset: "Experiencia en marketing digital", service: "Consultoría de crecimiento", ref: "" },
      { asset: "Conocimiento regulatorio", service: "Cumplimiento normativo como servicio", ref: "" },
    ],
    keyQuestion: "¿Qué sabes hacer que otros pagarían por aprender o delegar?",
    formula: "Conocimiento diferencial + Aplicación práctica = Servicio",
  },
  {
    id: "time",
    emoji: "\u{23F1}\u{FE0F}",
    title: "Desde tu Tiempo",
    subtitle: "Puedes hacer lo que otros no quieren o no pueden",
    color: "green",
    desc: "El servicio más básico y universal: intercambiar tu tiempo y esfuerzo por valor. No necesitas un activo especial ni conocimiento diferencial — solo disponibilidad y voluntad.",
    examples: [
      { asset: "Horas disponibles + fuerza física", service: "Mudanzas / fletes", ref: "" },
      { asset: "Tiempo + atención al detalle", service: "Limpieza profesional", ref: "" },
      { asset: "Tiempo + habilidad manual", service: "Mantenimiento del hogar", ref: "" },
      { asset: "Tiempo + paciencia", service: "Cuidado de adultos mayores", ref: "" },
      { asset: "Tiempo + presencia", service: "Paseo de mascotas", ref: "" },
      { asset: "Horas nocturnas disponibles", service: "Seguridad / vigilancia", ref: "" },
    ],
    keyQuestion: "¿Qué tiempo tienes que otros necesitan?",
    formula: "Tiempo disponible + Tarea que otros evitan = Servicio",
  },
] as const;

export const LIFECYCLE_STATES = [
  { id: "requested", label: "Solicitado", icon: "1", desc: "El cliente o su agente AI define qué necesita, cuándo y dónde. El sistema busca proveedores compatibles." },
  { id: "scheduled", label: "Agendado", icon: "2", desc: "Se asigna hora, proveedor y ubicación. Se bloquea el horario en los calendarios de ambas partes." },
  { id: "confirmed", label: "Confirmado", icon: "3", desc: "Ambas partes reconocen el compromiso. Recordatorios programados. Prerrequisitos verificados." },
  { id: "in_progress", label: "En Curso", icon: "4", desc: "Registro de entrada detectado. El servicio está siendo entregado." },
  { id: "delivered", label: "Entregado", icon: "5", desc: "El proveedor marca la entrega como completa. Evidencia capturada: duración real, notas, fotos si aplica." },
  { id: "documented", label: "Documentado", icon: "6", desc: "Registro formal generado: ficha clínica, reporte de trabajo, minuta — según la vertical." },
  { id: "charged", label: "Cobrado", icon: "7", desc: "Cargo aplicado a la cuenta del cliente. Saldo prepago debitado o deuda registrada." },
  { id: "verified", label: "Verificado", icon: "8", desc: "El cliente confirma que el servicio ocurrió y fue cobrado correctamente, o se auto-verifica tras la ventana de silencio. Cierre del ciclo." },
] as const;

export const ANATOMY = [
  { field: "Qué", desc: "La actividad o resultado que se entrega", example: "Sesión de kinesiología / Reparación eléctrica / Consulta legal" },
  { field: "Quién entrega", desc: "El proveedor del servicio", example: "Kinesiólogo certificado / Electricista SEC / Abogado tributario" },
  { field: "Quién recibe", desc: "El cliente beneficiario, con pagador separado explícitamente", example: "Paciente (paga FONASA) / Empleado (paga empresa)" },
  { field: "Cuándo", desc: "Ventana temporal acordada", example: "2026-02-10 de 10:00 a 10:45" },
  { field: "Dónde", desc: "Ubicación física o virtual", example: "Clínica / Domicilio / Videollamada" },
  { field: "Ciclo", desc: "Posición actual en los 8 estados del ciclo de vida", example: "Cobrado → próximo: Verificado" },
  { field: "Evidencia", desc: "Cómo se prueba que ocurrió", example: "Registro GPS + duración + firma del cliente" },
  { field: "Cobro", desc: "Liquidación financiera con estado independiente del ciclo", example: "$35.000 CLP · cobrado · paquete prepago" },
] as const;

export const PRINCIPLES = [
  { title: "Todo servicio tiene un ciclo", body: "No importa si es un masaje o una auditoría. Los 8 estados son universales." },
  { title: "La entrega debe ser verificable", body: "Si no puedes probar que el servicio ocurrió, no ocurrió. Servicialo define qué constituye evidencia válida para que humanos y agentes AI puedan confiar en ella." },
  { title: "El pagador no siempre es el cliente", body: "En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa explícitamente al cliente del pagador." },
  { title: "Las excepciones son la regla", body: "Inasistencias, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan." },
  { title: "Un servicio es un producto", body: "Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente AI puede descubrirlo y coordinarlo." },
  { title: "Los agentes AI son ciudadanos de primera clase", body: "El estándar está diseñado para que un agente AI pueda solicitar, verificar y cerrar un servicio con la misma confianza que un humano." },
  { title: "Cobrar no es lo mismo que pagar", body: "Un cobro se aplica a la cuenta del cliente cuando el servicio es entregado y documentado — siempre 1:1 con una sesión. El pago es el movimiento de dinero, que puede ocurrir antes (paquete prepago), después (reembolso) o en lote (factura mensual). Son eventos independientes." },
] as const;

export const SCHEMA_YAML = `# ─────────────────────────────────────────────
# SERVICIALO v0.3
# Las 8 dimensiones de un servicio profesional
# ─────────────────────────────────────────────

servicio:
  id: texto                      # Identificador único
  tipo: texto                    # Categoría del servicio
  vertical: texto                # salud | legal | hogar | educación | ...
  nombre: texto                  # Nombre legible
  duración_minutos: entero       # Duración esperada

  proveedor:
    id: texto
    credenciales: texto[]        # Certificaciones requeridas
    puntaje_confianza: número    # 0-100 calculado por historial
    organización_id: texto       # Organización padre

  cliente:
    id: texto
    pagador_id: texto            # Puede diferir del cliente

  agenda:
    solicitado_en: fecha_hora
    agendado_para: fecha_hora
    duración_esperada: minutos

  ubicación:
    tipo: presencial | virtual | domicilio
    dirección: texto
    sala: texto
    coordenadas:
      lat: número
      lng: número

  ciclo_de_vida:
    estado_actual: enum[8]       # Los 8 estados universales
    transiciones: transición[]   # Historial de cambios
    excepciones: excepción[]     # Inasistencias, disputas, etc

  prueba_de_entrega:
    entrada: fecha_hora
    salida: fecha_hora
    duración_real: minutos
    evidencia: evidencia[]       # GPS, firma, fotos, documentos

  cobro:
    monto:
      valor: número
      moneda: texto              # ISO 4217
    pagador: referencia          # Puede diferir del cliente
    estado: pendiente | cobrado | facturado | pagado | disputado
    cobrado_en: fecha_hora       # 1:1 con estado Cobrado del ciclo
    pago_id: referencia          # Pago vinculado (puede ser paquete prepago)
    documento_tributario: ref    # Boleta/factura si se emitió`;

export const EVIDENCE_BY_VERTICAL = [
  {
    vertical: "salud",
    label: "Salud",
    icon: "\u{1F3E5}",
    color: "blue" as const,
    required: [
      { type: "check_in", label: "Registro de entrada", desc: "Timestamp GPS del proveedor al llegar", auto: true },
      { type: "check_out", label: "Registro de salida", desc: "Timestamp GPS del proveedor al salir", auto: true },
      { type: "clinical_record", label: "Ficha clínica firmada", desc: "Registro clínico firmado por profesional y paciente", auto: false },
      { type: "treatment_plan", label: "Adherencia al plan", desc: "Checklist del plan de tratamiento ejecutado", auto: false },
    ],
    resolution_rule: "Si check-in/out existen y ficha clínica está firmada por ambas partes, servicio entregado. Si falta ficha o firma, escalar.",
  },
  {
    vertical: "hogar",
    label: "Hogar",
    icon: "\u{1F3E0}",
    color: "green" as const,
    required: [
      { type: "photo_before", label: "Foto antes", desc: "Foto del estado inicial con timestamp y GPS", auto: false },
      { type: "photo_after", label: "Foto después", desc: "Foto del resultado final con timestamp y GPS", auto: false },
      { type: "checklist", label: "Checklist de completitud", desc: "Lista de tareas acordadas marcadas como completadas", auto: false },
      { type: "client_signature", label: "Firma del cliente", desc: "Firma digital del cliente confirmando recepción", auto: false },
    ],
    resolution_rule: "Si fotos antes/después existen con metadata válida y checklist completo, servicio entregado. Si falta firma del cliente, escalar.",
  },
  {
    vertical: "legal",
    label: "Legal",
    icon: "\u{2696}\u{FE0F}",
    color: "purple" as const,
    required: [
      { type: "meeting_minutes", label: "Minuta de reunión", desc: "Registro de lo discutido y acordado", auto: false },
      { type: "document_delivery", label: "Entrega de documentos", desc: "Confirmación de entrega de documentos generados", auto: false },
      { type: "billing_hours", label: "Registro de horas", desc: "Log de horas facturables con descripción de actividades", auto: false },
    ],
    resolution_rule: "Si minuta existe y horas registradas están dentro del rango acordado, servicio entregado. Si horas exceden lo acordado sin justificación, escalar.",
  },
  {
    vertical: "educación",
    label: "Educación",
    icon: "\u{1F4DA}",
    color: "accent" as const,
    required: [
      { type: "attendance", label: "Registro de asistencia", desc: "Confirmación de presencia del alumno y profesor", auto: true },
      { type: "material_delivery", label: "Entrega de material", desc: "Material o tareas entregadas al alumno", auto: false },
      { type: "evaluation", label: "Registro de evaluación", desc: "Evaluación o feedback de la sesión", auto: false },
    ],
    resolution_rule: "Si asistencia registrada y material entregado, servicio entregado. Si falta evaluación y contrato la requiere, escalar.",
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
    desc: "Se solicita evidencia adicional de ambas partes. Admin o arbitraje evalúa.",
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

export const MODULES = [
  {
    id: "core",
    name: "Servicialo Core",
    status: "estable" as const,
    statusColor: "green" as const,
    desc: "Todo lo que necesitas para modelar un servicio profesional de principio a fin. Ciclo de vida completo, las 8 dimensiones del servicio, flujos de excepción, prueba de entrega y cobro.",
    audience: "Cualquier plataforma que coordine servicios profesionales — desde una clínica de kinesiología hasta un marketplace de limpieza.",
    includes: [
      "Ciclo de vida (8 estados universales)",
      "8 dimensiones del servicio",
      "Flujos de excepción (cancelación, inasistencia, reagendamiento, disputa)",
      "Prueba de entrega con evidencia por vertical",
      "Cobro con separación explícita de cargo vs pago",
      "Protocolo MCP para agentes AI (23 herramientas)",
    ],
  },
  {
    id: "finanzas",
    name: "Servicialo/Finanzas",
    status: "en diseño" as const,
    statusColor: "accent" as const,
    desc: "Distribución de pagos entre las partes involucradas. Define cómo se reparte el ingreso entre profesional, organización e infraestructura — con reglas claras de liquidación.",
    audience: "Plataformas que intermedian pagos entre clientes y profesionales, o que cobran comisiones y arriendo de infraestructura.",
    includes: [
      "Distribución de pagos a tres destinatarios",
      "Tipos: porcentaje | monto_fijo | mixto",
      "Momentos de liquidación: por_sesión | mensual | al_cierre",
      "Concepto de infraestructura (box, equipamiento, sala)",
    ],
  },
  {
    id: "disputas",
    name: "Servicialo/Disputas",
    status: "en diseño" as const,
    statusColor: "accent" as const,
    desc: "Resolución formal de disputas con arbitraje algorítmico y por pares. Define el flujo completo desde apertura hasta resolución final, con evidencia válida por vertical.",
    audience: "Plataformas con volumen suficiente para justificar arbitraje estructurado — o donde el monto por servicio hace que las disputas sean económicamente relevantes.",
    includes: [
      "Flujo de disputa estructurado",
      "Resolución algorítmica (~80% de los casos)",
      "Arbitraje por pares del mismo vertical",
      "Evidencia válida definida por vertical",
    ],
  },
] as const;

export const CONTRATO_FIELDS = [
  { field: "evidencia_requerida", desc: "Qué evidencia debe registrarse para considerar el servicio entregado", example: "check_in + check_out + ficha_clinica_firmada" },
  { field: "plazo_disputa", desc: "Ventana de tiempo para abrir una disputa después de Entregado", example: "48 horas" },
  { field: "política_cancelación", desc: "Reglas de penalización por cancelación según tiempo restante", example: "0% si >24h, 50% si 2-24h, 100% si <2h" },
  { field: "política_inasistencia", desc: "Qué ocurre si una parte no se presenta", example: "Cliente: cobra 100%. Proveedor: reasignación + penalidad" },
  { field: "arbitraje", desc: "Configuración del arbitraje por pares si aplica", example: "1 árbitro si monto < $50, 3 si >= $50" },
  { field: "monto_máximo_disputa", desc: "Monto máximo que puede disputarse sin escalamiento externo", example: "$500 USD equivalente" },
] as const;
