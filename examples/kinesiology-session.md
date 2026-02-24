# Ejemplo: Sesión de kinesiología

Un agente AI coordina una sesión de kinesiología de principio a fin — desde buscar una clínica hasta registrar el pago. Cada paso muestra la herramienta MCP usada, los parámetros enviados y la respuesta resumida.

> Este ejemplo usa datos ficticios contra la implementación de referencia [Coordinalo](https://coordinalo.com).

---

## Fase 1 — Descubrir

El usuario le dice al agente: *"Necesito una sesión de kinesiología en Santiago para la próxima semana."*

### 1.1 Buscar organizaciones

```
Tool: registry.search
```

```json
{
  "vertical": "kinesiologia",
  "location": "Santiago"
}
```

```json
← {
  "organizations": [
    {
      "slug": "kinesiologia-vital",
      "name": "Kinesiología Vital",
      "vertical": "kinesiologia",
      "location": "Providencia, Santiago",
      "services_count": 4,
      "professionals_count": 6
    },
    {
      "slug": "centro-rehab-las-condes",
      "name": "Centro de Rehabilitación Las Condes",
      "vertical": "kinesiologia",
      "location": "Las Condes, Santiago",
      "services_count": 7,
      "professionals_count": 12
    }
  ]
}
```

### 1.2 Listar servicios disponibles

```
Tool: services.list
```

```json
{
  "org_slug": "kinesiologia-vital"
}
```

```json
← {
  "services": [
    {
      "id": "srv_kine_eval",
      "name": "Evaluación kinesiológica",
      "duration_minutes": 60,
      "price": 45000,
      "currency": "CLP"
    },
    {
      "id": "srv_kine_rehab",
      "name": "Sesión de rehabilitación",
      "duration_minutes": 45,
      "price": 35000,
      "currency": "CLP"
    },
    {
      "id": "srv_kine_deportiva",
      "name": "Kinesiología deportiva",
      "duration_minutes": 45,
      "price": 40000,
      "currency": "CLP"
    }
  ]
}
```

El agente identifica que la "Sesión de rehabilitación" es lo que el usuario necesita.

### 1.3 Consultar disponibilidad

```
Tool: scheduling.check_availability
```

```json
{
  "org_slug": "kinesiologia-vital",
  "service_id": "srv_kine_rehab",
  "date_from": "2026-02-24",
  "date_to": "2026-02-28"
}
```

```json
← {
  "slots": [
    {
      "provider_id": "pro_andrea_munoz",
      "provider_name": "Andrea Muñoz",
      "credentials": ["Kinesióloga UCH", "Certificación deportiva"],
      "available": [
        { "date": "2026-02-24", "start": "10:00", "end": "10:45" },
        { "date": "2026-02-24", "start": "15:00", "end": "15:45" },
        { "date": "2026-02-26", "start": "09:00", "end": "09:45" }
      ]
    },
    {
      "provider_id": "pro_carlos_ruiz",
      "provider_name": "Carlos Ruiz",
      "credentials": ["Kinesiólogo UDP"],
      "available": [
        { "date": "2026-02-25", "start": "11:00", "end": "11:45" },
        { "date": "2026-02-27", "start": "14:00", "end": "14:45" }
      ]
    }
  ]
}
```

El agente le presenta las opciones al usuario: *"Andrea Muñoz tiene hora el lunes a las 10:00 o a las 15:00, y el miércoles a las 9:00. Carlos Ruiz tiene el martes a las 11:00 y el jueves a las 14:00."*

El usuario elige: *"El lunes a las 10 con Andrea."*

---

## Fase 2 — Entender

Antes de comprometer, el agente lee las reglas del servicio.

### 2.1 Obtener las 8 dimensiones

```
Tool: service.get
```

```json
{
  "service_id": "srv_kine_rehab"
}
```

```json
← {
  "id": "srv_kine_rehab",
  "name": "Sesión de rehabilitación",
  "vertical": "kinesiologia",
  "duration_minutes": 45,
  "location_type": "presencial",
  "address": "Av. Providencia 1234, Of. 501",
  "price": { "value": 35000, "currency": "CLP" },
  "evidence_required": ["check_in", "check_out", "clinical_record", "treatment_plan"],
  "provider_credentials_required": ["kinesiologia"]
}
```

### 2.2 Leer el contrato

```
Tool: contract.get
```

```json
{
  "service_id": "srv_kine_rehab",
  "org_id": "org_kine_vital"
}
```

```json
← {
  "evidence_required": ["check_in", "check_out", "clinical_record"],
  "cancellation_policy": {
    "free_before_hours": 24,
    "penalty_2_to_24h": 0.5,
    "penalty_under_2h": 1.0
  },
  "no_show_policy": {
    "client": "charge_full",
    "provider": "reassign_and_penalize"
  },
  "dispute_window_hours": 48,
  "rescheduling_policy": {
    "free_before_hours": 12,
    "max_reschedules": 2
  }
}
```

El agente ahora sabe: cancelar con menos de 2 horas cobra el 100%, se necesita check-in/out y ficha clínica, y hay 48 horas para disputar.

---

## Fase 3 — Comprometer

### 3.1 Identificar al cliente

```
Tool: clients.get_or_create
```

```json
{
  "email": "maria.gonzalez@gmail.com",
  "name": "María",
  "last_name": "González",
  "actor": { "type": "agent", "id": "agent_claude" }
}
```

```json
← {
  "id": "cli_maria_gonzalez",
  "name": "María",
  "last_name": "González",
  "email": "maria.gonzalez@gmail.com",
  "is_new": false,
  "history": {
    "total_sessions": 8,
    "completed": 7,
    "cancelled": 1,
    "last_visit": "2026-02-10"
  }
}
```

Cliente existente con buen historial.

### 3.2 Agendar la sesión

```
Tool: scheduling.book
```

```json
{
  "service_id": "srv_kine_rehab",
  "provider_id": "pro_andrea_munoz",
  "client_id": "cli_maria_gonzalez",
  "starts_at": "2026-02-24T10:00:00-03:00",
  "actor": { "type": "agent", "id": "agent_claude" }
}
```

```json
← {
  "session_id": "ses_20260224_1000_amunoz",
  "state": "requested",
  "service": "Sesión de rehabilitación",
  "provider": "Andrea Muñoz",
  "client": "María González",
  "starts_at": "2026-02-24T10:00:00-03:00",
  "ends_at": "2026-02-24T10:45:00-03:00",
  "location": "Av. Providencia 1234, Of. 501"
}
```

Estado: **Solicitado**

### 3.3 Confirmar

```
Tool: scheduling.confirm
```

```json
{
  "session_id": "ses_20260224_1000_amunoz",
  "actor": { "type": "agent", "id": "agent_claude", "on_behalf_of": { "type": "client", "id": "cli_maria_gonzalez" } }
}
```

```json
← {
  "session_id": "ses_20260224_1000_amunoz",
  "state": "confirmed",
  "confirmed_by": ["client", "provider"]
}
```

Estado: **Confirmado**

El agente le confirma al usuario: *"Listo. Sesión de rehabilitación el lunes 24 a las 10:00 con Andrea Muñoz en Av. Providencia 1234, Of. 501. Política de cancelación: gratis hasta 24 horas antes."*

---

## Fase 4 — Gestionar el ciclo

*El lunes llega. La proveedora Andrea hace check-in desde la clínica.*

### 4.1 Verificar estado antes del servicio

```
Tool: lifecycle.get_state
```

```json
{
  "session_id": "ses_20260224_1000_amunoz"
}
```

```json
← {
  "current_state": "confirmed",
  "available_transitions": ["in_progress", "cancelled"],
  "history": [
    { "from": null, "to": "requested", "at": "2026-02-21T14:30:00-03:00", "actor": "agent_claude" },
    { "from": "requested", "to": "scheduled", "at": "2026-02-21T14:30:01-03:00", "actor": "system" },
    { "from": "scheduled", "to": "confirmed", "at": "2026-02-21T14:31:00-03:00", "actor": "agent_claude + pro_andrea_munoz" }
  ]
}
```

---

## Fase 5 — Verificar entrega

### 5.1 Check-in

```
Tool: delivery.checkin
```

```json
{
  "session_id": "ses_20260224_1000_amunoz",
  "actor": { "type": "provider", "id": "pro_andrea_munoz" },
  "location": { "lat": -33.4265, "lng": -70.6155 },
  "timestamp": "2026-02-24T09:58:00-03:00"
}
```

```json
← {
  "session_id": "ses_20260224_1000_amunoz",
  "state": "in_progress",
  "checkin_at": "2026-02-24T09:58:00-03:00",
  "checkin_location": { "lat": -33.4265, "lng": -70.6155 }
}
```

Estado: **En Curso**

### 5.2 Check-out

*45 minutos después, la sesión termina.*

```
Tool: delivery.checkout
```

```json
{
  "session_id": "ses_20260224_1000_amunoz",
  "actor": { "type": "provider", "id": "pro_andrea_munoz" },
  "location": { "lat": -33.4265, "lng": -70.6155 },
  "timestamp": "2026-02-24T10:44:00-03:00"
}
```

```json
← {
  "session_id": "ses_20260224_1000_amunoz",
  "state": "delivered",
  "checkin_at": "2026-02-24T09:58:00-03:00",
  "checkout_at": "2026-02-24T10:44:00-03:00",
  "duration_actual_minutes": 46
}
```

Estado: **Completado** (Entregado)

### 5.3 Registrar evidencia clínica

```
Tool: delivery.record_evidence
```

```json
{
  "session_id": "ses_20260224_1000_amunoz",
  "evidence_type": "document",
  "data": {
    "type": "clinical_record",
    "diagnosis": "Tendinopatía rotuliana bilateral",
    "treatment": "Ejercicios excéntricos + electroterapia TENS",
    "progress": "Mejora en rango de movimiento. Dolor 4/10 (prev: 6/10)",
    "next_session_plan": "Continuar protocolo excéntrico, agregar propiocepción",
    "signed_by_provider": true,
    "signed_by_client": true
  },
  "actor": { "type": "provider", "id": "pro_andrea_munoz" }
}
```

```json
← {
  "evidence_id": "evi_20260224_clinical",
  "session_id": "ses_20260224_1000_amunoz",
  "type": "document",
  "recorded_at": "2026-02-24T10:48:00-03:00"
}
```

---

## Fase 6 — Cerrar

### 6.1 Crear documentación

```
Tool: documentation.create
```

```json
{
  "session_id": "ses_20260224_1000_amunoz",
  "content": "Sesión de rehabilitación #8 — Tendinopatía rotuliana bilateral. Protocolo excéntrico + TENS. Paciente reporta mejora: dolor 4/10 (anterior 6/10). Rango de movimiento mejorado en 15°. Plan: continuar protocolo, agregar propiocepción en próxima sesión.",
  "actor": { "type": "provider", "id": "pro_andrea_munoz" }
}
```

```json
← {
  "session_id": "ses_20260224_1000_amunoz",
  "state": "documented",
  "documentation_id": "doc_20260224_amunoz"
}
```

Estado: **Documentado**

### 6.2 Crear cargo

```
Tool: payments.create_sale
```

```json
{
  "client_id": "cli_maria_gonzalez",
  "service_id": "srv_kine_rehab",
  "provider_id": "pro_andrea_munoz",
  "quantity": 1,
  "unit_price": 35000
}
```

```json
← {
  "sale_id": "sale_20260224_maria",
  "amount": 35000,
  "currency": "CLP",
  "status": "charged",
  "session_id": "ses_20260224_1000_amunoz"
}
```

Estado: **Cobrado**

### 6.3 Registrar pago

```
Tool: payments.record_payment
```

```json
{
  "venta_id": "sale_20260224_maria",
  "amount": 35000,
  "method": "transferencia",
  "reference": "TRX-20260224-9871"
}
```

```json
← {
  "payment_id": "pay_20260224_maria",
  "sale_id": "sale_20260224_maria",
  "amount": 35000,
  "method": "transferencia",
  "status": "paid"
}
```

---

## Resultado final

El ciclo completo:

```
Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Cobrado → Verificado
                                                                                         ↑
                                                                               auto-verified (48h)
```

| Dimensión | Valor |
|-----------|-------|
| **Qué** | Sesión de rehabilitación (45 min) |
| **Quién entrega** | Andrea Muñoz — Kinesióloga UCH |
| **Quién recibe** | María González |
| **Cuándo** | 2026-02-24, 10:00–10:44 (46 min reales) |
| **Dónde** | Av. Providencia 1234, Of. 501, Providencia |
| **Ciclo** | Verificado |
| **Evidencia** | GPS check-in/out + ficha clínica firmada |
| **Cobro** | $35.000 CLP · pagado · transferencia |

> El mismo flujo funciona para cualquier vertical — lo que cambia es la evidencia requerida y el contenido de la documentación. La estructura del protocolo es la misma.
