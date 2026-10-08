# RFC-007: Propiedades verificables de la evidencia (Verifiable Evidence Properties)

| Field | Value |
|-------|-------|
| RFC number | 007 |
| Title | Verifiable Evidence Properties (la especificación exige propiedades mínimas verificables de la evidencia, sin imponer un mecanismo criptográfico particular) |
| Author(s) | Servicialo SpA — Franco Danioni ([@danioni](https://github.com/danioni)), acting maintainer |
| Status | Draft (borrador para comentarios; pasar a *Open for Comment* es acción del mantenedor, [RFC-001](RFC-001-rfc-process-and-deprecation-policy.md) §3.4 paso 5) |
| Category | Por confirmar en la ventana. **Major** si las propiedades entran al Core como requisito de conformance; **Minor** si entran como requisito de la extensión Proof of Service. Ver §11, pregunta 1 |
| Type | Protocol Semantics |
| Discussion | [PR #55](https://github.com/servicialo/mcp-server/pull/55) |
| Created | 2026-10-08 |
| Last updated | 2026-10-08 |
| Target version | Servicialo Protocol v1.0 |
| Motivating analysis | Revisión de posicionamiento (2026-10): la portada de servicialo.com afirma que la firma y el transporte de la evidencia pueden quedar a cargo de otro estándar; la decisión vigente del mantenedor es que el sustrato de verificación va a la especificación. Este RFC resuelve la contradicción |
| Related | [proof-of-service](../public/spec/extensions/proof-of-service.md) §6 pregunta 2 ("Who signs an attestation, and with what key infrastructure?"); [state-dimensions](../public/spec/extensions/state-dimensions.md) §2.2 (`attested`); `PROTOCOL.md` §1.2, §9 Principio 2, §10.2 principio 6, §10.3.1 (`signature`), §10.7 (hash chains); `GOVERNANCE.md` (transparency log); [#28](https://github.com/servicialo/mcp-server/issues/28) (artefactos direccionados por contenido); [#7](https://github.com/servicialo/mcp-server/issues/7) (`provenance`); [#53](https://github.com/servicialo/mcp-server/issues/53) (relación de interés del atestante); [#54](https://github.com/servicialo/mcp-server/issues/54) (atestación por persona o por agente); Coordinalo RFC-001 (perímetro atestado), ver §6 |
| License | Apache-2.0 |

> **Nota de directorio.** `rfcs/` y RFC-001 llegan con el
> [PR #13](https://github.com/servicialo/mcp-server/pull/13), abierto al momento de
> escribir esto; [RFC-005](https://github.com/servicialo/mcp-server/pull/21) ya está
> en `main` y [RFC-006](https://github.com/servicialo/mcp-server/pull/48) está abierto
> sobre la misma base. Los enlaces a `RFC-001-…` resuelven cuando ese PR se mergee.
> La fila de RFC-007 en el índice [`rfcs/README.md`](README.md) es tarea de merge,
> no una edición hecha aquí, para que las ramas no colisionen sobre el mismo archivo.

> **Nota de numeración.** Este documento es **RFC-007 de servicialo/mcp-server**.
> En este repositorio, **RFC-001 es el proceso de RFC** (*RFC Process & Deprecation
> Policy*). En el repositorio de Coordinalo existe **otro RFC-001, el del perímetro
> atestado**; comparten número por accidente y son documentos distintos. Aquí se cita
> siempre como "Coordinalo RFC-001 (perímetro atestado)".

> **ES:** La especificación habla de evidencia, atestaciones y Prueba de Servicio,
> pero no dice qué propiedades debe tener una evidencia para que un tercero pueda
> verificarla sin confiar en el nodo que la almacena. Este RFC propone exigir cuatro
> propiedades mínimas —integridad, orden, no repudio de quien atesta e inclusión
> comprobable en un registro— sin prescribir el mecanismo criptográfico que las
> provee. Cualquier mecanismo que las cumpla es conforme, y puede venir de otro
> estándar.
>
> **EN:** The specification speaks of evidence, attestations and Proof of Service,
> but does not say which properties a piece of evidence must have for a third party
> to verify it without trusting the node that stores it. This RFC proposes requiring
> four minimum properties —integrity, order, non-repudiation of the attester, and
> provable inclusion in a registry— without prescribing the cryptographic mechanism
> that provides them. Any mechanism that satisfies the properties is conformant, and
> it may come from another standard.

---

## 1. Summary / Resumen

**ES:** Se propone que la especificación **exija propiedades mínimas verificables de
la evidencia** y **no imponga un mecanismo criptográfico particular** para
cumplirlas. Las propiedades son cuatro: (1) **integridad**: toda alteración posterior
al registro es detectable; (2) **orden**: el orden relativo en que los registros
quedaron comprometidos es verificable y no puede reordenarse después; (3) **no
repudio de quien atesta**: cada atestación es atribuible a su autor de un modo que el
autor no puede negar y que un tercero puede verificar sin confiar en el nodo; (4)
**inclusión comprobable en un registro**: un tercero puede verificar que un registro
concreto está incluido en el registro que el nodo declara como autoritativo, sin
descargar el registro completo. Un sobre firmado, una cadena de hashes, checkpoints
publicados y pruebas de inclusión son **una** forma de proveerlas; no la única. El
RFC no define esquemas ni formatos: fija las propiedades, delimita qué queda fuera,
sitúa el perímetro atestado de Coordinalo como referencia no normativa y deja las
decisiones de diseño como preguntas abiertas para la ventana de comentarios.

**EN:** This RFC proposes that the specification **require minimum verifiable
properties of evidence** and **impose no particular cryptographic mechanism** to
meet them. The properties are four: (1) **integrity**: any alteration after
registration is detectable; (2) **order**: the relative order in which records were
committed is verifiable and cannot be rearranged afterwards; (3) **non-repudiation
of the attester**: every attestation is attributable to its author in a way the
author cannot deny and a third party can verify without trusting the node; (4)
**provable inclusion in a registry**: a third party can verify that a given record
is included in the registry the node declares authoritative, without downloading
the whole registry. A signed envelope, a hash chain, published checkpoints and
inclusion proofs are **one** way to provide them; not the only one. The RFC defines
no schema and no format: it fixes the properties, delimits what is out of scope,
places Coordinalo's attested perimeter as a non-normative reference, and leaves the
design decisions as open questions for the comment window.

---

## 2. Motivation / Motivación

**ES:** Hay una contradicción entre dos textos que hoy describen el mismo protocolo:

- La **portada** de servicialo.com (§03, "Servicialo define semántica de servicio, no
  el stack de confianza completo") dice que Servicialo *no necesita controlar el
  mecanismo criptográfico con que viaja la evidencia* y que otro estándar *puede
  transportar y firmar la evidencia*.
- La **decisión vigente** del mantenedor, tomada al revisar la verificabilidad de la
  implementación de referencia, es que el **sustrato de verificación** —sobre firmado,
  cadena de hashes, checkpoints, pruebas de inclusión— **va a la especificación**.

Ambas no pueden ser ciertas a la vez tal como están escritas. Si el sobre queda
enteramente a cargo de otro estándar, dos implementaciones conformes pueden producir
Pruebas de Servicio con verificabilidad incomparable, y un consumidor de la prueba
(el *Proof Consumer* del borrador 0.3.0 de Proof of Service) no puede apoyarse en
ninguna. Si la especificación prescribe el sustrato completo, el protocolo queda
acoplado a un stack criptográfico concreto y contradice su propia declaración de
alcance (`PROTOCOL.md` §1.2: no es un transporte, no es un sistema de identidad) y
el principio 6 del modelo de agencia delegada (§10.2: "no prescribe almacenamiento,
transporte ni mecanismos criptográficos").

La salida es distinguir **propiedades** de **mecanismos**. La especificación exige
lo primero. Lo segundo lo provee cada implementación, o un estándar externo, y es
conforme si cumple las propiedades. Esa es la misma postura que el protocolo ya toma
con la identidad (transporta el atributo, su `origin` y `verified_by`; no certifica) y
que el borrador 0.3.0 de Proof of Service toma con los *grants* (especifica
propiedades —explícito, acotado, con vencimiento, revocable—, no la codificación).

Hay además tres señales en el repositorio de que la pregunta ya estaba abierta:

1. [proof-of-service](../public/spec/extensions/proof-of-service.md) §6, pregunta 2:
   *"Who signs an attestation, and with what key infrastructure?"*
2. `PROTOCOL.md` §10.3.1 reserva un campo `signature` en el ServiceMandate "para
   verificación criptográfica futura", sin decir qué propiedades debe tener.
3. [#28](https://github.com/servicialo/mcp-server/issues/28) verificó que no existe
   ningún `hash`, `digest` ni `checksum` en todo `schema/`: hoy una evidencia que
   referencia un artefacto por URI no puede probar que el artefacto no cambió.

**EN:** Two texts describing the same protocol contradict each other today. The
servicialo.com landing page (§03) says Servicialo *does not need to control the
cryptographic mechanism the evidence travels with* and that another standard *may
transport and sign the evidence*. The maintainer's current decision, taken when
reviewing the verifiability of the reference implementation, is that the
**verification substrate** —signed envelope, hash chain, checkpoints, inclusion
proofs— **belongs in the specification**. If the envelope is left entirely to other
standards, two conformant implementations can produce Proofs of Service of
incomparable verifiability, and a Proof Consumer can rely on neither. If the
specification prescribes the whole substrate, the protocol couples itself to one
cryptographic stack and contradicts its own scope statement (§1.2) and §10.2
principle 6. The way out is to distinguish **properties** from **mechanisms**: the
specification requires the former; implementations or external standards provide
the latter, and are conformant if the properties hold. This is the stance the
protocol already takes with identity, and the stance Proof of Service 0.3.0 takes
with grants. Three signals in the repository show the question was already open:
proof-of-service §6 Q2, the reserved `signature` field in §10.3.1, and the absence of
any digest in `schema/` verified by #28.

---

## 3. Alcance

**Dentro del alcance.** Las propiedades que una implementación conforme debe
garantizar sobre los eventos de evidencia y las atestaciones que componen una Prueba
de Servicio; la regla de neutralidad de mecanismo; qué debe poder hacer un
verificador externo; la relación con el perímetro atestado de Coordinalo como
referencia; las preguntas que la ventana de comentarios debe cerrar.

**Fuera del alcance.** Todo lo enumerado en §5. En particular: el RFC **no** define
formatos, algoritmos, esquemas de claves, ni un objeto wire nuevo. No decide qué
evidencia es *suficiente* para acreditar una entrega (eso es Evidence Profiles y la
política de acreditación de Proof of Service). No decide quién atesta ni con qué
interés ([#53](https://github.com/servicialo/mcp-server/issues/53)) ni si lo hace una
persona o un agente ([#54](https://github.com/servicialo/mcp-server/issues/54)).

---

## 4. Especificación: propiedades exigidas

Las palabras clave MUST, MUST NOT, SHOULD y MAY se interpretan según
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). El vocabulario wire se mantiene
en inglés.

Las propiedades aplican a cada **registro verificable**: un Evidence Event
(`schema/evidence/base.schema.json`), una atestación de parte o de tercero, y
cualquier otro registro que una Prueba de Servicio vincule y presente a un
consumidor. A qué objetos adicionales aplican (transiciones, eventos de liquidación,
el perímetro de la Service Order) es la pregunta 2 de §11.

### 4.1 Integridad

Un verificador MUST poder detectar cualquier alteración del contenido de un registro
posterior a su compromiso en el registro del nodo. La detección MUST ser posible sin
confiar en el nodo que almacena el registro: no basta con que el nodo *afirme* que
nada cambió.

Cuando un registro referencia un artefacto externo por URI (una foto, un documento,
una firma manuscrita), la integridad del registro MUST extenderse al artefacto
referenciado. Esto conecta con [#28](https://github.com/servicialo/mcp-server/issues/28);
ver §11, pregunta 10.

### 4.2 Orden

Dado un conjunto de registros sobre la misma obligación, un verificador MUST poder
establecer el **orden relativo en que fueron comprometidos** en el registro del nodo,
y detectar si un registro fue insertado, eliminado o reordenado después del hecho.

El orden de compromiso es distinto de la marca temporal declarada. `captured_at` es
una afirmación del emisor; el orden de compromiso es una propiedad del registro. Las
dos cosas pueden y deben convivir: una atestación puede declarar que ocurrió a las
15:00 y haber sido comprometida a las 15:07. Lo que esta propiedad exige es que nadie
pueda, a las 16:00, insertar un registro "a las 15:03" sin que se note.

### 4.3 No repudio de quien atesta

Cada atestación MUST ser atribuible a quien la hizo de un modo que (a) el atestante
no pueda negar después haberla hecho y (b) un tercero pueda verificar **sin confiar
en el nodo** que la almacena. La atribución MUST sobrevivir a la salida del registro
de su nodo de origen: una Prueba de Servicio presentada fuera del nodo conserva la
atribución verificable de cada atestación.

Cuando el atestante es un agente actuando bajo mandato (`PROTOCOL.md` §10), la
atribución MUST alcanzar al agente **y** a la referencia del mandato bajo el cual
actuó. Cómo se expresa en la atestación que la hizo un agente y no la persona es
materia de [#54](https://github.com/servicialo/mcp-server/issues/54); este RFC solo
exige que, cuando esa distinción exista, sea tan verificable como el resto.

Esta propiedad no decide **a qué** se ata la identidad del atestante (una clave, una
cuenta en el nodo, una credencial emitida por un tercero). Ver §5 y §11, pregunta 4.

### 4.4 Inclusión comprobable en un registro

Un verificador MUST poder comprobar que un registro concreto **está incluido** en el
registro que el nodo declara como autoritativo para esa obligación, y en qué
posición, **sin descargar el registro completo** y sin confiar en la palabra del
nodo.

Dos verificadores que consulten el mismo registro en el mismo momento SHOULD poder
comprobar que ven la misma vista (que el nodo no sirve registros distintos a
lectores distintos). Si esa consistencia requiere que el nodo publique un
compromiso periódico ante una parte distinta de sí mismo, y ante quién, es la
pregunta 6 de §11.

### 4.5 Neutralidad de mecanismo: conformidad por propiedades

La especificación **no prescribe** el mecanismo que provee las cuatro propiedades.
Una implementación es conforme con este RFC si, y solo si, un verificador externo
puede comprobar las cuatro propiedades sobre los registros que la implementación
presenta. Un sobre firmado, una cadena de hashes, checkpoints publicados y pruebas
de inclusión son una realización posible; también lo son formatos y registros
definidos por otros estándares, siempre que cumplan las propiedades.

En consecuencia:

- La especificación MUST NOT exigir un algoritmo, formato de sobre, estructura de
  árbol, cadena de bloques ni infraestructura de claves particular.
- Una implementación MUST declarar qué mecanismo usa, de modo que un verificador
  sepa cómo verificar. Dónde y cómo se declara es la pregunta 3 de §11.
- Un mecanismo provisto por otro estándar es conforme en los mismos términos que uno
  propio. La portada de servicialo.com se corrige en consecuencia (PR separado):
  el protocolo exige propiedades verificables; el mecanismo puede venir de otro
  estándar.

### 4.6 Qué debe poder hacer un verificador

Un verificador es cualquier parte que lee una Prueba de Servicio: un consumidor de la
prueba (Proof of Service 0.3.0 §5), una de las partes, un auditor, un agente. Dado un
registro, el material de verificación que lo acompaña y la declaración de mecanismo
del nodo, el verificador MUST poder comprobar las cuatro propiedades **sin ser un
nodo** del protocolo y sin acceso privilegiado al nodo de origen. Esto sigue a Proof
of Service 0.3.0 §5.1: exigir que el lector sea un nodo anularía el sentido de una
prueba portable.

Si la verificación puede hacerse sin conexión al nodo (con material descargado una
vez) o requiere consultarlo, depende del mecanismo y se deja a las preguntas
abiertas.

---

## 5. Qué queda fuera

Lo siguiente queda explícitamente fuera de este RFC. Nombrarlo evita que la
discusión lo asuma por omisión.

| Fuera | Por qué | Dónde vive, si vive en algún lado |
|---|---|---|
| Algoritmos, formatos de sobre, estructuras de datos concretas | Prescribirlos acopla el protocolo a un stack (§4.5) | Cada implementación; otros estándares |
| Gestión de claves, PKI, emisión o verificación de identidad del atestante | `PROTOCOL.md` §1.2: no es un sistema de identidad | Credenciales verificables y emisores externos; `origin` / `verified_by` |
| Transporte | §1.2: no es un transporte | HTTP, MCP, A2A como bindings |
| Exigir una cadena de bloques, un registro público o una liquidación en cadena | Una realización posible entre otras; exigirla contradice §4.5 | Fuera del protocolo |
| Qué evidencia es *suficiente* para acreditar | Es política, no propiedad | Evidence Profiles; `accreditation_policy` de Proof of Service |
| La relación de interés de cada atestante con la obligación | Atributo de la atestación, no propiedad del registro | [#53](https://github.com/servicialo/mcp-server/issues/53) |
| Si atestó la persona o su agente, y bajo qué mandato | Ídem | [#54](https://github.com/servicialo/mcp-server/issues/54) |
| El peso epistémico de la fuente (`source`, `confidence`) | Es `provenance`, no verificabilidad | [#7](https://github.com/servicialo/mcp-server/issues/7) |
| Marca temporal confiable (autoridad de tiempo) | §4.2 exige orden, no hora verificable | §11, pregunta 7 |
| El modelo de almacenamiento del registro del nodo | Implementación | Cada nodo |

---

## 6. Relación con el perímetro atestado de Coordinalo

**Referencia, no requisito normativo.** La implementación de referencia tiene un
documento propio, **Coordinalo RFC-001 (perímetro atestado)**
(`docs/protocol/rfc-001-perimetro-atestado.md` en el repositorio de Coordinalo, no
público en este repositorio). Lo que de él consta aquí:

- Propone `registered / amended / annulled` como el alcance atestado de `sc_order`
  (citado en el cuerpo del issue
  [#25](https://github.com/servicialo/mcp-server/issues/25), "Prior art in the
  ecosystem").
- La revisión de verificabilidad de la implementación de referencia identificó una
  codificación de token firmado como mecanismo candidato para los *grants* (citado en
  Proof of Service 0.3.0 §5.2, [PR #22](https://github.com/servicialo/mcp-server/pull/22),
  como candidato, no requisito).
- La decisión del mantenedor que motiva este RFC enumera cuatro mecanismos para el
  sustrato de verificación: sobre firmado, cadena de hashes, checkpoints y pruebas de
  inclusión.

La relación que este RFC establece es la siguiente. Los cuatro mecanismos son una
realización conforme de las cuatro propiedades de §4, con un mapeo natural:

| Mecanismo (Coordinalo, referencia) | Propiedad que provee (§4) |
|---|---|
| Sobre firmado | Integridad (§4.1) y no repudio (§4.3) |
| Cadena de hashes | Orden (§4.2) e integridad del conjunto (§4.1) |
| Checkpoints | Anclaje para la inclusión y la consistencia entre lectores (§4.4) |
| Pruebas de inclusión | Inclusión comprobable sin descargar el registro (§4.4) |

Ese mapeo se ofrece como **referencia**: muestra que las propiedades son
alcanzables con un mecanismo que existe o está en construcción, y da a un segundo
implementador un ejemplo concreto. **No es normativo.** Una implementación que
cumpla las cuatro propiedades con un mecanismo distinto es igualmente conforme, y
el protocolo no exige a nadie adoptar el sustrato de Coordinalo.

> **TODO (mantenedor):** confirmar contra el texto de Coordinalo RFC-001 qué
> mecanismos adopta exactamente y en qué sección, y corregir la tabla anterior si el
> mapeo no coincide. Esta sección cita solo lo que ya está referenciado en este
> repositorio.

---

## 7. Relación con el resto de la especificación

| Documento | Qué dice hoy | Efecto de este RFC |
|---|---|---|
| `PROTOCOL.md` §1.2 | No es un transporte ni un sistema de identidad | Sin cambio. Las propiedades no son transporte ni identidad |
| `PROTOCOL.md` §9, Principio 2 | La entrega MUST ser verificable; la evidencia acredita bajo política y a un nivel de certeza | Precisa qué significa "verificable" a nivel de registro, sin tocar la acreditación |
| `PROTOCOL.md` §10.2, principio 6 | El modelo de mandatos no prescribe mecanismos criptográficos | Coherente: este RFC tampoco los prescribe; exige propiedades |
| `PROTOCOL.md` §10.3.1 | `signature` reservado "para verificación criptográfica futura" | Da a ese campo las propiedades que debería cumplir cuando se promueva; no lo promueve |
| `PROTOCOL.md` §10.7 | "Implementations SHOULD consider write-once storage or hash chains" | Pasa de sugerencia de mitigación a propiedad exigida (orden e integridad), sin prescribir la cadena de hashes |
| proof-of-service §3.4 | La prueba nunca se presenta sin su nivel de certeza y su estado de expediente | Sin cambio. Las propiedades de §4 son ortogonales al gradiente de certeza: un registro L1 `asserted` puede ser perfectamente verificable y seguir siendo una afirmación unilateral |
| proof-of-service §5.1 (0.3.0, PR #22) | El consumidor de la prueba no tiene que ser un nodo | §4.6 lo adopta como requisito del verificador |
| proof-of-service §6 Q2 | "Who signs an attestation, and with what key infrastructure?" | Responde la mitad: qué propiedades debe tener la firma. Deja la infraestructura de claves fuera (§5) |
| state-dimensions §2.2 | `attested`: una o más partes atestaron | Sin cambio. La propiedad §4.3 hace verificable la atribución de ese `attested` |
| `GOVERNANCE.md` | Un *signed transparency log* respaldará la neutralidad operativa cuando exista una segunda implementación (roadmap) | Misma familia de mecanismos; distinto objeto (el registry de la red, no la evidencia de un nodo). Ver §11, pregunta 6 |

**Importante.** Las propiedades de §4 **no elevan el nivel de certeza**. Una
atestación con integridad, orden, no repudio e inclusión verificables sigue siendo
L1 `asserted` si solo una parte la hizo. La verificabilidad dice que el registro es
lo que dice ser; no dice que lo registrado sea verdad. Esa distinción es la que
motiva [#53](https://github.com/servicialo/mcp-server/issues/53).

---

## 8. Compatibilidad hacia atrás e impacto en implementaciones

- **Aditivo en el wire.** Este RFC no cambia ningún objeto, enum, tool ni header
  existente. No introduce un objeto wire.
- **No aditivo en conformance, según dónde aterrice.** Si las propiedades entran al
  Core, una implementación que hoy no las cumple deja de ser conforme con la versión
  objetivo. Eso lo hace **Major** bajo RFC-001 §3.2 y exige, además de la
  implementación de referencia, un implementador externo dispuesto a comprometerse.
  Si entran como requisito de la extensión Proof of Service (`draft` en
  `protocol/manifest.yaml`), nada cambia para quien no adopta la extensión, y el RFC
  es **Minor**. Es la pregunta 1 de §11.
- **Transición propuesta** (sujeta a la pregunta 9 de §11): las propiedades se
  publican como SHOULD en la siguiente versión menor, con ventana de dos versiones
  menores (RFC-001 §3.6) antes de pasar a MUST en la versión o nivel de conformance
  objetivo.
- **Implementación de referencia.** Coordinalo está construyendo un sustrato que,
  según §6, realiza las cuatro propiedades. Su adopción se registra por separado de la
  aceptación de este RFC, como para todo RFC
  ([`rfcs/README.md`](README.md), "Scope").
- **Verificación.** Hoy la conformance se revisa manualmente
  ([`public/spec/certification.md`](../public/spec/certification.md)). Un fixture de
  conformance para este RFC sería un conjunto de registros con su material de
  verificación, en dos direcciones: uno válido que verifica y uno manipulado (contenido
  alterado, orden cambiado, registro ausente) que falla. Es una tarea de la
  transición a `Implemented`, no de este documento.

---

## 9. Seguridad, privacidad y cumplimiento

- **Verificabilidad y redacción tiran en direcciones opuestas.** Proof of Service
  0.3.0 §5.3 exige una vista redactada con cero PII por defecto. Si la integridad se
  verifica sobre el registro completo, un consumidor que solo ve la vista redactada no
  puede verificarla. Resolverlo (divulgación selectiva, compromisos por campo) es
  diseño, y es la pregunta 8 de §11. Lo que este RFC fija es que **la redacción no
  puede comprarse al precio de la verificabilidad**: si un mecanismo no admite
  verificar una vista redactada, el consumidor debe saberlo.
- **Datos `restricted`.** Las propiedades de §4 no cambian la clasificación de
  sensibilidad (`PROTOCOL.md` §9.8) ni sus obligaciones. Un compromiso criptográfico
  sobre un registro clínico no es el registro clínico; un mecanismo que publique
  compromisos ante terceros MUST asegurar que del compromiso no se deriva el
  contenido.
- **El nodo deja de ser el único testigo.** Esa es la intención. Hoy, la única
  garantía de que un expediente no fue alterado es la palabra del nodo que lo guarda;
  con §4, el nodo puede ser auditado por quien recibe la prueba.

---

## 10. Alternativas consideradas

### 10.1 Prescribir un mecanismo concreto — RECHAZADA

Especificar, por ejemplo, un sobre firmado con un formato dado, una cadena de hashes
con una función dada y checkpoints publicados en un lugar dado. Rechazada porque
acopla el protocolo a un stack criptográfico, contradice `PROTOCOL.md` §1.2 y §10.2
principio 6, y obliga a reescribir la especificación cada vez que el stack cambie.
También excluye a implementaciones que ya cumplen las propiedades con otro mecanismo.

### 10.2 No exigir nada: dejar el sobre a otros estándares — RECHAZADA

Es la postura que la portada enuncia hoy. Rechazada porque, sin propiedades
exigidas, dos implementaciones conformes pueden producir pruebas de verificabilidad
incomparable, y un consumidor no puede apoyarse en ninguna. Un protocolo cuyo objeto
central es una prueba portable no puede ser indiferente a si la prueba es verificable.

### 10.3 Exigir las propiedades solo como SHOULD — CONSIDERADA, ABIERTA

Reduce el impacto en conformance y permite adopción gradual. El costo es que un
SHOULD no da al consumidor ninguna garantía sobre lo que recibe. Se incorpora como
camino de transición (§8), no como destino; la ventana decide (§11, preguntas 1 y 9).

### 10.4 Exigir un subconjunto (integridad y no repudio, sin orden ni inclusión) — CONSIDERADA, ABIERTA

Dos propiedades bastan para verificar un registro aislado; no bastan para verificar
un expediente (que ningún registro fue insertado o quitado después). Como la Prueba
de Servicio es un expediente, el borrador propone las cuatro; la ventana puede
argumentar que orden e inclusión pertenecen a un nivel de conformance superior (§11,
pregunta 11).

---

## 11. Preguntas abiertas

Numeradas para que la ventana pueda referirlas.

1. **Dónde aterriza.** ¿Core (requisito de conformance, Major), extensión Proof of
   Service (Minor), o nivel de conformance FULL de
   [`certification.md`](../public/spec/certification.md)? La categoría del RFC
   depende de esta respuesta.
2. **Granularidad.** ¿A qué objetos aplican las propiedades además de los Evidence
   Events y las atestaciones: transiciones (`transition`), eventos de liquidación, el
   perímetro de la Service Order (lo que Coordinalo RFC-001 llama perímetro atestado)?
3. **Declaración de mecanismo.** ¿Cómo anuncia un nodo qué mecanismo usa para que un
   verificador sepa cómo verificar: una capability en `registry.manifest`, un
   identificador por registro, ambos? ¿Hace falta un registro de mecanismos
   reconocidos, o basta con que el mecanismo sea verificable con material público?
4. **A qué se ata el no repudio.** ¿Una clave que controla el atestante, una cuenta en
   el nodo, una credencial de un tercero? Cada opción tiene un modelo de confianza
   distinto y una relación distinta con "no es un sistema de identidad" (§1.2).
5. **Orden entre nodos.** Las propiedades de §4 asumen un registro por nodo. Cuando
   una obligación cruza nodos (dos implementaciones, una Order), ¿se exige algún
   orden o consistencia entre registros, o cada nodo responde por el suyo?
6. **Consistencia entre lectores.** ¿Debe el nodo publicar compromisos periódicos ante
   una parte distinta de sí mismo para que dos lectores puedan comprobar que ven lo
   mismo? ¿Es la misma infraestructura que el *transparency log* que `GOVERNANCE.md`
   proyecta para el registry, o una distinta?
7. **Tiempo.** ¿Se exige una marca temporal verificable (distinta del orden de
   compromiso), y con qué autoridad? ¿O basta el orden más el `captured_at` declarado?
8. **Redacción y verificabilidad.** ¿Puede un consumidor verificar integridad e
   inclusión sobre una vista redactada (Proof of Service 0.3.0 §5.3), y qué exige eso
   del mecanismo? Cruza con la pregunta 7 de ese borrador.
9. **Transición.** ¿SHOULD en la próxima menor y MUST en v1.0, con la ventana de
   RFC-001 §3.6? ¿Qué debe hacer una implementación existente que no cumple ninguna
   de las cuatro propiedades?
10. **Artefactos referenciados.** ¿Es [#28](https://github.com/servicialo/mcp-server/issues/28)
    (digests en los payloads que llevan `uri`) un prerrequisito de §4.1, o un
    compañero que puede avanzar en paralelo?
11. **Conjunto mínimo.** ¿Son las cuatro propiedades el mínimo, o integridad y no
    repudio bastan para un nivel básico y orden e inclusión pertenecen a un nivel
    superior (§10.4)?
12. **Criterios de promoción.** Propuesta inicial, a confirmar: para pasar de Draft a
    Accepted, al menos una implementación que exponga registros con las cuatro
    propiedades y un verificador independiente del nodo que las compruebe; si la
    respuesta a la pregunta 1 es Core, además un implementador externo comprometido
    (RFC-001 §3.2).

---

## 12. Decision

*Vacío mientras el RFC esté en Draft, Open for Comment o Final Comment Period. Lo
completa el mantenedor al decidir, según RFC-001 §3.4.*

---

> Maintained by Servicialo SpA (Santiago, Chile). Protocol specification licensed under Apache-2.0. Governance and stewardship plan: [GOVERNANCE.md](../GOVERNANCE.md).
>
> Mantenido por Servicialo SpA (Santiago, Chile). Especificación del protocolo bajo licencia Apache-2.0. Gobernanza y plan de stewardship: [GOVERNANCE.md](../GOVERNANCE.md).
