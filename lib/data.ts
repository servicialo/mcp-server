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
  { id: "matched", label: "Asignado", icon: "2", desc: "Se selecciona el mejor proveedor según disponibilidad, ubicación, especialidad, calificación y precio. El proveedor acepta." },
  { id: "scheduled", label: "Agendado", icon: "3", desc: "Se bloquea el horario en los calendarios de ambas partes. Confirmaciones automáticas enviadas." },
  { id: "confirmed", label: "Confirmado", icon: "4", desc: "Ambas partes reconfirmaron. Recordatorios programados. Prerrequisitos verificados (documentos, pagos previos, etc)." },
  { id: "in_progress", label: "En Curso", icon: "5", desc: "Registro de entrada del proveedor verificado. Cronómetro activo. El servicio está siendo entregado." },
  { id: "completed", label: "Completado", icon: "6", desc: "El servicio terminó. Evidencia capturada: duración real, notas, firma del cliente, fotos si aplica." },
  { id: "documented", label: "Documentado", icon: "7", desc: "Registro formal generado: ficha clínica, reporte de trabajo, minuta de reunión — según la vertical." },
  { id: "billed", label: "Facturado", icon: "8", desc: "Cobro emitido al pagador: cliente directo, aseguradora, empresa, o plataforma. Documento tributario generado." },
  { id: "closed", label: "Cerrado", icon: "9", desc: "Ciclo completo. Calificación bidireccional registrada. Datos disponibles para análisis y para agentes AI." },
] as const;

export const ANATOMY = [
  { field: "Qué", desc: "La actividad o resultado que se entrega", example: "Sesión de kinesiología / Reparación eléctrica / Consulta legal" },
  { field: "Quién entrega", desc: "El proveedor del servicio", example: "Kinesiólogo certificado / Electricista SEC / Abogado tributario" },
  { field: "Quién recibe", desc: "El beneficiario directo del servicio", example: "Paciente / Propietario / Alumno" },
  { field: "Quién solicita", desc: "Quien inicia y gestiona — puede diferir del beneficiario", example: "Hijo agenda para su madre / RRHH agenda para empleado" },
  { field: "Quién paga", desc: "No siempre es quien recibe ni quien solicita", example: "FONASA paga por el paciente / Empresa paga por el empleado" },
  { field: "Cuándo", desc: "Ventana temporal acordada", example: "2026-02-10 de 10:00 a 10:45" },
  { field: "Dónde", desc: "Ubicación física o virtual", example: "Clínica / Domicilio / Videollamada" },
  { field: "Evidencia", desc: "Cómo se prueba que ocurrió", example: "Registro GPS + duración + ficha clínica firmada" },
  { field: "Resultado", desc: "Qué quedó como resultado documentado", example: "Ficha clínica / Fotos antes-después / Minuta" },
] as const;

export const PRINCIPLES = [
  { title: "Todo servicio tiene un ciclo", body: "No importa si es un masaje o una auditoría. Los 9 estados son universales." },
  { title: "La entrega debe ser verificable", body: "Si no puedes probar que el servicio ocurrió, no ocurrió. Servicialo define qué constituye evidencia válida para que humanos y agentes AI puedan confiar en ella." },
  { title: "El pagador no siempre es el cliente", body: "En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa beneficiario, solicitante y pagador." },
  { title: "Las excepciones son la regla", body: "Inasistencias, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan." },
  { title: "Un servicio es un producto", body: "Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente AI puede descubrirlo y coordinarlo." },
  { title: "Los agentes AI son ciudadanos de primera clase", body: "El estándar está diseñado para que un agente AI pueda solicitar, verificar y cerrar un servicio con la misma confianza que un humano." },
  { title: "Las reglas se acuerdan antes, no después", body: "El contrato de servicio define qué evidencia se requiere, qué pasa si alguien cancela, y cómo se resuelven disputas. Una vez que ambas partes aceptan, las reglas son inmutables. Ni el proveedor, ni el cliente, ni la plataforma pueden cambiarlas unilateralmente." },
] as const;

export const SCHEMA_YAML = `# ─────────────────────────────────────────────
# SERVICIALO CORE
# Todo lo necesario para modelar un servicio
# ─────────────────────────────────────────────

servicio:
  id: texto                      # Identificador único
  tipo: texto                    # Categoría del servicio
  vertical: texto                # salud | legal | hogar | educación | ...

  proveedor:
    id: texto
    credenciales: texto[]        # Certificaciones requeridas
    puntaje_confianza: número    # 0-100 calculado por historial

  partes:
    beneficiario:                # Quién recibe el servicio
      id: texto
      relación: texto            # paciente | alumno | propietario
    solicitante:                 # Quién inicia y gestiona
      id: texto
      relación: texto            # mismo | familiar | empleador
    pagador:                     # Quién paga
      id: texto
      tipo: persona | org | aseguradora

  contrato_de_servicio:          # Reglas acordadas ANTES del compromiso
    evidencia_requerida: tipo[]  # Qué pruebas se necesitan
    plazo_disputa: duración      # Ventana para abrir disputa
    política_cancelación: regla[]
    política_inasistencia: regla[]
    arbitraje:
      habilitado: booleano
      árbitros: 1 | 3
      plazo_voto: duración

  agenda:
    solicitado_en: fecha_hora
    agendado_para: fecha_hora
    duración_esperada: minutos
    ubicación: presencial | virtual

  ciclo_de_vida:
    estado_actual: enum[9]       # Los 9 estados universales
    transiciones: transición[]   # Historial de cambios
    excepciones: excepción[]     # Inasistencias, disputas, etc

  prueba_de_entrega:
    entrada: fecha_hora
    salida: fecha_hora
    duración_real: minutos
    evidencia: evidencia[]       # GPS, firma, fotos, documentos

  documentación:
    tipo_registro: texto         # Ficha clínica, minuta, reporte
    generado_en: fecha_hora
    firmado_por: texto[]

  facturación:
    monto: dinero
    pagador: referencia          # Apunta a partes.pagador
    estado: pendiente | facturado | pagado | disputado | reembolsado
    documento_tributario: referencia

# ─────────────────────────────────────────────
# MÓDULO: Servicialo/Finanzas (en diseño)
# Distribución de pagos entre partes
# ─────────────────────────────────────────────

  distribución:                  # Servicialo/Finanzas
    profesional:
      tipo: porcentaje | monto_fijo | mixto
      valor: número
      liquidación: por_sesión | mensual
    organización:
      tipo: porcentaje | monto_fijo
      valor: número
    infraestructura:
      tipo: monto_fijo | porcentaje
      valor: número
      concepto: box | equipamiento | sala

# ─────────────────────────────────────────────
# MÓDULO: Servicialo/Disputas (en diseño)
# Resolución formal de disputas
# ─────────────────────────────────────────────

  resolución:                    # Servicialo/Disputas
    estado: ninguna | en_revisión | en_arbitraje | resuelta
    evidencia_evaluada: evaluación[]
    resultado: a_favor_proveedor | a_favor_cliente | ambiguo
    arbitraje:
      árbitros: referencia[]
      votos: voto[]
    resolución_final: referencia
    resuelta_en: fecha_hora`;

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
    desc: "Cualquier parte puede abrir una disputa dentro del plazo definido en el contrato de servicio. Se congela el pago automáticamente.",
    actor: "cliente | proveedor | agente",
  },
  {
    step: 2,
    id: "revision_evidencia",
    label: "Revisión algorítmica",
    desc: "El sistema compara la evidencia registrada contra la evidencia_requerida del contrato de servicio. Sin intervención humana.",
    actor: "sistema",
  },
  {
    step: 3,
    id: "resolucion_automatica",
    label: "Resolución automática",
    desc: "Si toda la evidencia requerida existe y es válida: a favor del proveedor. Si falta evidencia requerida: a favor del cliente. ~80% de disputas se resuelven aquí.",
    actor: "sistema",
  },
  {
    step: 4,
    id: "escalamiento",
    label: "Escalamiento a arbitraje",
    desc: "Si la evidencia es ambigua o contradictoria, se escala a un panel de árbitros del mismo vertical profesional.",
    actor: "sistema",
  },
  {
    step: 5,
    id: "arbitraje",
    label: "Arbitraje por pares",
    desc: "1-3 árbitros del mismo vertical con puntaje de confianza >= 80 revisan evidencia y votan. Mayoría simple decide. 48 horas para votar.",
    actor: "árbitros",
  },
  {
    step: 6,
    id: "resolucion_final",
    label: "Resolución final",
    desc: "Pago liberado o reembolsado según resolución. Puntaje de confianza ajustado para ambas partes. Historial de disputa registrado.",
    actor: "sistema",
  },
] as const;

export const MODULES = [
  {
    id: "core",
    name: "Servicialo Core",
    status: "estable" as const,
    statusColor: "green" as const,
    desc: "Todo lo que necesitas para modelar un servicio profesional de principio a fin. Ciclo de vida completo, las 9 dimensiones del servicio, flujos de excepción y prueba de entrega.",
    audience: "Cualquier plataforma que coordine servicios profesionales — desde una clínica de kinesiología hasta un marketplace de limpieza.",
    includes: [
      "Ciclo de vida (9 estados universales)",
      "9 dimensiones del servicio",
      "Flujos de excepción (cancelación, inasistencia, reagendamiento)",
      "Prueba de entrega con evidencia por vertical",
      "Contrato de servicio pre-acordado",
      "Protocolo MCP para agentes AI",
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
      "Flujo de disputa en 6 pasos",
      "Resolución algorítmica (~80% de los casos)",
      "Arbitraje por pares del mismo vertical",
      "Evidencia válida definida por vertical",
    ],
  },
] as const;

export const CONTRATO_FIELDS = [
  { field: "evidencia_requerida", desc: "Qué evidencia debe registrarse para considerar el servicio entregado", example: "check_in + check_out + ficha_clinica_firmada" },
  { field: "plazo_disputa", desc: "Ventana de tiempo para abrir una disputa después de Completado", example: "48 horas" },
  { field: "política_cancelación", desc: "Reglas de penalización por cancelación según tiempo restante", example: "0% si >24h, 50% si 2-24h, 100% si <2h" },
  { field: "política_inasistencia", desc: "Qué ocurre si una parte no se presenta", example: "Cliente: cobra 100%. Proveedor: reasignación + penalidad" },
  { field: "arbitraje", desc: "Configuración del arbitraje por pares si aplica", example: "1 árbitro si monto < $50, 3 si >= $50" },
  { field: "monto_máximo_disputa", desc: "Monto máximo que puede disputarse sin escalamiento externo", example: "$500 USD equivalente" },
] as const;
