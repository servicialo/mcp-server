# Protocolo Servicialo — Glosario

El protocolo opera sobre dos capas conceptuales distintas:

- **Primitivas de evento** — lo que emite la red al resolver 
  coordinación.
- **Modelos de billing** — cómo se monetiza sobre esos eventos.

Mezclar ambas capas genera ambigüedad. Este glosario las 
mantiene separadas.

---

## 1. Evento fundamental

El protocolo define dos primitivas universales:

    entrega_verificada(correlationId)
    pago_verificado(correlationId)

Su conjunción produce la coordinación resuelta. El 
`correlationId` determina la granularidad del evento.

---

## 2. Primitivas de evento (lo que emite la red)

| Sigla | Nombre | Definición | correlationId |
|-------|--------|------------|---------------|
| SC | Servicio Coordinado | Unidad mínima de coordinación resuelta. Existe cuando una entrega específica y su pago asociado quedan verificados. | `sessionId` |
| CAC | Ciclo Agregado Coordinado | Unidad de coordinación resuelta sobre una cartera o período consolidado. Existe cuando la coordinación se evalúa a nivel de conjunto, no por evento aislado. | `clientId + periodo` |

Una organización puede operar en modelo SC-nativo, CAC-nativo 
o híbrido. El protocolo soporta los tres sin distinción.

---

## 3. Modelos de billing (cómo se cobra sobre los eventos)

| Sigla | Qué cobra | Sobre qué evento |
|-------|-----------|------------------|
| SC billing | Comisión por servicio resuelto | Cada evento SC |
| CAC billing | Fee por cliente coordinado en el período | Cada evento CAC |
| RAC billing | Fee por recurso activo | Base instalada, no evento |

Las tres modalidades pueden coexistir en una misma 
organización sobre la misma red.

---

## 4. Medida de capacidad (PdC)

- **RC — Recursos Coordinados**: cantidad de recursos 
  (profesionales, sedes, agentes, canales) que participaron 
  al menos en un SC durante el período. Componente de la 
  Prueba de Coordinación: `PdC = f(SC, CC, RC)`.

RC y RAC refieren a la misma realidad operativa (recursos 
activos) observada desde ángulos distintos: RAC es unidad de 
billing de infraestructura; RC es medida de capacidad activa 
para el cálculo del PdC.

---

## 5. Implementaciones de referencia

- **Coordinalo** — implementación de referencia en producción 
  (Mamá Pro, go-live 31 marzo 2026).

---

## 6. Inteligencia de red

Términos que aparecen en `docs/benchmarks.md`, `docs/telemetry-operational.md`, `WEBHOOKS.md` y `GOVERNANCE.md`.

| Término | Definición |
|---------|------------|
| **Evento operacional** | Una de las 4 emisiones bucketeadas que un nodo manda al registry: `booking_created`, `service_completed`, `dispute_opened`, `payment_settled`. Schema: [`schema/telemetry/operational-event.schema.json`](./schema/telemetry/operational-event.schema.json). |
| **Bucketing** | Reemplazo de un valor numérico exacto por la banda categórica a la que pertenece (e.g. precio `$45.000` → `25-50k`; duración `47 min` → `30-60min`). Hecho por el emisor antes de mandar el evento. |
| **org_fingerprint** | Identificador opaco de un nodo contribuyente. `SHA-256(slug ‖ salt)`. Estable per-nodo, no reversible. Usado para k-anonimato sin exponer el slug. |
| **k-anonimato ≥ 5** | Regla de privacidad: un segmento se publica sólo si tiene ≥ 5 `org_fingerprint` distintos contribuyentes. Bajo eso, la respuesta es `insufficient_data`. |
| **Segmento** | Tupla `(event_type, vertical, region)` sobre una ventana temporal. La unidad mínima de agregación. |
| **Distribution-of-buckets** | El formato del benchmark publicado: `{ field: { bucket: { count, share } } }`. No es un percentil numérico — es la fracción de eventos en cada bucket. |
| **Contribuir-para-acceder** | Política operativa del Principio #7. Nodos que emiten telemetría operacional ven en tiempo real; nodos que no, ven datos con 90 días de delay. Sin tier de pago. Detalles en [`GOVERNANCE.md`](./GOVERNANCE.md#contribute-to-access-policy-v01). |
| **Tier 0** | Caller anónimo o sin `X-Servicialo-Node-Token` válido. Ventana clamped a `[now-180d, now-90d]`. |
| **Tier 1** | Caller identificado pero con `< 50` eventos en los últimos 30 días. Misma ventana que tier 0. |
| **Tier 2** | Caller identificado con `≥ 50` eventos en 30d. Ventana real-time hasta "ahora". |
| **Weekly snapshot** | El payload del evento `benchmark.weekly_snapshot`. Calculado cada lunes 00:00 UTC, incluye todos los segmentos elegibles (k-anon ≥ 5) de la semana, ajustado al tier de cada suscriptor. |
| **Subscription** | Fila en `webhook_subscriptions`. Vincula un `node_id` (vía `registry_entries.ownership_token`) a una URL HTTPS, un set de eventos, y un secret HMAC. |
| **Delivery** | Fila en `webhook_deliveries`. Un intento de entregar un evento a una subscription. Estados: `pending → delivered | failed → abandoned`. |
