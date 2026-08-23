# Stress test de casos — Servicialo v0.10

> **Documento de análisis — no normativo.** Ejercicio de stress test corrido en
> agosto de 2026 contra los primitivos del protocolo. Su caveat metodológico
> (§ final) advierte que la batería original corrió contra el modelo público, no
> contra `PROTOCOL.md` completo. Esa verificación ya se hizo: el resultado por
> pregunta —qué responde la spec hoy, con cita exacta— vive en
> [`docs/issue-templates/stress-test-v0.10/README.md`](./issue-templates/stress-test-v0.10/README.md).
> Ninguno de los nueve veredictos cambió; dos de las doce preguntas resultaron
> ya respondidas por la spec y no se publicaron como issues.
>
> Nada de este documento es normativo. Lo normativo es `PROTOCOL.md` y los
> schemas; las propuestas derivadas viven en `rfcs/` y en las extensiones.

**Objetivo:** someter los primitivos (Offer → Order → Delivery + Evidence + Settlement, más Mandate y la separación Provider / Client / Payer, con dimensiones de estado ortogonales) a nueve servicios reales genuinamente distintos, y anotar dónde el mapeo es natural, dónde exige una decisión y dónde se quiebra.

**Regla del ejercicio:** prohibido proponer entidades nuevas. Cada tensión solo puede resolverse con (a) un patrón que la spec bendiga, (b) una extensión —idealmente una ya draft—, o (c) una decisión normativa. Si nada de eso alcanza, es veredicto C y hay que decirlo.

**Escala de veredicto:**
- **A** — expresable con los primitivos actuales (a veces con un patrón que conviene documentar).
- **B** — requiere extensión o decisión normativa que hoy no está escrita; sin ella, dos implementadores razonables divergen.
- **C** — rompe una primitiva; error de abstracción.

**Ejes cubiertos por el set:** granularidad de la entrega, servicios de disponibilidad (espacio negativo), precio por consumo y re-precio, multiplicidad de partes (N clientes, N pagadores, cadenas), mutación contractual, settlement adversarial y de origen externo, autoridad de aceptación, delegación con alcance, entrega digital máquina-a-máquina.

---

## Caso 1 — Kinesiología con reembolso de asegurador

**Escenario.** Un centro publica "Sesión de kinesiología, 45 min". Paciente contrata 10 sesiones y paga de su bolsillo tras cada una. Después presenta el expediente a su asegurador, que le reembolsa el 60% *al paciente*, semanas más tarde, solo si la evidencia satisface su política. El asegurador jamás contrata con el centro.

**Mapeo.** Offer = la sesión. Order = paciente↔centro (en esa relación bilateral, client = payer = paciente). Deliveries = 10 sesiones. Evidence = confirmación bilateral + contexto en sitio (L1–L2). Settlement = 10 cobros pagados. Hasta ahí, limpio.

**Tensión.** El asegurador no es Payer del Order. La separación client/payer del protocolo cubre "el empleador paga", pero aquí el flujo es *paciente paga y un tercero le reembolsa al paciente*: un movimiento financiero entre dos partes que no tienen Order entre sí, condicionado a la Prueba de Servicio de un Order ajeno. ¿Ese reembolso se registra en el protocolo (settlement de un tercer contexto que referencia la PoS) o queda fuera y la PoS es solo insumo? ¿Con qué mecanismo un no-participante obtiene acceso de lectura a la PoS (grant, alcance, revocación, privacidad)?

**Veredicto: A para el servicio, B para el reembolso.** Cabe en la extensión Settlement (o en la formalización de PoS) como "settlement de tercero referenciando una PoS". No pide objeto nuevo; pide nombrar el rol: el asegurador es **consumidor de PoS con derecho de acceso**, no Payer.

**Por qué importa doble:** esta es exactamente la "ruta de adopción" de la landing y la tesis comercial de reembolsos de Coordinalo. Conviene que la spec nombre ese rol antes de que el producto lo improvise.

---

## Caso 2 — Reparación industrial por hitos (B2B, mundo RDM / Star Line)

**Escenario.** Reparación de un molde/casco: hito 1 diagnóstico (precio fijo), hito 2 fabricación con materiales a costo +15% (los materiales suben 12% a mitad de camino), hito 3 instalación y prueba. Cliente acepta formalmente cada hito. Retención del 10% que se libera a los 60 días si no hay reclamos de garantía. A mitad del trabajo se amplía el alcance por adenda.

**Mapeo.** Offer = capacidad de reparación con precio "según diagnóstico". Order = alcance por hitos + política de retención + garantía. Deliveries = una por hito (+ eventuales deliveries de garantía bajo el mismo Order). Los materiales **no** son deliveries: son componente de precio del Order/hito; su variación entra por adenda o por regla de pricing declarada. La aceptación por hito es la dimensión de aceptación haciendo su trabajo, separada de entrega y de pago.

**Tensiones.**
1. ¿La Offer soporta precio indeterminado que se resuelve en el Order? Debería bastar con declarar `pricing: por evaluación` — decisión normativa menor. [verificar contra schema de Offer cuando exista]
2. La adenda exige que la **enmienda del Order sea primera clase** (versionado o evento `amended`). El RFC-001 ya propone `registered/amended/annulled` para `sc_order` en Coordinalo — este caso confirma que `amended` tiene que subir a la spec pública, no quedarse en la implementación.
3. La retención es un settlement "hold → release" condicionado a la *ausencia* de eventos en una ventana. Territorio natural de la extensión Settlement.
4. Durante la garantía el Order queda **vigente sin deliveries programadas** por 60 días. Si el ciclo de vida del Order exige progresión, hay fricción; si un Order es un acuerdo vigente sin agenda, es natural. Conviene escribirlo.

**Veredicto: A con dos B menores** (retención → ext. Settlement; enmienda como primera clase → decisión normativa).

---

## Caso 3 — Iguala mensual de abogado (disponibilidad) ★ el caso más profundo del set

**Escenario.** $X/mes por hasta 10 horas + disponibilidad prioritaria. Marzo: cero horas consumidas; se factura y paga igual. Abril: 14 horas (4 extra a tarifa marginal).

**Tensión central.** Si Delivery = "instancia ejecutada del servicio", marzo no tiene instancia — pero el servicio (disponibilidad) **sí se prestó y se cumplió**. Hay dos salidas, y las dos tocan algo importante:

- **(a) Permitir settlement ligado solo al Order, sin delivery.** Preserva la semántica de "instancia ejecutada", pero debilita el invariante "el cobro queda vinculado a la entrega" — que es el corazón de la Prueba de Servicio.
- **(b) Bendecir la "delivery-período":** una Delivery de tipo disponibilidad, con ventana temporal, cuya evidencia es la vigencia del compromiso (y, si existe, logs de standby). Preserva el invariante cobro↔entrega, pero estira "ejecutada" hacia "obligación cumplida durante T".

El caso obliga a decidir si la unidad de valor del protocolo es **el acto** o **la obligación cumplida**. Mi lectura: (b), con perfil de evidencia propio — Evidence Profiles ya existe como extensión candidata y es su lugar natural. Las 4 horas extra de abril son deliveries adicionales bajo el mismo Order con pricing marginal (se combina con el caso 4).

**Veredicto: B.** No rompe primitivas —hay dos salidas compatibles—, pero es el único caso del set donde la spec actual dejaría a dos implementadores razonables en modelos **incompatibles** (uno con deliveries "fantasma", otro con settlements huérfanos). Y las igualas/retainers/mantenciones son un caso comercial masivo, no una esquina exótica.

---

## Caso 4 — Consultoría 200 h, tarifa por consumo, sustitución de líder

**Escenario.** T&M con tarifa por hora según seniority, facturación mensual del consumo, timesheets aprobados por el cliente, líder del equipo reemplazado en el mes 3, tarifas +5% en la renovación del mes 6, alcance ampliado dos veces.

**Mapeo.** Order con **esquema de tarifas** en lugar de monto — el Order registra "alcance, precio, políticas", así que debería admitir un schedule y no solo un número. [verificar en schema de Order] Evidencia: el timesheet contrafirmado es confirmación bilateral pura — encaja perfecto en L1 del gradiente. Sustitución del líder: a nivel de una delivery es la excepción de reasignación ya contemplada; a nivel Order (el recurso comprometido cambia para todo el resto) es enmienda — otra vez el caso 2.

**Tensión.** La **granularidad de la Delivery** queda a criterio del implementador: ¿por día trabajado, por semana-timesheet, por entregable? Todas conformes, pero si el implementador X emite delivery-por-timesheet y el Y delivery-por-entregable, la agregación entre nodos es incomparable. No es un bug: es la ausencia de una guía. Recomendación no normativa que la spec debería incluir: *delivery = la unidad mínima que puede aceptarse o facturarse por separado*.

**Veredicto: A**, con apéndice de granularidad recomendado.

---

## Caso 5 — Cohorte educativa: 20 alumnos, pagadores mixtos, alta y baja a mitad

**Escenario.** Curso de 12 semanas, 20 alumnos: 14 pagan solos, 6 los pagan dos empleadores distintos. Uno entra en semana 3 (prorrateado), otro se retira en semana 6 (refund parcial según política). Certificado solo con ≥80% de asistencia.

**Mapeo.** Offer = la cohorte con cupos. **20 Orders bilaterales** (client = alumno; payer = alumno o empleador — la separación ya existente lo cubre). La clase física es un solo hecho, pero en protocolo son 20 deliveries, una por Order — y eso es correcto: cada relación comercial tiene su propia verdad.

**Tensión.** La evidencia (lista de asistencia firmada, grabación) es **un hecho único que respalda N deliveries**. Si el modelo obliga 1 evidence → 1 delivery, se duplica el registro citando el mismo artefacto. La salida limpia: Evidence referencia **artefactos direccionables (URI + hash)** reutilizables entre deliveries y Orders. Veinte expedientes citando el mismo hash no es suciedad — es cómo funcionan los hechos compartidos.

El certificado es el patrón "outcome = afirmación respaldada por evidencia" (N confirmaciones de asistencia) — composición, no entidad nueva. Alta tardía y refund parcial son settlement estándar.

**Veredicto: A**, con la decisión de evidencia-por-referencia escrita en la spec.

---

## Caso 6 — Cuidado domiciliario con agente delegado

**Escenario.** La hija (pagadora y mandante) delega en su agente: agendar/reagendar hasta 8 visitas al mes, tope de gasto, prohibido cancelar la serie. Beneficiaria: la madre (client). Visita 5: la cuidadora no llega; la agencia envía sustituta 2 horas tarde; la madre confirma la visita; la hija disputa el cobro por el atraso. Más tarde, el agente intenta cancelar la serie.

**Mapeo.** Mandate con alcance (Delegated Agency, ya experimental). Order: client = madre, payer = hija, mandato de la hija vía agente. No-show del proveedor + sustitución: excepciones contempladas (queda la decisión de patrón: ¿misma delivery reasignada o delivery de reemplazo? — reasignación si el compromiso es el slot, reemplazo si es la persona).

**Tensiones.**
1. **Autoridad de aceptación.** ¿Quién emite la confirmación que cuenta: la beneficiaria, la pagadora, o ambas según política? El protocolo separa client/payer para el dinero; este caso muestra que hay que separar también *quién puede confirmar/aceptar*, declarado en la política del Order. Evidence Profiles es el lugar natural — hoy define "qué constituye evidencia válida por vertical"; falta el "**y de quién**".
2. **Enforcement de alcance del mandato.** El intento de cancelar la serie está fuera de scope. Ya se sabe que el enforcement en el boundary MCP de referencia es parcial; este caso lo sube de "detalle de implementación" a **requisito MUST del perfil de conformance del consumidor**: un consumidor conforme respeta y verifica scope.

**Veredicto: A/B** — los primitivos aguantan; dos decisiones normativas pendientes.

---

## Caso 7 — Fotografía de boda: entrega parcial + chargeback ★ donde la ortogonalidad brilla

**Escenario.** Paquete = cobertura del evento + álbum físico, 100% prepagado con tarjeta. La cobertura se entrega impecable (fotos, presencia, confirmación del cliente). El álbum nunca llega. El cliente hace **chargeback del total** por el riel de la tarjeta — fuera del protocolo. El proveedor disputa: la cobertura sí se entregó.

**Mapeo.** 1 Order, 2 Deliveries. D1 (cobertura): entrega = completada, evidencia = registrada, aceptación = aceptada, financiero = revertido. D2 (álbum): entrega = nunca, aceptación = disputada. Cuatro dimensiones diciendo cosas distintas sobre D1 — **y todas verdaderas a la vez**. Un modelo de estado único no puede expresar "entregado, evidenciado, aceptado y financieramente revertido"; Servicialo sí. Este es el caso que justifica la decisión arquitectónica central.

**Tensiones.**
1. **Settlement de origen externo.** El chargeback lo origina el riel, no una parte del protocolo. El protocolo debe poder *registrar* movimientos que no autorizó, con atribución de origen (`origin: external_rail` o similar). Decisión menor, pero necesaria: sin ella, la dimensión financiera miente por omisión.
2. **Asignación Order → Deliveries.** El dinero se movió a nivel Order (el total); la verdad vive a nivel Delivery. Falta poder declarar la asignación del monto entre deliveries, para que la PoS de D1 diga "la porción atribuible a esta entrega fue revertida". Extensión Settlement, de nuevo.

**Veredicto: A para el modelo de estados (caso estrella); B en asignación y origen externo (ext. Settlement).**

**Bonus estratégico.** La PoS de D1 es exactamente el expediente que un proveedor presenta en el *representment* de un chargeback. Ese es un caso de uso comercial de la Prueba de Servicio que la landing ni menciona — y apunta a un tipo de implementador #2 con incentivo económico directo: adquirentes y PSPs.

---

## Caso 8 — Traducción asincrónica agente-a-agente con SLA

**Escenario.** El agente de una editorial contrata un servicio de traducción (operado por agentes + humanos): 40.000 palabras, SLA 72 h, precio por palabra, penalidad 10% por cada 24 h de atraso, QA automatizado del cliente decide la aceptación, re-trabajo de 2 capítulos.

**Mapeo.** Descubrimiento y booking vía binding A2A (candidato). Order con pricing por unidad + cláusula SLA. Delivery = entrega del artefacto (o por capítulo — granularidad, caso 4). **La evidencia y la entrega colapsan en el mismo objeto**: el hash del archivo + timestamp contrafirmado por dos máquinas = L1 casi automático. Aceptación emitida por el agente del cliente bajo Mandate (el mecanismo del caso 6, lado cliente). Re-trabajo = nueva delivery con relación "corrige a" — las deliveries deberían poder referenciarse entre sí (patrón menor).

**Tensión.** La penalidad SLA es un ajuste de settlement **computable desde la PoS** (timestamps de delivery vs cláusula del Order). No pide primitiva nueva; pide que la cláusula viva en el Order como **término estructurado legible por máquina**, no solo prosa. Decisión de spec: términos computables opcionales en Order.

**Veredicto: A** — y es el caso que valida la tesis agéntica: cuando la entrega es digital, el gradiente de certeza se comprime y la liquidación se vuelve computable. El protocolo diseñado para kinesiólogos aguanta el caso más futurista casi sin esfuerzo. Eso es señal de primitivos correctos.

---

## Caso 9 (control / anti-patrón) — Subcontratación en cadena

**Escenario.** Una oficina contrata a una empresa de aseo; la empresa subcontrata la limpieza de vidrios exteriores a un independiente. Un acto físico, dos relaciones comerciales.

**Mapeo correcto.** **Dos Orders bilaterales independientes** (oficina↔empresa; empresa↔independiente), cada uno con sus deliveries y settlements. La evidencia física se referencia por hash desde ambos contextos (mismo mecanismo del caso 5). El protocolo no necesita conocer la cadena; el vínculo entre Orders es metadato opcional.

**Anti-patrón a documentar.** El Order tripartito. La separación client/payer ya tienta a "meter al tercero adentro". La spec debería decirlo explícito: *las relaciones son siempre bilaterales; las cadenas se componen de Orders*. Es el primer error que cometería un implementador de marketplace, y prevenirlo cuesta un párrafo en la guía.

**Veredicto: A** — incluido como ejemplo negativo en /implementors vale más que como caso resuelto.

---

# Síntesis

| # | Caso | Veredicto | Qué pide |
|---|------|-----------|----------|
| 1 | Reembolso asegurador | A + B | Rol "consumidor de PoS" + settlement de tercero (ext. Settlement / PoS) |
| 2 | Reparación por hitos B2B | A + B | Enmienda primera clase; retención hold/release (ext. Settlement) |
| 3 | Iguala / disponibilidad | **B** | Decisión normativa: delivery-período o settlement sin delivery |
| 4 | Consultoría T&M | A | Guía de granularidad; tarifas como schedule [verificar] |
| 5 | Cohorte N alumnos | A | Evidencia por referencia (URI + hash) reutilizable |
| 6 | Cuidado con agente delegado | A/B | Autoridad de aceptación en policy; scope como MUST de conformance |
| 7 | Parcial + chargeback | A + B | Origen externo de settlement; asignación Order→Delivery |
| 8 | Traducción A2A con SLA | A | Términos computables opcionales en Order; deliveries que se referencian |
| 9 | Subcontratación | A | Documentar anti-patrón tripartito |

**Distribución: 0 casos C.** El pronóstico del otro análisis se confirma: la descomposición aguanta. Pero dos hallazgos están cerca del hueso y merecen tratarse antes que el resto:

1. **Caso 3 (disponibilidad).** La definición de Delivery como "instancia ejecutada" más el invariante "cobro vinculado a entrega" no cubren los servicios de disponibilidad sin una decisión que hoy no está escrita. Es el único punto del set donde dos implementadores conformes producirían modelos incompatibles — y los retainers son medio mercado de servicios profesionales.
2. **Caso 1 (tercero-reembolsador).** El asegurador no es Payer ni Client: es un consumidor de PoS con derecho de acceso. Como esa es la tesis comercial de Coordinalo con reembolsos, la spec debería nombrar el rol antes de que el producto lo improvise y la implementación de referencia fije un de-facto sin discusión.

**Patrón transversal.** Ninguna tensión pidió una entidad nueva. Todas pidieron una de tres cosas:
- **Patrones bendecidos:** delivery-período, evidencia por referencia hash, deliveries que se referencian, anti-patrón tripartito, guía de granularidad.
- **Capacidades de la extensión Settlement:** retenciones hold/release, origen externo (rieles), asignación Order→Delivery, ajustes computables (SLA), settlement de terceros vía PoS.
- **Decisiones de autoridad y acceso:** quién confirma/acepta (Evidence Profiles), quién lee la PoS (grants), enforcement de Mandate como MUST del perfil consumidor.

Nótese que las extensiones draft existentes —Settlement, Evidence Profiles, Delegated Agency, Disputes— mapean casi 1:1 con lo que los casos piden. Eso es evidencia fuerte de que el roadmap de extensiones está bien apuntado, y de que el trabajo no es inventar la número cinco: es **madurar esas cuatro con los requisitos concretos de esta tabla**.

---

# Doce preguntas de spec (listas para convertirse en issues)

1. ¿Puede un Settlement Event ligarse solo al Order, o toda liquidación exige delivery? (Caso 3 — decide el modelo de retainers.)
2. Si la respuesta es "exige delivery": ¿se define normativamente la delivery-período (disponibilidad cumplida durante ventana T) y su perfil de evidencia? (Caso 3.)
3. ¿Cómo accede un no-participante (asegurador, banco en representment) a una PoS: grant explícito, alcance, revocación, mínimos de privacidad? (Casos 1 y 7.)
4. ¿Puede registrarse un settlement entre partes que no comparten Order, referenciando una PoS ajena? (Caso 1.)
5. ¿La enmienda de Order es primera clase (versionado o evento `amended`) en la spec pública, alineada con el vocabulario `registered/amended/annulled` del RFC-001? (Casos 2 y 4.)
6. ¿Settlement soporta retención hold → release condicionada a ausencia de eventos en ventana? (Caso 2.)
7. ¿Puede un Order permanecer vigente sin deliveries programadas (período de garantía)? (Caso 2.)
8. ¿Order.price admite esquemas de tarifas (por hora, por unidad, marginales) además de montos? [verificar contra schema actual] (Casos 3, 4, 8.)
9. ¿Un Evidence Event puede referenciar artefactos direccionables (URI + hash) compartidos entre múltiples deliveries y Orders? (Casos 5 y 9.)
10. ¿La política del Order puede declarar la autoridad de confirmación/aceptación (beneficiario, pagador, mandatario), y Evidence Profiles la incorpora? (Caso 6.)
11. ¿El enforcement de alcance del Mandate es MUST del perfil de conformance del consumidor? (Caso 6.)
12. ¿Settlement Events admiten origen externo (`external_rail`) y asignación declarada del monto Order→Deliveries? (Caso 7.)

---

**Caveat metodológico.** Este test corre contra el modelo público (home de servicialo.com + las citas de la spec del análisis anterior), no contra PROTOCOL.md completo. Donde un veredicto depende de un detalle no verificado lo marqué [verificar]. Si alguno de esos detalles ya está resuelto en la spec, el veredicto mejora — ninguno empeora. El paso natural: correr esta misma batería contra PROTOCOL.md + schemas dentro del repo con Claude Code, caso por caso, y convertir las doce preguntas en issues.
