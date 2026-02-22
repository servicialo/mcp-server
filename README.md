# Servicialo

Protocolo abierto para que agentes AI coordinen servicios profesionales.

Si estás construyendo un agente que necesita agendar, verificar entrega o cobrar un servicio — sin integrarte con cada plataforma por separado — este es el protocolo.

**Quickstart**

```bash
npx -y @servicialo/mcp-server
```

📋 **[Read the Protocol Specification →](./PROTOCOL.md)**

## Qué hay en este repositorio

```
servicialo/
├── app/                  # servicialo.com — sitio del estándar (Next.js)
├── components/           # Componentes del sitio
├── packages/
│   └── mcp-server/       # @servicialo/mcp-server — servidor MCP (npm)
```

### servicialo.com

Sitio público que documenta el estándar: definición de servicio, las 9 dimensiones, los 9 estados del ciclo de vida, resolución de disputas, evidencia por vertical, principios de diseño y el esquema del protocolo.

### @servicialo/mcp-server

Servidor MCP que permite a agentes de IA interactuar con organizaciones de servicios profesionales. Dos modos de operación:

- **Modo descubrimiento** — sin credenciales, 4 herramientas públicas para buscar organizaciones y consultar disponibilidad
- **Modo autenticado** — con credenciales, 16 herramientas en 6 fases del ciclo de vida del servicio

```bash
npx -y @servicialo/mcp-server
```

Ver documentación completa en [`packages/mcp-server/README.md`](packages/mcp-server/README.md).

## Arquitectura modular

Servicialo está diseñado como un estándar por capas. Un implementador adopta lo que necesita según la complejidad de su operación.

```
Servicialo Core                    ← estable
├── Ciclo de vida (9 estados)
├── 9 dimensiones del servicio
├── Flujos de excepción
├── Prueba de entrega
├── Contrato de servicio
└── Protocolo MCP para agentes AI

Servicialo/Finanzas                ← en diseño
├── Distribución de pagos (profesional, organización, infraestructura)
├── Tipos: porcentaje | monto_fijo | mixto
└── Momentos de liquidación: por_sesión | mensual | al_cierre

Servicialo/Disputas                ← en diseño
├── Resolución algorítmica (~80%)
├── Arbitraje por pares del mismo vertical
└── Evidencia válida por vertical
```

### Certificación por capas

Un implementador puede ser **Servicialo Core certified** sin adoptar los módulos opcionales. Core cubre todo lo necesario para modelar, agendar, ejecutar, documentar y cobrar un servicio profesional.

Los módulos son independientes entre sí y se agregan según necesidad:

| Módulo | Para quién | Estado |
|--------|-----------|--------|
| **Core** | Cualquier plataforma que coordine servicios | Estable |
| **/Finanzas** | Plataformas que intermedian pagos o cobran comisiones | En diseño |
| **/Disputas** | Plataformas con volumen o montos que justifican arbitraje formal | En diseño |

## El estándar

La especificación completa vive en [`PROTOCOL.md`](./PROTOCOL.md) e incluye:
- Las 9 dimensiones de un servicio profesional
- Los 9 estados universales del ciclo de vida
- 6 flujos de excepción (inasistencias, cancelaciones, disputas, reagendamiento, entrega parcial)
- 6 principios de diseño
- Schema canónico en YAML
- Telemetry Extension (planificada) para benchmarks de industria
- Referencia del MCP server

### Resumen rápido

Un servicio profesional tiene 9 dimensiones:
1. **Identidad** — qué servicio es y a qué vertical pertenece
2. **Proveedor** — quién lo entrega, con qué credenciales
3. **Beneficiario** — quién recibe el servicio directamente
4. **Solicitante** — quién inicia y gestiona (puede diferir del beneficiario)
5. **Pagador** — quién paga (puede diferir de ambos)
6. **Agendamiento** — cuándo y cuánto dura
7. **Ubicación** — dónde se entrega (presencial, virtual, domicilio)
8. **Evidencia** — checkin, checkout, GPS, firmas, fotos
9. **Documentación** — fichas, minutas, reportes, resultado documentado

## Resolución de disputas

> **Nota:** La resolución de disputas está documentada como spec en Servicialo/Disputas (en diseño). En Core, la disputa queda a criterio de la implementación — el contrato de servicio define las reglas, pero el mecanismo de resolución es libre.

El módulo Servicialo/Disputas define un mecanismo híbrido que no depende de un árbitro centralizado:

1. **Contrato de servicio** (Core) — antes de iniciar, ambas partes aceptan qué evidencia se requiere, qué pasa si alguien cancela, y cómo se resuelven disputas. Las reglas son inmutables una vez aceptadas.
2. **Resolución algorítmica (~80%)** (Disputas) — el sistema compara evidencia registrada contra la evidencia requerida por el contrato. Si la evidencia es concluyente, se resuelve automáticamente.
3. **Arbitraje por pares (~20%)** (Disputas) — cuando la evidencia es ambigua, un panel de 1-3 profesionales del mismo vertical con alta reputación revisa y vota. Mayoría simple en 48 horas.

## Límites del estándar v0.x

### Lo que cubre Core hoy

- **Modelo de partes** — separación entre beneficiario, solicitante y pagador para cubrir los casos más comunes (salud con aseguradora, corporativo, familiar)
- **Ciclo de vida** — 9 estados universales con 6 flujos de excepción definidos
- **Evidencia por vertical** — tipos de evidencia requerida para salud, hogar, legal y educación
- **Contrato de servicio** — reglas pre-acordadas inmutables una vez iniciado el ciclo
- **Facturación simple** — monto, pagador, estado, documento tributario
- **Agentes AI** — protocolo MCP con 20 herramientas para interacción programática

### Lo que queda para módulos futuros

- **Distribución de pagos** — cómo se reparte el ingreso entre profesional, organización e infraestructura → Servicialo/Finanzas
- **Resolución formal de disputas** — arbitraje algorítmico + por pares con evidencia por vertical → Servicialo/Disputas. En Core, la resolución de disputas queda a criterio de cada implementación

### Lo que NO cubre (aún)

- **Servicios recurrentes** — el esquema modela un servicio unitario. Paquetes, suscripciones y contratos de servicio continuo no están definidos
- **Múltiples proveedores por servicio** — un servicio tiene exactamente un proveedor. Equipos o servicios compuestos requieren coordinación externa
- **Pagos parciales o escalonados** — la facturación asume un monto único. Planes de pago o milestone-based billing no están modelados
- **Internacionalización regulatoria** — las reglas tributarias y regulatorias son específicas por país. El estándar no define cumplimiento regulatorio
- **Marketplace / matching algorithm** — el estándar define el protocolo de entrega, no cómo descubrir o emparejar proveedores con clientes
- **Reputación cross-platform** — el puntaje de confianza es por implementación. No hay mecanismo para portabilidad de reputación entre plataformas
- **Escalamiento judicial** — el arbitraje por pares es el último recurso dentro del protocolo. Disputas que requieren acción legal están fuera del alcance
- **Servicios puramente asíncronos** — servicios sin ventana temporal definida (ej: revisión de documentos) no encajan perfectamente en el modelo presencial/virtual

## Implementaciones

Cualquier plataforma puede implementar la especificación Servicialo. Para ser listada, debe:

1. Modelar servicios usando las 9 dimensiones
2. Implementar los 9 estados del ciclo de vida
3. Manejar al menos 3 flujos de excepción
4. Exponer una API conectable al MCP server

### Implementación de referencia

| Plataforma | Vertical | Cobertura | Estado | URL |
|------------|----------|-----------|--------|-----|
| **Coordinalo** | Servicios profesionales | 9/9 dimensiones · 9/9 estados · 6/6 excepciones · 6/6 principios | ✅ Live | [coordinalo.com](https://coordinalo.com) |

Validado actualmente con clínicas de salud en Chile. La plataforma soporta cualquier servicio profesional recurrente.

Coordinalo implementó compatibilidad Servicialo en 6 fases:

| Fase | Qué implementa | Dimensiones cubiertas |
|------|----------------|----------------------|
| 1 — Ciclo de vida | Timestamps como milestones (`startedAt`, `documentedAt`, `invoicedAt`, `paidAt`) | Agendamiento, Ciclo de vida |
| 2 — Flujos de excepción | Transiciones de estado, StatusHistory, cancelaciones, no-shows, reagendamiento | Ciclo de vida (excepciones) |
| 3 — Prueba de entrega | DeliveryProof bilateral (proveedor + cliente confirman) | Prueba de entrega |
| 4 — Pagador ≠ Receptor | PaymentResponsible (self, family, institution) + PaymentAssignment | Cliente (quién paga) |
| 5 — Catálogo descubrible | Servicio enriquecido: requisitos, resultado esperado, contraindicaciones, etiquetas, isDiscoverable | Identidad |
| 6 — Compatibilidad MCP | Exposición vía @servicialo/mcp-server (4 tools discovery + 16 autenticadas) | Todas (via MCP) |

> Querés listar tu implementación? [Abrí un issue](https://github.com/servicialo/mcp-server/issues).

## Licencia

MIT
