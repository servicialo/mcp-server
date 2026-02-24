<div align="center">

# Servicialo

**El estándar abierto para servicios**

Cualquier persona puede crear un servicio.<br>
**Cualquier agente puede coordinarlo.**

Servicialo define el lenguaje universal para crear, entregar y verificar<br>
servicios profesionales — para humanos y para agentes AI.

`Estándar abierto` `Legible por máquinas` `Diseñado para humanos`

[Sitio web](https://servicialo.com) ・ [Especificación](./PROTOCOL.md) ・ [MCP Server](./packages/mcp-server) ・ [npm](https://www.npmjs.com/package/@servicialo/mcp-server)

</div>

---

## El problema

Sin un protocolo estándar, cada plataforma de servicios habla su propio idioma. Un agente AI que quiere agendar una cita médica, verificar una reparación a domicilio o cobrar una consulta legal necesita una integración distinta para cada una.

**Servicialo es el idioma común.** Si una plataforma lo implementa, cualquier agente puede operar ese negocio — sin integración adicional. La diferencia entre un agente que informa y un agente que opera.

---

## Qué es un servicio

> *Un servicio es una promesa de transformación entregada en un momento y lugar específico.*

A diferencia de un producto, un servicio no se puede almacenar, revender ni devolver. Se consume en el momento en que se entrega. Eso lo hace fundamentalmente diferente — y es por eso que necesita su propio estándar.

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
| **5** | **Dónde** | Ubicación física o virtual | Clínica, domicilio, videollamada |
| **6** | **Ciclo** | Posición actual en los 9 estados del ciclo de vida | Cobrado → próximo: Verificado |
| **7** | **Evidencia** | Cómo se prueba que el servicio ocurrió | GPS + duración + firma del cliente |
| **8** | **Cobro** | Liquidación financiera, independiente del ciclo | $35.000 CLP · cobrado · paquete prepago |

> **El pagador no siempre es el cliente.** En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa explícitamente al cliente del pagador — porque en la vida real casi nunca son la misma persona.

---

## Los 9 estados universales

No importa si es un masaje o una auditoría. Todo servicio transiciona por el mismo ciclo de vida:

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Facturado → Cobrado → Verificado
```

| # | Estado | Qué ocurre |
|:-:|--------|-----------|
| 1 | **Solicitado** | El cliente o su agente define qué necesita, cuándo y dónde |
| 2 | **Agendado** | Se asigna hora, proveedor y ubicación. Se bloquea el horario |
| 3 | **Confirmado** | Ambas partes reconocen el compromiso |
| 4 | **En Curso** | Check-in detectado. El servicio está siendo entregado |
| 5 | **Completado** | El proveedor marca la entrega como completa |
| 6 | **Documentado** | Registro formal generado: ficha clínica, reporte, minuta |
| 7 | **Facturado** | Documento tributario emitido |
| 8 | **Cobrado** | Pago recibido y confirmado |
| 9 | **Verificado** | El cliente confirma — cierre del ciclo |

> **Verificado es el cierre.** El cliente no puede verificar hasta tener el cuadro completo: la evidencia documentada, la factura emitida y el cobro aplicado. Verificación prematura obliga al cliente a confirmar algo que aún no tiene registro formal.

---

## Las excepciones son la regla

Las excepciones no son edge cases. Ocurren en el **15-30% de las citas**. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan:

| Excepción | Transición | Qué pasa |
|-----------|-----------|----------|
| **Inasistencia del cliente** | Confirmado → Cancelado | Se aplica penalidad, se libera tiempo del proveedor |
| **Inasistencia del proveedor** | Confirmado → Reasignando → Agendado | Se busca reemplazo automáticamente |
| **Cancelación** | Cualquier pre-entrega → Cancelado | Se aplica la política de cancelación acordada |
| **Disputa de calidad** | Completado → Disputado | Se congela el cobro, se solicita evidencia |
| **Reagendamiento** | Agendado/Confirmado → Reagendando → Agendado | Se mantiene el proveedor si es posible |
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

> **El Servicio** es la unidad atómica de entrega — lo que realmente ocurrió. **La Orden de Servicio** es el acuerdo comercial que agrupa servicios bajo un alcance, un precio y un esquema de pagos.

Cuando un Servicio pertenece a una Orden, su dimensión de cobro es **informativa** — registra el valor económico, pero no genera factura. La facturación es responsabilidad exclusiva de la Orden.

La misma estructura funciona para cualquier vertical:

| Vertical | Ejemplo | Alcance | Pagos |
|----------|---------|---------|-------|
| **Salud** | Plan de kinesiología | 12 sesiones | Por sesión |
| **Consultoría** | Contrato por horas | 40 horas de asesoría legal | Mensual según consumo |
| **Proyectos** | Due diligence en 3 fases | Hitos definidos | Por hito aprobado |

---

## Evidencia por vertical

Cada vertical define qué constituye prueba de que el servicio ocurrió. Sin ambigüedad — para que un algoritmo pueda resolver el 80% de las disputas sin intervención humana:

<details>
<summary><b>Salud</b> — 4 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Registro de entrada | Timestamp GPS del proveedor al llegar | auto |
| Registro de salida | Timestamp GPS del proveedor al salir | auto |
| Ficha clínica firmada | Registro clínico firmado por profesional y paciente | manual |
| Adherencia al plan | Checklist del plan de tratamiento ejecutado | manual |

**Regla de resolución:** Si check-in/out existen y ficha clínica está firmada por ambas partes → servicio entregado. Si falta ficha o firma → escalar.

</details>

<details>
<summary><b>Hogar</b> — 4 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Foto antes | Foto del estado inicial con timestamp y GPS | manual |
| Foto después | Foto del resultado final con timestamp y GPS | manual |
| Lista de verificación | Tareas acordadas marcadas como completadas | manual |
| Firma del cliente | Firma digital del cliente confirmando recepción | manual |

**Regla de resolución:** Si fotos antes/después existen con metadata válida y lista completa → servicio entregado. Si falta firma del cliente → escalar.

</details>

<details>
<summary><b>Legal</b> — 3 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Minuta de reunión | Registro de lo discutido y acordado | manual |
| Entrega de documentos | Confirmación de entrega de documentos generados | manual |
| Registro de horas | Horas facturables con descripción de actividades | manual |

**Regla de resolución:** Si minuta existe y horas registradas dentro del rango acordado → servicio entregado. Si horas exceden lo acordado sin justificación → escalar.

</details>

<details>
<summary><b>Educación</b> — 3 tipos de evidencia</summary>

| Evidencia | Descripción | Captura |
|-----------|-------------|:-------:|
| Registro de asistencia | Confirmación de presencia del alumno y profesor | auto |
| Entrega de material | Material o tareas entregadas al alumno | manual |
| Evaluación | Evaluación o retroalimentación de la sesión | manual |

**Regla de resolución:** Si asistencia registrada y material entregado → servicio entregado. Si falta evaluación y contrato la requiere → escalar.

</details>

---

## Resolución de disputas

Cuando hay desacuerdo, el mecanismo no depende de buena voluntad, no requiere un juez centralizado, y un agente AI puede ejecutarlo con la misma confianza que un humano:

**1. Apertura** — Cualquier parte abre disputa dentro del plazo definido. Se congela el cobro automáticamente.

**2. Revisión de evidencia** — Se solicita evidencia adicional de ambas partes. El sistema compara evidencia registrada contra el contrato.

**3. Resolución** — Si proveedor gana: Cobrado → Verificado. Si cliente gana: Cancelado con balance restaurado.

> **80/20.** El 80% de las disputas se resuelven automáticamente comparando evidencia contra contrato. Sin intervención humana, sin discrecionalidad, sin demora. El 20% restante escala a árbitros del mismo vertical profesional que votan en 48 horas.

---

## Servidor MCP

Servicialo expone sus herramientas como un servidor MCP, permitiendo que agentes AI descubran y coordinen servicios profesionales de forma nativa.

### Quickstart

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

### Las 6 fases del agente — 20 herramientas

Un agente bien diseñado sigue este orden:

| # | Fase | Qué resuelve | Herramientas |
|:-:|------|-------------|--------------|
| 1 | **Descubrir** | Qué hay disponible | `registry.search` · `registry.get_organization` · `scheduling.check_availability` · `services.list` |
| 2 | **Entender** | Dimensiones y reglas del servicio | `service.get` · `contract.get` |
| 3 | **Comprometer** | Identidad del cliente y reserva | `clients.get_or_create` · `scheduling.book` · `scheduling.confirm` |
| 4 | **Gestionar** | Estado y transiciones | `lifecycle.get_state` · `lifecycle.transition` · `scheduling.reschedule` · `scheduling.cancel` |
| 5 | **Verificar** | Evidencia de que ocurrió | `delivery.checkin` · `delivery.checkout` · `delivery.record_evidence` |
| 6 | **Cerrar** | Documentación y cobro | `documentation.create` · `payments.create_sale` · `payments.record_payment` · `payments.get_status` |

El estándar garantiza que cualquier agente pueda completar el ciclo completo con cualquier implementación compatible.

---

## Los 7 principios

| # | Principio | |
|:-:|-----------|---|
| 1 | **Todo servicio tiene un ciclo** | No importa si es un masaje o una auditoría. Los 9 estados son universales. |
| 2 | **La entrega debe ser verificable** | Si no puedes probar que el servicio ocurrió, no ocurrió. Servicialo define qué constituye evidencia válida para que humanos y agentes AI puedan confiar en ella. |
| 3 | **El pagador no siempre es el cliente** | En salud paga la aseguradora. En corporativo paga la empresa. En educación paga el apoderado. El estándar separa explícitamente al cliente del pagador. |
| 4 | **Las excepciones son la regla** | Inasistencias, cancelaciones, reagendamientos, disputas. Un servicio bien diseñado define qué pasa cuando las cosas no salen según el plan. |
| 5 | **Un servicio es un producto** | Tiene nombre, precio, duración, requisitos y resultado esperado. Definido así, cualquier agente AI puede descubrirlo y coordinarlo. |
| 6 | **Los agentes AI son ciudadanos de primera clase** | El estándar está diseñado para que un agente AI pueda solicitar, verificar y cerrar un servicio con la misma confianza que un humano. |
| 7 | **El acuerdo es separado de la entrega** | La Orden de Servicio define lo acordado. El servicio atómico define lo entregado. Son dos objetos distintos con dos ciclos de vida distintos. |

---

## Arquitectura por capas

Adopta solo lo que necesitas. Core cubre el ciclo completo. Los módulos agregan capacidades para operaciones más complejas.

### Servicialo Core — `estable`

Todo lo necesario para modelar un servicio profesional de principio a fin.

Para cualquier plataforma donde dos partes toman un compromiso de entrega y necesitan una cuenta verificable de lo que ocurrió — desde una sociedad de psicólogos hasta una empresa de limpieza con múltiples cuentas, equipos y personal.

Incluye: ciclo de vida (9 estados) · 8 dimensiones · órdenes de servicio · flujos de excepción · prueba de entrega · protocolo MCP (20 herramientas)

### Servicialo/Finanzas — `en diseño`

Distribución de pagos entre profesional, organización e infraestructura — con reglas claras de liquidación.

Para plataformas que intermedian pagos entre clientes y profesionales, o que cobran comisiones.

### Servicialo/Disputas — `en diseño`

Resolución formal con arbitraje algorítmico (~80%) y por pares del mismo vertical (~20%).

Para plataformas con volumen suficiente o donde el monto por servicio hace que las disputas sean económicamente relevantes.

---

## Schema

```yaml
# ── SERVICIALO v0.3 ──────────────────
# Las 8 dimensiones de un servicio

servicio:
  id: texto
  orden_de_servicio_id: texto         # Opcional — referencia a Orden padre
  tipo: texto                         # Categoría del servicio
  vertical: texto                     # salud | legal | hogar | educación | ...
  nombre: texto
  duración_minutos: entero

  proveedor:
    id: texto
    credenciales: texto[]             # Certificaciones requeridas
    puntaje_confianza: número         # 0-100 calculado por historial
    organización_id: texto

  cliente:
    id: texto
    pagador_id: texto                 # Puede diferir del cliente

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
    estado_actual: enum[9]            # Los 9 estados universales
    transiciones: transición[]
    excepciones: excepción[]

  prueba_de_entrega:
    entrada: fecha_hora
    salida: fecha_hora
    duración_real: minutos
    evidencia: evidencia[]            # GPS, firma, fotos, documentos

  cobro:                              # Informativo si pertenece a una Orden
    monto:
      valor: número
      moneda: texto                   # ISO 4217
    pagador: referencia               # Puede diferir del cliente
    estado: pendiente | cobrado | facturado | pagado | disputado
    cobrado_en: fecha_hora
    pago_id: referencia
    documento_tributario: ref
```

---

## Implementaciones

Cualquier plataforma puede implementar Servicialo. Para ser listada debe modelar las 8 dimensiones, implementar los 9 estados, manejar al menos 3 flujos de excepción y exponer una API conectable al MCP server.

| Plataforma | Vertical | Cobertura | Estado |
|------------|----------|-----------|:------:|
| [**Coordinalo**](https://coordinalo.com) | Healthcare | 8/8 dimensiones · 9/9 estados · 6/6 excepciones · 7/7 principios | Live |

> Construyendo para servicios profesionales? [Abre un issue](https://github.com/servicialo/mcp-server/issues) para listar tu implementación.

---

## Qué hay en este repositorio

```
servicialo/
├── app/                  # servicialo.com — sitio del estándar (Next.js)
├── components/           # Componentes del sitio
├── lib/                  # Datos del protocolo
├── packages/
│   └── mcp-server/       # @servicialo/mcp-server — servidor MCP (npm)
└── PROTOCOL.md           # Especificación completa
```

|  | Versión | Estado |
|---|---------|--------|
| Protocol | 0.3 | Estable |
| @servicialo/mcp-server | 0.5.3 | [npm](https://www.npmjs.com/package/@servicialo/mcp-server) |

---

## Licencia

MIT — Servicialo es un estándar abierto. Cualquiera puede implementarlo.
