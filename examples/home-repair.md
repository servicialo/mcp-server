# Ejemplo: Reparación eléctrica a domicilio

Un agente AI coordina una reparación eléctrica en el hogar del cliente. Este ejemplo muestra cómo la evidencia cambia por vertical: en vez de fichas clínicas y GPS, la prueba de entrega son fotos antes/después y firma del cliente.

> Datos ficticios contra la implementación de referencia [Coordinalo](https://coordinalo.com).

---

## Fase 1 — Descubrir

El usuario le dice al agente: *"Se me cortó la luz en la cocina, necesito un electricista en Ñuñoa."*

### 1.1 Buscar organizaciones

```
Tool: registry.search
```

```json
{
  "vertical": "electricidad",
  "location": "Ñuñoa"
}
```

```json
← {
  "organizations": [
    {
      "slug": "hogar-seguro-nunoa",
      "name": "Hogar Seguro Ñuñoa",
      "vertical": "electricidad",
      "location": "Ñuñoa, Santiago",
      "services_count": 6,
      "professionals_count": 4
    }
  ]
}
```

### 1.2 Listar servicios

```
Tool: services.list
```

```json
{
  "org_slug": "hogar-seguro-nunoa"
}
```

```json
← {
  "services": [
    {
      "id": "srv_diag_electrico",
      "name": "Diagnóstico eléctrico",
      "duration_minutes": 60,
      "price": 25000,
      "currency": "CLP"
    },
    {
      "id": "srv_rep_tablero",
      "name": "Reparación de tablero eléctrico",
      "duration_minutes": 120,
      "price": 65000,
      "currency": "CLP"
    },
    {
      "id": "srv_rep_general",
      "name": "Reparación eléctrica general",
      "duration_minutes": 90,
      "price": 45000,
      "currency": "CLP"
    }
  ]
}
```

El agente sugiere el diagnóstico primero: *"Encontré Hogar Seguro en Ñuñoa. Sugiero empezar con un diagnóstico eléctrico ($25.000, 1 hora) para identificar el problema antes de una reparación. Quieres que busque disponibilidad?"*

El usuario acepta.

### 1.3 Consultar disponibilidad

```
Tool: scheduling.check_availability
```

```json
{
  "org_slug": "hogar-seguro-nunoa",
  "service_id": "srv_diag_electrico",
  "date_from": "2026-02-24",
  "date_to": "2026-02-26"
}
```

```json
← {
  "slots": [
    {
      "provider_id": "pro_luis_herrera",
      "provider_name": "Luis Herrera",
      "credentials": ["Electricista SEC Clase A"],
      "available": [
        { "date": "2026-02-24", "start": "14:00", "end": "15:00" },
        { "date": "2026-02-25", "start": "09:00", "end": "10:00" },
        { "date": "2026-02-25", "start": "16:00", "end": "17:00" }
      ]
    }
  ]
}
```

El usuario elige: *"Mañana a las 9."*

---

## Fase 2 — Entender

### 2.1 Dimensiones del servicio

```
Tool: service.get
```

```json
{
  "service_id": "srv_diag_electrico"
}
```

```json
← {
  "id": "srv_diag_electrico",
  "name": "Diagnóstico eléctrico",
  "vertical": "electricidad",
  "duration_minutes": 60,
  "location_type": "home_visit",
  "price": { "value": 25000, "currency": "CLP" },
  "evidence_required": ["photo_before", "photo_after", "checklist", "client_signature"]
}
```

### 2.2 Contrato

```
Tool: contract.get
```

```json
{
  "service_id": "srv_diag_electrico",
  "org_id": "org_hogar_seguro"
}
```

```json
← {
  "evidence_required": ["photo_before", "photo_after", "checklist", "client_signature"],
  "cancellation_policy": {
    "free_before_hours": 12,
    "penalty_2_to_12h": 0.5,
    "penalty_under_2h": 1.0
  },
  "no_show_policy": {
    "client": "charge_full",
    "provider": "reassign_and_penalize"
  },
  "dispute_window_hours": 72
}
```

Diferencia con salud: la evidencia aquí son **fotos antes/después** y **firma del cliente**, no fichas clínicas. La ventana de disputa es 72 horas (vs 48 en salud) porque en reparaciones del hogar los problemas pueden aparecer después.

---

## Fase 3 — Comprometer

### 3.1 Identificar al cliente

```
Tool: clients.get_or_create
```

```json
{
  "phone": "+56912345678",
  "name": "Roberto",
  "last_name": "Soto",
  "actor": { "type": "agent", "id": "agent_claude" }
}
```

```json
← {
  "id": "cli_roberto_soto",
  "name": "Roberto",
  "last_name": "Soto",
  "phone": "+56912345678",
  "is_new": true,
  "history": {
    "total_sessions": 0,
    "completed": 0,
    "cancelled": 0
  }
}
```

Cliente nuevo.

### 3.2 Agendar

```
Tool: scheduling.book
```

```json
{
  "service_id": "srv_diag_electrico",
  "provider_id": "pro_luis_herrera",
  "client_id": "cli_roberto_soto",
  "starts_at": "2026-02-25T09:00:00-03:00",
  "actor": { "type": "agent", "id": "agent_claude" }
}
```

```json
← {
  "session_id": "ses_20260225_0900_lherrera",
  "state": "requested",
  "service": "Diagnóstico eléctrico",
  "provider": "Luis Herrera",
  "client": "Roberto Soto",
  "starts_at": "2026-02-25T09:00:00-03:00",
  "ends_at": "2026-02-25T10:00:00-03:00",
  "location": "Domicilio del cliente"
}
```

### 3.3 Confirmar

```
Tool: scheduling.confirm
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "actor": { "type": "agent", "id": "agent_claude", "on_behalf_of": { "type": "client", "id": "cli_roberto_soto" } }
}
```

```json
← {
  "session_id": "ses_20260225_0900_lherrera",
  "state": "confirmed"
}
```

El agente confirma: *"Listo. Diagnóstico eléctrico mañana miércoles 25 a las 9:00 AM en tu domicilio con Luis Herrera (Electricista SEC Clase A). Cancelar con menos de 2 horas cobra el 100%."*

---

## Fase 5 — Verificar entrega

*Al día siguiente, Luis llega al domicilio.*

### 5.1 Check-in

```
Tool: delivery.checkin
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "actor": { "type": "provider", "id": "pro_luis_herrera" },
  "location": { "lat": -33.4569, "lng": -70.5983 },
  "timestamp": "2026-02-25T09:03:00-03:00"
}
```

```json
← {
  "state": "in_progress",
  "checkin_at": "2026-02-25T09:03:00-03:00"
}
```

### 5.2 Foto del estado inicial (antes)

```
Tool: delivery.record_evidence
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "evidence_type": "photo",
  "data": {
    "type": "photo_before",
    "url": "https://storage.example.com/ses_20260225/before_tablero.jpg",
    "description": "Tablero eléctrico — automático termomagnetico de cocina caído, signos de sobrecarga",
    "gps": { "lat": -33.4569, "lng": -70.5983 },
    "timestamp": "2026-02-25T09:05:00-03:00"
  },
  "actor": { "type": "provider", "id": "pro_luis_herrera" }
}
```

```json
← {
  "evidence_id": "evi_20260225_photo_before"
}
```

### 5.3 Check-out

*55 minutos después, Luis termina el diagnóstico.*

```
Tool: delivery.checkout
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "actor": { "type": "provider", "id": "pro_luis_herrera" },
  "location": { "lat": -33.4569, "lng": -70.5983 },
  "timestamp": "2026-02-25T09:58:00-03:00"
}
```

```json
← {
  "state": "delivered",
  "duration_actual_minutes": 55
}
```

### 5.4 Foto del resultado (después) + checklist

```
Tool: delivery.record_evidence
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "evidence_type": "photo",
  "data": {
    "type": "photo_after",
    "url": "https://storage.example.com/ses_20260225/after_tablero.jpg",
    "description": "Tablero con automático reemplazado y circuito cocina identificado",
    "gps": { "lat": -33.4569, "lng": -70.5983 },
    "timestamp": "2026-02-25T09:57:00-03:00"
  },
  "actor": { "type": "provider", "id": "pro_luis_herrera" }
}
```

```json
← {
  "evidence_id": "evi_20260225_photo_after"
}
```

```
Tool: delivery.record_evidence
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "evidence_type": "document",
  "data": {
    "type": "checklist",
    "items": [
      { "task": "Inspección visual del tablero", "completed": true },
      { "task": "Medición de voltaje por circuito", "completed": true },
      { "task": "Identificación de circuito con falla", "completed": true },
      { "task": "Prueba de automáticos", "completed": true },
      { "task": "Reemplazo de automático dañado", "completed": true },
      { "task": "Prueba de funcionamiento post-reparación", "completed": true }
    ],
    "all_completed": true
  },
  "actor": { "type": "provider", "id": "pro_luis_herrera" }
}
```

```json
← {
  "evidence_id": "evi_20260225_checklist"
}
```

### 5.5 Firma del cliente

```
Tool: delivery.record_evidence
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "evidence_type": "signature",
  "data": {
    "signer": "Roberto Soto",
    "signer_id": "cli_roberto_soto",
    "role": "client",
    "url": "https://storage.example.com/ses_20260225/firma_cliente.png",
    "timestamp": "2026-02-25T10:00:00-03:00"
  },
  "actor": { "type": "provider", "id": "pro_luis_herrera" }
}
```

```json
← {
  "evidence_id": "evi_20260225_firma"
}
```

---

## Fase 6 — Cerrar

### 6.1 Documentación

```
Tool: documentation.create
```

```json
{
  "session_id": "ses_20260225_0900_lherrera",
  "content": "Diagnóstico eléctrico — Domicilio Ñuñoa. Problema: automático termomagnético de cocina (circuito 3) se dispara al conectar horno + hervidor simultáneamente. Causa: automático de 10A subdimensionado para carga de cocina. Solución aplicada: reemplazo por automático de 16A (norma SEC). Circuito probado con carga completa, funciona correctamente. Recomendación: revisión general de cableado dentro de 6 meses (cableado original de 2005).",
  "actor": { "type": "provider", "id": "pro_luis_herrera" }
}
```

```json
← {
  "state": "documented",
  "documentation_id": "doc_20260225_lherrera"
}
```

### 6.2 Cargo

```
Tool: payments.create_sale
```

```json
{
  "client_id": "cli_roberto_soto",
  "service_id": "srv_diag_electrico",
  "provider_id": "pro_luis_herrera",
  "quantity": 1,
  "unit_price": 25000
}
```

```json
← {
  "sale_id": "sale_20260225_roberto",
  "amount": 25000,
  "currency": "CLP",
  "status": "charged"
}
```

### 6.3 Pago

```
Tool: payments.record_payment
```

```json
{
  "venta_id": "sale_20260225_roberto",
  "amount": 25000,
  "method": "efectivo"
}
```

```json
← {
  "payment_id": "pay_20260225_roberto",
  "status": "paid"
}
```

---

## Resultado final

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Cobrado → Verificado
                                                                                         ↑
                                                                                auto (72h)
```

| Dimensión | Valor |
|-----------|-------|
| **Qué** | Diagnóstico eléctrico (60 min) |
| **Quién entrega** | Luis Herrera — Electricista SEC Clase A |
| **Quién recibe** | Roberto Soto |
| **Cuándo** | 2026-02-25, 09:03–09:58 (55 min reales) |
| **Dónde** | Domicilio del cliente, Ñuñoa |
| **Ciclo** | Verificado |
| **Evidencia** | Foto antes + foto después + checklist + firma cliente |
| **Cobro** | $25.000 CLP · pagado · efectivo |

---

## Qué cambia entre verticales

| | Salud (kinesiología) | Hogar (electricidad) |
|---|---|---|
| **Ubicación** | Clínica (in_person) | Domicilio (home_visit) |
| **Evidencia** | GPS + ficha clínica firmada | Fotos antes/después + checklist + firma |
| **Documentación** | Nota clínica con diagnóstico y plan | Reporte técnico con causa y solución |
| **Disputa (ventana)** | 48 horas | 72 horas |
| **Pago típico** | Transferencia / prepago | Efectivo |
| **Regla de resolución** | Ficha firmada → entregado | Fotos + checklist completo → entregado |

> La estructura del protocolo es idéntica. Las 8 dimensiones, los 9 estados y las 6 fases del agente son las mismas. Lo que cambia es el contenido de la evidencia y las reglas del contrato — exactamente lo que `contract.get` define por vertical.
