<div align="center">

# Servicialo

**La capa de orquestación para la economía de servicios en la era de agentes AI**

Un protocolo abierto para coordinación de agenda, identidad, verificación<br>
de entrega y liquidación financiera de servicios profesionales.

`Protocolo abierto` `Legible por máquinas` `Agent-native` `Apache-2.0`

[Sitio web](https://servicialo.com) ・ [Especificación](./PROTOCOL.md) ・ [Gobernanza](./GOVERNANCE.md) ・ [MCP Server](./packages/mcp-server) ・ [npm](https://www.npmjs.com/package/@servicialo/mcp-server)

**Nuevo en Servicialo? Empieza aqui → [`SPEC.md`](./SPEC.md)**

**Spec completa (crawler-friendly): https://servicialo.com/spec**

**[Read in English](./README.en.md)**


</div>

---

## Protocol Specification

For a formal description of the architecture, message flows, and data model:

- [Whitepaper v0.9](https://servicialo.com/whitepaper) — formal protocol specification
- [Protocol repository](https://github.com/servicialo/protocol) — schemas, RFCs, and reference materials
- [PROTOCOL.md](./PROTOCOL.md) — full specification in this repo

---

## Protocol Units

El protocolo distingue primitivas de evento (SC, CAC) de modelos 
de billing (SC, CAC, RAC). Ver [GLOSSARY.md](./GLOSSARY.md) para 
definiciones completas.

---

## ¿Por dónde empiezo?

**Tengo un negocio de servicios** y quiero que agentes AI descubran y agenden mis servicios
→ Necesitas una plataforma compatible con el protocolo, no este repositorio. [Coordinalo](https://coordinalo.com) es la implementación de referencia. A medida que el protocolo madure, esperamos que surjan muchas más plataformas compatibles.

**Soy un desarrollador** que quiere construir una plataforma compatible con el protocolo
→ Sigue leyendo. Empieza por [`IMPLEMENTING.md`](./IMPLEMENTING.md).

---

## El problema

Sin un protocolo estándar, cada plataforma de servicios habla su propio idioma. Un agente AI que quiere agendar una cita médica, verificar una reparación a domicilio o cobrar una consulta legal necesita una integración distinta para cada una. Los datos quedan en silos, la interoperabilidad requiere integraciones custom, y la inteligencia colectiva sobre entrega de servicios nunca se forma.

**Servicialo es el protocolo común.** Define el esquema mínimo viable para que cualquier agente AI coordine cualquier servicio profesional en cualquier plataforma compatible — sin integración adicional.

---

## Primitivas del protocolo

Servicialo define cuatro primitivas de coordinación. Juntas cubren la cadena de valor completa de la entrega de servicios profesionales:

| Primitiva | Qué resuelve | Superficie del protocolo |
|-----------|-------------|--------------------------|
| **Coordinación de agenda** | Intersección de disponibilidad multi-parte (proveedor, cliente, recurso) con manejo de excepciones | Ciclo de vida 6+3, 6 flujos de excepción, scheduler de 3 variables |
| **Verificación de identidad** | Credenciales del proveedor, puntaje de confianza, separación cliente-pagador | Credenciales del proveedor, trust_score, separación payer_id |
| **Liquidación financiera** | Facturación, cobranza, liquidación y revenue sharing con resolución de disputas | Dimensión de cobro, ledger de Orden de Servicio, payment_schedule |
| **Señales de demanda** | Telemetría operacional anónima y agregada entre nodos de la red | Extensión de Telemetría (modelo contribuir-para-acceder) |

Cada primitiva se especifica de forma independiente. Las implementaciones adoptan lo que necesitan.

---

## Qué es un servicio

> *Un servicio es una promesa de transformación entregada en un momento y lugar específico.*

A diferencia de un producto, un servicio no se puede almacenar, revender ni devolver. Se consume en el momento en que se entrega. Eso lo hace fundamentalmente diferente — y es por eso que necesita su propio protocolo.

Un servicio nace de tres fuentes:

| Origen | Pregunta clave | Ejemplo |
|--------|---------------|---------|
| **Desde un activo** | *Qué tienes que otros necesitan?* | Un departamento vacío → hospedaje temporal |
| **Desde una ventaja** | *Qué sabes que otros no?* | Certificación en kinesiología → rehabilitación deportiva |
| **Desde tu tiempo** | *Qué puedes hacer que otros no quieren o no pueden?* | Horas disponibles → limpieza profesional |

---

## Las 8 dimensiones

Todo servicio profesional — desde una sesión de kinesiología hasta una auditoría tributaria — se modela con las mismas 8 dimensiones:

| | Dimensión | Qué captura | Ejemplo |
|:---:|-----------|-------------|---------|
| **1** | **Qué** | La actividad o resultado que se entrega | Sesión de kinesiología, reparación eléctrica |
| **2** | **Quién entrega** | El proveedor del servicio, con credenciales | Kinesiólogo certificado, electricista SEC |
| **3** | **Quién recibe** | El cliente — con pagador separado explícitamente | Paciente (paga FONASA), empleado (paga empresa) |
| **4** | **Cuándo** | Ventana temporal acordada | 2026-02-10 de 10:00 a 10:45 |
| **5** | **Dónde** | Ubicación física o virtual, con `resource_id` opcional que referencia un Recurso físico (3.5b: sala, box, sillón, equipamiento) | Sala 3 de clínica, domicilio, videollamada |
| **6** | **Ciclo** | Posición actual en las dimensiones de estado (entrega, evidencia, aceptación, liquidación) | Completado · evidencia registrada · cobro pendiente |
| **7** | **Evidencia** | Cómo se respalda que el servicio ocurrió | GPS + duración + firma del cliente |
| **8** | **Cobro** | Liquidación financiera, independiente del ciclo | $35.000 CLP · cobrado · paquete prepago |

> **El pagador no siempre es el cliente.** En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El protocolo separa explícitamente al cliente del pagador — porque en la vida real casi nunca son la misma persona.

---

## El ciclo de vida: 6 estados core + 3 financieros opcionales

El protocolo define estados independientes para observar el ciclo completo de una coordinación. Los 9 hitos siguientes son el **camino feliz** — la ruta operativa más común, no una secuencia única obligatoria. Los 6 primeros son requeridos; los 3 financieros son una extensión opcional. Entrega, evidencia, aceptación y liquidación evolucionan de manera independiente ([PROTOCOL.md §6.0](./PROTOCOL.md)):

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → (opcional) Facturado → Cobrado → Verificado
```

| # | Estado | Qué ocurre |
|:-:|--------|-----------|
| 1 | **Solicitado** | El cliente o su agente define qué necesita, cuándo y dónde |
| 2 | **Agendado** | Se asigna hora, proveedor y ubicación. Se bloquea el horario |
| 3 | **Confirmado** | Ambas partes reconocen el compromiso |
| 4 | **En Curso** | Registro de entrada detectado. El servicio está siendo entregado |
| 5 | **Completado** | El proveedor marca la entrega como completa |
| 6 | **Documentado** | Registro formal generado: ficha clínica, reporte, minuta |
| 7 | **Facturado** | Documento tributario emitido |
| 8 | **Cobrado** | Pago recibido y confirmado |
| 9 | **Verificado** | El cliente confirma — cierre del ciclo |

> **Verificado es el cierre.** El cliente no puede verificar hasta tener el cuadro completo: la evidencia documentada, la factura emitida y el cobro aplicado. Verificación prematura obliga al cliente a confirmar algo que aún no tiene registro formal.

---

## Las excepciones son la regla

Las excepciones no son casos excepcionales. Ocurren en el **15–30% de las citas**. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan:

| Excepción | Transición | Qué pasa |
|-----------|-----------|----------|
| **Inasistencia del cliente** | Confirmado → Cancelado | Se aplica penalidad, se libera tiempo del proveedor |
| **Inasistencia del proveedor** | Confirmado → Reasignando → Agendado | Se busca reemplazo automáticamente |
| **Cancelación** | Cualquier pre-entrega → Cancelado | Se aplica la política de cancelación acordada |
| **Disputa de calidad** | Completado → Disputado | Se congela el cobro, se solicita evidencia |
| **Reagendamiento** | Agendado/Confirmado → Reagendando → Agendado | Se mantiene el proveedor si es posible. Incluye conflictos de recurso (doble reserva, recurso no disponible) |
| **Entrega parcial** | En Curso → Parcial | Se documenta lo entregado, se ajusta la factura |

---

## Servicio y Orden de Servicio

El protocolo se construye sobre dos objetos y su relación:

```
Organización
└── Orden de Servicio            ← acuerdo comercial (opcional)
    ├── alcance                   qué servicios, cuántos, de qué tipo
    ├── precio                    cómo se calcula el valor
    ├── esquema de pagos          cuándo se mueve el dinero
    └── Servicios                 ← unidades atómicas de entrega
        └── 8 dimensiones cada uno
```

> **La Service Delivery** es la instancia atómica ejecutada — lo que realmente ocurrió. En el wire format actual se representa con el objeto **Service** (nombre conservado por compatibilidad). **La Orden de Servicio** es el acuerdo comercial que agrupa entregas bajo un alcance, un precio y un esquema de pagos. "Servicio" a secas es el término general del dominio, no un cuarto objeto.

Cuando un Servicio pertenece a una Orden, su dimensión de cobro es **informativa** — registra el valor económico, pero no genera factura. La facturación es responsabilidad exclusiva de la Orden.

La misma estructura funciona para cualquier vertical:

| Vertical | Ejemplo | Alcance | Pagos |
|----------|---------|---------|-------|
| **Salud** | Plan de kinesiología | 12 sesiones | Por sesión |
| **Consultoría** | Contrato por horas | 40 horas de asesoría legal | Mensual según consumo |
| **Proyectos** | Auditoría previa en 3 fases | Hitos definidos | Por hito aprobado |

---

## Evidencia por vertical

Cada vertical define, por política, qué evidencia acredita una entrega. Los perfiles siguientes son ejemplos configurables — no requisitos universales del protocolo: cada acuerdo puede exigir evidencias distintas, y la privacidad, la proporcionalidad y la regulación acotan qué corresponde recopilar. La acreditación resultante vale bajo la política aplicada y con su nivel de certeza; no determina por sí sola la calidad del servicio ni la verdad absoluta de cada afirmación. Sin ambigüedad — requisitos explícitos, previamente acordados, para producir una Prueba de Servicio acreditable:

<details>
<summary><b>Salud</b> — 4 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Registro de entrada | Marca temporal al llegar y, cuando corresponda, ubicación | auto |
| Registro de salida | Marca temporal al salir y, cuando corresponda, ubicación | auto |
| Ficha clínica firmada | Documentación o atestación asociada a la entrega, cuando la política aplicable lo requiera | manual |
| Adherencia al plan | Lista de verificación del plan de tratamiento ejecutado | manual |

**Regla de acreditación ilustrativa:** Si las evidencias que esta política exige — registros de entrada/salida y ficha firmada — están presentes y son válidas → la entrega se acredita bajo esta política, con su nivel de certeza. Si falta ficha o firma → escalar.

</details>

<details>
<summary><b>Hogar</b> — 4 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Foto antes | Foto del estado inicial con marca temporal y GPS | manual |
| Foto después | Foto del resultado final con marca temporal y GPS | manual |
| Lista de verificación | Tareas acordadas marcadas como completadas | manual |
| Firma del cliente | Firma digital del cliente confirmando recepción | manual |

**Regla de acreditación ilustrativa:** Si fotos antes/después existen con metadatos válidos y lista completa → la entrega se acredita bajo esta política, con su nivel de certeza. Si falta firma del cliente → escalar.

</details>

<details>
<summary><b>Legal</b> — 3 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Minuta de reunión | Registro de lo discutido y acordado | manual |
| Entrega de documentos | Confirmación de entrega de documentos generados | manual |
| Registro de horas | Horas facturables con descripción de actividades | manual |

**Regla de acreditación ilustrativa:** Si minuta existe y horas registradas dentro del rango acordado → la entrega se acredita bajo esta política, con su nivel de certeza. Si horas exceden lo acordado sin justificación → escalar.

</details>

<details>
<summary><b>Educación</b> — 3 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Registro de asistencia | Confirmación de presencia del alumno y profesor | auto |
| Entrega de material | Material o tareas entregadas al alumno | manual |
| Evaluación | Evaluación o retroalimentación de la sesión | manual |

**Regla de acreditación ilustrativa:** Si asistencia registrada y material entregado → la entrega se acredita bajo esta política, con su nivel de certeza. Si falta evaluación y contrato la requiere → escalar.

</details>

---

## Resolución de disputas — extensión en diseño

El módulo de disputas (`Servicialo/Disputas`) está **en diseño** — el flujo siguiente describe el diseño objetivo, no una capacidad operativa:

**1. Apertura** — Cualquier parte abre disputa dentro del plazo definido. Se congela el cobro automáticamente.

**2. Revisión de evidencia** — Se solicita evidencia adicional de ambas partes. El sistema compara evidencia registrada contra el contrato.

**3. Resolución** — Si proveedor gana: Cobrado → Verificado. Si cliente gana: Cancelado con balance restaurado.

> **Objetivo de diseño:** automatizar la resolución de los casos cuya evidencia satisface reglas previamente acordadas en el contrato. Los casos que la evidencia no resuelve escalarían a revisión humana; el arbitraje por pares del mismo vertical es una línea de investigación, no un mecanismo desplegado.

---

## Servidor MCP

Servicialo expone sus herramientas como un servidor MCP, permitiendo que agentes AI descubran y coordinen servicios profesionales de forma nativa.

### Inicio rápido

El package `@servicialo/mcp-server` es un thin-client que conecta a la API HTTP de una plataforma Servicialo-compatible. Por defecto apunta a [Coordinalo](https://coordinalo.com) (`servicialo.com`). Si estás construyendo tu propio backend, apunta al tuyo con `SERVICIALO_BASE_URL`. Si eres una organización usuaria (clínica, consultora, etc.), las credenciales las obtienes desde tu plataforma — no necesitas instalar este package directamente.

```bash
npx -y @servicialo/mcp-server
```

Con eso, tu agente ya puede buscar organizaciones, consultar disponibilidad y listar servicios — sin credenciales.

### Modo autenticado

Para el ciclo completo — agendar, verificar entrega, cobrar:

```json
{
  "mcpServers": {
    "servicialo": {
      "command": "npx",
      "args": ["-y", "@servicialo/mcp-server"],
      "env": {
        "SERVICIALO_API_KEY": "tu_api_key",
        "SERVICIALO_ORG_ID": "tu_org_id"
      }
    }
  }
}
```

Las credenciales las obtiene cada organización desde la plataforma Servicialo-compatible que utilice.

### Las fases del agente — 40 herramientas

Un agente bien diseñado sigue este orden:

| # | Fase | Qué resuelve | Herramientas |
|:-:|------|-------------|--------------|
| 0 | **Resolver** | Dónde está el endpoint | `resolve.lookup` · `resolve.search` · `trust.get_score` |
| 1 | **Descubrir** | Qué hay disponible | `registry.search` · `registry.get_organization` · `registry.manifest` · `scheduling.check_availability` · `services.list` · `a2a.get_agent_card` |
| 2 | **Entender** | Dimensiones y reglas del servicio | `service.get` · `contract.get` |
| 3 | **Comprometer** | Identidad del cliente y reserva | `clients.get_or_create` · `scheduling.book` · `scheduling.confirm` |
| 4 | **Gestionar** | Estado y transiciones | `lifecycle.get_state` · `lifecycle.transition` · `scheduling.reschedule` · `scheduling.cancel` |
| 5 | **Verificar** | Evidencia de que ocurrió | `delivery.checkin` · `delivery.checkout` · `delivery.record_evidence` |
| 6 | **Cerrar** | Documentación y cobro | `documentation.create` · `payments.create_sale` · `payments.record_payment` · `payments.get_status` |
| — | **Recursos** | Espacios físicos y equipamiento | `resource.list` · `resource.get` · `resource.create` · `resource.update` · `resource.delete` · `resource.get_availability` |
| — | **Resolver admin** | Portabilidad y telemetría | `resolve.register` · `resolve.update_endpoint` · `telemetry.heartbeat` |
| — | **Inteligencia de red** | Benchmarks de mercado anonimizados | `market.list_segments` · `market.get_benchmark` |
| — | **Discovery (cold start)** | Taxonomía sin conocimiento previo — qué verticals, regiones y eventos existen | `registry.list_verticals` · `registry.list_regions` · `registry.list_event_types` |

*El servidor envía telemetría anónima al arrancar para estadísticas del protocolo. Se puede desactivar con `SERVICIALO_TELEMETRY=false`. Adicionalmente, los servidores autenticados emiten telemetría operacional bucketeada para alimentar los benchmarks de red — opt-out con `SERVICIALO_OPERATIONAL_TELEMETRY=false`. Ver [`docs/telemetry-operational.md`](./docs/telemetry-operational.md).*

El protocolo garantiza que cualquier agente pueda completar el ciclo completo con cualquier implementación compatible.

### Ejemplos completos

**[Sesión de kinesiología](./examples/kinesiology-session.md)** — Vertical salud. Registro de entrada con GPS, ficha clínica firmada, pago por transferencia.

**[Reparación eléctrica](./examples/home-repair.md)** — Vertical hogar. Visita a domicilio, fotos antes/después, lista de verificación, firma del cliente, pago en efectivo.

### A2A Ready

Servicialo soporta [A2A (Agent-to-Agent)](https://a2a-protocol.org/) como extensión opcional, permitiendo que agentes externos (Salesforce Agentforce, Google ADK, etc.) descubran y reserven servicios sin pasar por MCP.

Guía completa: [`docs/a2a-interoperability.md`](./docs/a2a-interoperability.md)

### Inteligencia de red — benchmarks de mercado

Cada nodo que ejecuta el MCP server autenticado emite eventos operacionales anonimizados (`booking_created`, `service_completed`, `dispute_opened`, `payment_settled`) con valores **bucketeados** (precios en bandas, duraciones en rangos, regiones a nivel país, fingerprint en lugar de slug). El registry agrega esos eventos y publica distribuciones por (vertical × región × evento) bajo dos reglas estrictas:

- **k-anonimato ≥ 5** — una segmento se publica sólo si ≥ 5 organizaciones distintas contribuyeron data.
- **Contribuir-para-acceder** — nodos que no aportan telemetría ven datos con 90 días de delay; nodos activos contribuyentes ven en tiempo real. Sin tier de pago.

Dos formas de consumir:

- **Pull** — `GET /api/benchmarks` y `GET /api/benchmarks/segments`, o las tools MCP `market.get_benchmark` / `market.list_segments`.
- **Push** — suscribirse al evento `benchmark.weekly_snapshot` vía [Webhooks API](./WEBHOOKS.md). El registry dispara un snapshot cada lunes 00:00 UTC con HMAC-signed payload.

Detalles: [`docs/benchmarks.md`](./docs/benchmarks.md) · [`docs/telemetry-operational.md`](./docs/telemetry-operational.md) · [`GOVERNANCE.md`](./GOVERNANCE.md#contribute-to-access-policy-v01) · [`WEBHOOKS.md`](./WEBHOOKS.md)

---

## Los 7 principios

| # | Principio | |
|:-:|-----------|---|
| 1 | **Todo servicio tiene un ciclo** | No importa si es un masaje o una auditoría. El protocolo define estados independientes para observar el ciclo completo: entrega, evidencia, aceptación y liquidación. |
| 2 | **La entrega debe ser verificable** | Sin evidencia suficiente, una entrega no puede considerarse acreditada con el nivel de certeza requerido. El protocolo define qué constituye evidencia válida para que humanos y agentes AI puedan confiar en ella. |
| 3 | **El pagador no siempre es el cliente** | En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El protocolo separa explícitamente al cliente del pagador. |
| 4 | **Las excepciones son la regla** | Inasistencias, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan. |
| 5 | **Un servicio es un producto legible por máquinas** | Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente AI puede descubrirlo, coordinarlo y cerrarlo con la misma confianza que un humano. |
| 6 | **El acuerdo es separado de la entrega** | La Orden de Servicio define lo acordado. El servicio atómico define lo entregado. Son dos objetos distintos con dos ciclos de vida distintos. |
| 7 | **La inteligencia colectiva es un bien común del protocolo** | Cada nodo que implementa el protocolo contribuye datos operacionales. La inteligencia agregada mejora a todos los nodos — como Waze, donde cada conductor contribuye y todos navegan mejor. Ninguna implementación es dueña de los datos de la red. |

---

## Arquitectura por capas

Adopta solo lo que necesitas. Core cubre el ciclo completo de entrega. Las extensiones agregan capacidades para operaciones especializadas.

### Servicialo Core — `estable`

Todo lo necesario para modelar un servicio profesional de principio a fin.

Para cualquier plataforma donde dos partes toman un compromiso de entrega y necesitan una cuenta verificable de lo que ocurrió — desde una sociedad de psicólogos hasta una empresa de limpieza con múltiples cuentas, equipos y personal.

Incluye: 8 dimensiones · ciclo de vida 6+3 (6 estados core + 3 financieros opcionales) · 6 flujos de excepción · 7 principios fundamentales · gestión de recursos · órdenes de servicio · prueba de entrega · protocolo MCP (40 herramientas) · resolver de descubrimiento (análogo a DNS, sobre HTTP) · interoperabilidad A2A · inteligencia de red (benchmarks bucketeados con k-anonimato ≥5 y contribuir-para-acceder) · webhooks para distribución push · descubrimiento de taxonomía sin conocimiento previo (cold-start)

### Servicialo/Finanzas — `en diseño`

Distribución de pagos entre profesional, organización e infraestructura — con reglas claras de liquidación.

Para plataformas que intermedian pagos entre clientes y profesionales, o que cobran comisiones.

### Servicialo/Disputas — `en diseño`

Resolución formal de disputas. Objetivo de diseño: automatizar los casos cuya evidencia satisface reglas previamente acordadas; el arbitraje por pares del mismo vertical es una línea de investigación.

Para plataformas con volumen suficiente o donde el monto por servicio hace que las disputas sean económicamente relevantes.

---

## Schema

JSON Schemas para validación automática: [`schema/service.schema.json`](./schema/service.schema.json) y [`schema/service-order.schema.json`](./schema/service-order.schema.json)

```yaml
# ─────────────────────────────────────────────
# SERVICIALO v0.9
# Dos entidades: Orden + Servicios atómicos
# ─────────────────────────────────────────────

orden_de_servicio:
  id: texto                      # Identificador único
  alcance: texto                 # Qué se acuerda entregar
  precio: número                 # Precio total acordado
  esquema_pagos: texto           # prepago | por_sesión | mensual
  currency: texto                # ISO 4217

  servicios[]:                   # Cada servicio atómico — 8 dimensiones

    servicio:
      id: texto
      orden_de_servicio_id: texto  # Referencia a la Orden padre
      tipo: texto                # Categoría del servicio
      vertical: texto            # salud | legal | hogar | educación | ...
      nombre: texto              # Nombre legible
      duración_minutos: entero
      visibilidad: texto         # public | unlisted | private

      proveedor:
        id: texto
        credenciales: texto[]    # Certificaciones requeridas
        puntaje_confianza: número  # 0-100 calculado por historial
        organización_id: texto

      cliente:
        id: texto
        pagador_id: texto        # Puede diferir del cliente

      agenda:
        solicitado_en: fecha_hora
        agendado_para: fecha_hora
        duración_esperada: minutos

      ubicación:
        tipo: presencial | virtual | domicilio
        dirección: texto
        recurso_id: texto        # Opcional — referencia a recurso físico

      ciclo_de_vida:
        estado_actual: enum      # 6 core + 3 financieros opcionales + excepciones
        transiciones: transición[]
        excepciones: excepción[]

      prueba_de_entrega:
        entrada: fecha_hora
        salida: fecha_hora
        duración_real: minutos
        evidencia: evidencia[]   # GPS, firma, fotos, documentos

      cobro:
        orden_de_servicio_id: texto  # Referencia a la Orden padre
        monto:
          valor: número
          moneda: texto          # ISO 4217
        pagador: referencia
        estado: pendiente | cobrado | facturado | pagado | disputado
        cobrado_en: fecha_hora
        documento_tributario: referencia  # Boleta/factura si se emitió

      mandato:                   # Delegación explícita a agente IA
        mandato_id: texto        # UUID único
        principal_id: texto      # Humano u organización
        agente_id: texto         # Agente que recibe la delegación
        alcances: texto[]        # resource:action (e.g. schedule:write)
        estado: activo | expirado | revocado | suspendido

# Ledger: proyección calculada desde entregas + términos comerciales +
# eventos de liquidación — nunca un saldo editable a mano
```

---

## Implementaciones

Cualquier plataforma puede implementar Servicialo. Para ser listada debe modelar las 8 dimensiones, implementar los 6 estados core (los 3 financieros son opcionales), manejar al menos 3 de los 6 flujos de excepción, adherir a los 7 principios fundamentales y exponer al menos un binding máquina a máquina que implemente los perfiles Core (HTTP, MCP, A2A u otro equivalente — una implementación puramente HTTP es conforme sin MCP; MCP es la vía recomendada para agentes). La verificación es manual hoy (PR + revisión del equipo); la suite automatizada de certificación es parte del roadmap.

| Plataforma | Vertical | Cobertura | Estado |
|------------|----------|-----------|:------:|
| [**Coordinalo**](https://coordinalo.com) | Healthcare | 8/8 dimensiones · ciclo 6+3 completo · 6/6 excepciones · 7/7 principios | Live |

> Coordinalo es la implementación de referencia — no el protocolo. El segundo nodo es una oportunidad abierta — ver [`IMPLEMENTORS.md`](./IMPLEMENTORS.md).

### Para implementadores

Guía paso a paso para construir una plataforma compatible desde cero — 8 pasos, el primero toma 20 minutos.
Empezar aquí: [`IMPLEMENTING.md`](./IMPLEMENTING.md) ([English](./IMPLEMENTING.en.md))

Referencias adicionales:
- [`schema/evidence/`](./schema/evidence/) — Schemas de evidencia por vertical (salud, hogar, legal, educación, consultoría)
- [`ERRORS.md`](./ERRORS.md) — Códigos de error del protocolo
- [`WEBHOOKS.md`](./WEBHOOKS.md) — Notificaciones asíncronas de cambios de estado (v0.2 — eventos del registry estables)

---

## Qué hay en este repositorio

```
servicialo/
├── app/                  # servicialo.com — sitio del protocolo (Next.js)
├── components/           # Componentes del sitio
├── examples/             # Conversaciones agente-servidor
├── lib/                  # Datos del protocolo
├── packages/
│   └── mcp-server/       # @servicialo/mcp-server — servidor MCP (npm)
├── schema/               # JSON Schemas para validación
│   ├── evidence/         # Schemas de evidencia por vertical
│   │   ├── base.schema.json       # Envelope compartido
│   │   ├── health.schema.json     # Salud
│   │   ├── home.schema.json       # Hogar
│   │   ├── legal.schema.json      # Legal
│   │   ├── education.schema.json  # Educación
│   │   └── consulting.schema.json # Consultoría
│   ├── service.schema.json
│   ├── service-order.schema.json
│   └── ...
├── protocol/
│   └── manifest.yaml     # Fuente única de verdad: versión, tools, estados, extensiones
├── SPEC.md               # Quick spec — referencia autocontenida para evaluadores
├── PROTOCOL.md           # Especificación completa
├── ERRORS.md             # Códigos de error del protocolo
├── WEBHOOKS.md           # Especificación de webhooks (v0.2)
├── IMPLEMENTORS.md       # Guía para construir una implementación
├── GOVERNANCE.md         # Gobernanza de red y política de datos
└── README.md
```

|  | Versión | Estado |
|---|---------|--------|
| Protocol | 0.10 | Draft |
| @servicialo/mcp-server | 0.9.13 | [npm](https://www.npmjs.com/package/@servicialo/mcp-server) |

---

## Ecosystem

- [Telemetría de red](https://servicialo.com/network) — instalaciones del MCP server reportadas por telemetría (no equivale a implementaciones adoptadas)
- [Implementadores](https://servicialo.com/implementors) — implementaciones verificadas del protocolo
- Using Servicialo? [Open an issue](https://github.com/servicialo/mcp-server/issues/new) to get listed

---

## Licencia

Apache-2.0 — Servicialo es un protocolo abierto. Cualquiera puede implementarlo.
