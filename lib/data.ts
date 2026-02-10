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
      { asset: "Una cocina comercial", service: "Dark kitchen para terceros", ref: "CloudKitchens" },
      { asset: "Equipamiento médico", service: "Arriendo de box clínico por hora", ref: "WeWork de salud" },
      { asset: "Un terreno", service: "Estacionamiento por hora", ref: "" },
      { asset: "Una bodega", service: "Almacenamiento on-demand", ref: "" },
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
      { asset: "Red de contactos en industria X", service: "Headhunting / reclutamiento", ref: "" },
      { asset: "Certificación en kinesiología", service: "Rehabilitación deportiva", ref: "Tu clínica piloto" },
      { asset: "Dominio de un idioma", service: "Traducción / interpretación", ref: "" },
      { asset: "Experiencia en marketing digital", service: "Consultoría de growth", ref: "" },
      { asset: "Conocimiento regulatorio", service: "Compliance as a service", ref: "" },
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
  { id: "requested", label: "Solicitado", icon: "1", desc: "El cliente o su agente AI define qué necesita, cuándo y dónde. El sistema busca providers compatibles." },
  { id: "matched", label: "Asignado", icon: "2", desc: "Se selecciona el mejor provider según disponibilidad, ubicación, especialidad, rating y precio. El provider acepta." },
  { id: "scheduled", label: "Agendado", icon: "3", desc: "Se bloquea el slot en los calendarios de ambas partes. Confirmaciones automáticas enviadas." },
  { id: "confirmed", label: "Confirmado", icon: "4", desc: "Ambas partes reconfirmaron. Recordatorios programados. Pre-requisitos verificados (documentos, pagos previos, etc)." },
  { id: "in_progress", label: "En Curso", icon: "5", desc: "Check-in del provider verificado. Cronómetro activo. El servicio está siendo entregado." },
  { id: "completed", label: "Completado", icon: "6", desc: "El servicio terminó. Evidencia capturada: duración real, notas, firma del cliente, fotos si aplica." },
  { id: "documented", label: "Documentado", icon: "7", desc: "Registro formal generado: ficha clínica, reporte de trabajo, minuta de reunión — según la vertical." },
  { id: "billed", label: "Facturado", icon: "8", desc: "Cobro emitido al pagador: cliente directo, aseguradora, empresa, o plataforma. Documento tributario generado." },
  { id: "closed", label: "Cerrado", icon: "9", desc: "Ciclo completo. Rating bidireccional registrado. Datos disponibles para análisis y para agentes AI." },
] as const;

export const ANATOMY = [
  { field: "Qué", desc: "La actividad o resultado que se entrega", example: "Sesión de kinesiología / Reparación eléctrica / Consulta legal" },
  { field: "Quién entrega", desc: "El proveedor del servicio (provider)", example: "Kinesiólogo certificado / Electricista SEC / Abogado tributario" },
  { field: "Quién recibe", desc: "El beneficiario del servicio (client)", example: "Paciente / Propietario / Empresa" },
  { field: "Quién paga", desc: "No siempre es quien recibe", example: "FONASA paga por el paciente / Empresa paga por el empleado" },
  { field: "Cuándo", desc: "Ventana temporal acordada", example: "2026-02-10 de 10:00 a 10:45" },
  { field: "Dónde", desc: "Ubicación física o virtual", example: "Clínica / Domicilio / Videollamada" },
  { field: "Evidencia", desc: "Cómo se prueba que ocurrió", example: "Check-in GPS + duración + registro clínico firmado" },
  { field: "Resultado", desc: "Qué quedó como output documentado", example: "Ficha clínica / Fotos antes-después / Minuta" },
] as const;

export const PRINCIPLES = [
  { title: "Todo servicio tiene un ciclo", body: "No importa si es un masaje o una auditoría. Los 9 estados son universales." },
  { title: "La entrega debe ser verificable", body: "Si no puedes probar que el servicio ocurrió, no ocurrió. Servicialo define qué constituye evidencia válida para que humanos y agentes AI puedan confiar en ella." },
  { title: "El pagador no siempre es el cliente", body: "En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa beneficiario, solicitante y pagador." },
  { title: "Las excepciones son la regla", body: "No-shows, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan." },
  { title: "Un servicio es un producto", body: "Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente AI puede descubrirlo y coordinarlo." },
  { title: "Los agentes AI son ciudadanos de primera clase", body: "El estándar está diseñado para que un agente AI pueda solicitar, verificar y cerrar un servicio con la misma confianza que un humano." },
] as const;

export const SCHEMA_YAML = `service:
  id: string                  # Identificador único
  type: string                # Categoría del servicio
  vertical: string            # salud | legal | hogar | educación | ...

  provider:
    id: string
    credentials: string[]     # Certificaciones requeridas
    trust_score: number       # 0-100 calculado por historial

  client:
    id: string
    payer_id: string          # Puede diferir del client

  scheduling:
    requested_at: datetime
    scheduled_for: datetime
    duration_expected: minutes
    location: physical | virtual

  lifecycle:
    current_state: enum[9]    # Los 9 estados universales
    transitions: transition[]  # Historial de cambios
    exceptions: exception[]    # No-shows, disputas, etc

  delivery_proof:
    checkin: datetime
    checkout: datetime
    duration_actual: minutes
    evidence: evidence[]      # GPS, firma, fotos, docs

  documentation:
    record_type: string       # Ficha clínica, minuta, reporte
    generated_at: datetime
    signed_by: string[]

  billing:
    amount: money
    payer: reference
    status: pending | billed | paid | disputed
    tax_document: reference`;
