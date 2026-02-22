# Servicialo

Protocolo abierto para que agentes AI coordinen servicios profesionales.

Si estás construyendo un agente que necesita agendar, verificar entrega o cobrar un servicio — sin integrarte con cada plataforma por separado — este es el protocolo.

| | Versión |
|---|---|
| **Protocol** | 0.3 |
| **@servicialo/mcp-server** | 0.5.0 |

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

Sitio público que documenta el estándar: definición de servicio, las 8 dimensiones, los 8 estados del ciclo de vida, resolución de disputas, evidencia por vertical, principios de diseño y el esquema del protocolo.

### @servicialo/mcp-server

Servidor MCP que permite a agentes de IA interactuar con organizaciones de servicios profesionales. Dos modos de operación:

- **Modo descubrimiento** — sin credenciales, 4 herramientas públicas para buscar organizaciones y consultar disponibilidad
- **Modo autenticado** — con credenciales, 23 herramientas para el ciclo de vida completo del servicio

```bash
npx -y @servicialo/mcp-server
```

Ver documentación completa en [`packages/mcp-server/README.md`](packages/mcp-server/README.md).

## Arquitectura modular

Servicialo está diseñado como un estándar por capas. Un implementador adopta lo que necesita según la complejidad de su operación.

```
Servicialo Core                    ← estable (v0.3)
├── Ciclo de vida (8 estados)
├── 8 dimensiones del servicio
├── Flujos de excepción
├── Prueba de entrega
├── Cobro (cargo vs pago separados)
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
| **Core** | Cualquier plataforma que coordine servicios | Estable (v0.3) |
| **/Finanzas** | Plataformas que intermedian pagos o cobran comisiones | En diseño |
| **/Disputas** | Plataformas con volumen o montos que justifican arbitraje formal | En diseño |

## El estándar

La especificación completa vive en [`PROTOCOL.md`](./PROTOCOL.md) e incluye:
- Las 8 dimensiones de un servicio profesional
- Los 8 estados universales del ciclo de vida
- 6 flujos de excepción (inasistencias, cancelaciones, disputas, reagendamiento, entrega parcial)
- 7 principios de diseño
- Schema canónico en YAML
- Telemetry Extension (planificada) para benchmarks de industria
- Referencia del MCP server

### Resumen rápido

Un servicio profesional tiene 8 dimensiones:
1. **Identidad** — qué servicio es y a qué vertical pertenece
2. **Proveedor** — quién lo entrega, con qué credenciales
3. **Cliente** — quién recibe el servicio, con pagador separado explícitamente
4. **Agendamiento** — cuándo y cuánto dura
5. **Ubicación** — dónde se entrega (presencial, virtual, domicilio)
6. **Ciclo de vida** — posición actual en los 8 estados
7. **Evidencia** — checkin, checkout, GPS, firmas, fotos
8. **Cobro** — liquidación financiera con estado independiente del ciclo

### El ciclo de vida

```
Solicitado → Agendado → Confirmado → En Curso → Entregado → Documentado → Cobrado → Verificado
```

**Verificado es el cierre del ciclo** — el cliente no puede verificar hasta tener el cuadro completo: la evidencia documentada y el cobro aplicado. Verificación prematura (antes de documentar y cobrar) obliga al cliente a confirmar algo que aún no tiene registro formal.

**No hay estado "Pagado" en el ciclo** — el pago se trackea en `billing.status`, independiente del ciclo. En LATAM el modelo dominante es prepago: el cliente paga antes, el cobro consume crédito del paquete. Para modelos post-pago, `billing.status` transiciona de `cobrado → facturado → pagado` después de que el ciclo cierra.

## Resolución de disputas

> **Nota:** La resolución de disputas está documentada como spec en Servicialo/Disputas (en diseño). En Core, la disputa queda a criterio de la implementación — el flujo de excepción define la transición (Entregado → Disputado), pero el mecanismo de resolución es libre.

El módulo Servicialo/Disputas define un mecanismo híbrido que no depende de un árbitro centralizado:

1. **Flujo de excepción** (Core) — Entregado → Disputado. Cobro congelado, evidencia solicitada de ambas partes.
2. **Resolución algorítmica (~80%)** (Disputas) — el sistema compara evidencia registrada contra la evidencia requerida. Si la evidencia es concluyente, se resuelve automáticamente.
3. **Arbitraje por pares (~20%)** (Disputas) — cuando la evidencia es ambigua, un panel de 1-3 profesionales del mismo vertical con alta reputación revisa y vota. Mayoría simple en 48 horas.

## Límites del estándar v0.3

### Lo que cubre Core hoy

- **Modelo de partes** — separación explícita entre cliente y pagador
- **Ciclo de vida** — 8 estados universales con 6 flujos de excepción definidos
- **Evidencia por vertical** — tipos de evidencia requerida para salud, hogar, legal y educación
- **Cobro** — cargo vs pago como eventos independientes, soporte para paquetes prepago
- **Agentes AI** — protocolo MCP con 23 herramientas para interacción programática
- **Regla de payroll** — solo sesiones en estado Cobrado cuentan para compensación

### Lo que queda para módulos futuros

- **Distribución de pagos** — cómo se reparte el ingreso entre profesional, organización e infraestructura → Servicialo/Finanzas
- **Resolución formal de disputas** — arbitraje algorítmico + por pares con evidencia por vertical → Servicialo/Disputas. En Core, la resolución de disputas queda a criterio de cada implementación

### Lo que NO cubre (aún)

- **Servicios recurrentes** — el esquema modela un servicio unitario. Paquetes, suscripciones y contratos de servicio continuo no están definidos
- **Múltiples proveedores por servicio** — un servicio tiene exactamente un proveedor. Equipos o servicios compuestos requieren coordinación externa
- **Pagos parciales o escalonados** — el cobro asume un monto único. Planes de pago o milestone-based billing no están modelados
- **Internacionalización regulatoria** — las reglas tributarias y regulatorias son específicas por país. El estándar no define cumplimiento regulatorio
- **Marketplace / matching algorithm** — el estándar define el protocolo de entrega, no cómo descubrir o emparejar proveedores con clientes
- **Reputación cross-platform** — el puntaje de confianza es por implementación. No hay mecanismo para portabilidad de reputación entre plataformas

## Implementaciones

Cualquier plataforma puede implementar la especificación Servicialo. Para ser listada, debe:

1. Modelar servicios usando las 8 dimensiones
2. Implementar los 8 estados del ciclo de vida
3. Manejar al menos 3 flujos de excepción
4. Exponer una API conectable al MCP server

### Implementación de referencia

| Plataforma | Vertical | Cobertura | Estado | URL |
|------------|----------|-----------|--------|-----|
| **Coordinalo** | Salud (kinesiología) | 8/8 dimensiones · 8/8 estados · 6/6 excepciones · 7/7 principios | ✅ Live | [coordinalo.com](https://coordinalo.com) |

> Querés listar tu implementación? [Abrí un issue](https://github.com/servicialo/mcp-server/issues).

## Licencia

MIT
