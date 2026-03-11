# Servicialo — Auditoría de Implementación

## Auditoría v0.3 → v0.6.0

### Convergencias (el spec adoptó nuestras decisiones)

| Cambio en v0.6 | Estado en Coordinalo | Veredicto |
|---|---|---|
| "Entregado" renombrado a "Completado" | Usamos `completed` internamente | ✅ El spec nos copió |
| "Facturado" es estado canónico #7 | Ya lo teníamos como estado intermedio | ✅ El spec nos copió |
| 9 estados (no 8) | Ya implementábamos 9 | ✅ El spec nos copió |
| Cobro ≠ Pago separados explícitamente | Cobro y Pago como entidades separadas | ✅ Alineados |

### Mapping de ciclo de vida

Spec v0.6.0: `Solicitado → Agendado → Confirmado → En Curso → Completado → Documentado → Facturado → Cobrado → Verificado`

Coordinalo:  `requested → scheduled → confirmed → in_progress → completed → documented → invoiced → paid → verified`

**Mapping 1:1 perfecto.**

### Gaps a cerrar (todos opcionales o aditivos)

| # | Concepto | Tenemos | Esfuerzo |
|---|---|---|---|
| 1 | Recurso Físico (entidad primera clase con capacidad, buffer, calendario) | Solo `location` como texto | Alto |
| 2 | Orden de Servicio (lifecycle borrador→activa + libro mayor computado) | `Venta` parcial, sin lifecycle formal | Medio |
| 3 | Contrato de Servicio (evidencia_requerida, plazo_disputa, política_cancelación) | Políticas dispersas | Medio |
| 4 | Evidencia por vertical (Salud: GPS+ficha, Hogar: fotos, Legal: minutas) | `DeliveryProof` genérico | Bajo |
| 5 | Trazabilidad de agentes IA (`by` + `method` en cada transición) | No formal | Bajo |
| 6 | Exception states (`reasignando`, `reagendando` como estados transitorios) | `no_show`, `provider_no_show` | Bajo |
| 7 | MCP tools: 8 → 20 (12 tools nuevas) | 8 implementadas | Medio |
| 8 | Gobernanza/Portabilidad (exportación, soberanía de nodos) | No implementado | Futuro |

### Compliance con requisitos mínimos (Sección 19.1)

1. ✅ Modelar servicios con 8 dimensiones
2. ✅ Implementar 9 estados del ciclo de vida
3. ✅ Manejar al menos 3 flujos de excepción (tenemos 6)
4. ⚠️ Exponer API que el MCP pueda conectar (8/20 tools)
5. ⚠️ Modelar Órdenes de Servicio (parcial — `Venta`)
6. ❌ Contribuir inteligencia de red (no aún)

**Somos implementación de referencia para los 4 requisitos obligatorios. Todos los gaps son opcionales.**

### Priorización recomendada

1. **Recurso Físico** — bloqueante para orgs con salas/boxes
2. **Orden de Servicio** — evolucionar `Venta` con lifecycle + ledger computado
3. **MCP tools** — completar de 8 a 20
