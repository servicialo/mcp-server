# Servicialo

Estándar abierto para la entrega de servicios profesionales.

Define cómo se estructura, agenda, ejecuta, documenta y cobra un servicio — independiente de la plataforma que lo implemente.

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
- **Modo autenticado** — con credenciales, 23 herramientas para agendar, gestionar clientes, pagos, proveedores y nóminas

```bash
npx -y @servicialo/mcp-server
```

Ver documentación completa en [`packages/mcp-server/README.md`](packages/mcp-server/README.md).

## Arquitectura modular

Servicialo está diseñado como un estándar por capas. Un implementador adopta lo que necesita según la complejidad de su operación.

```
Servicialo Core                    ← estable
├── Ciclo de vida (9 estados)
├── 8 dimensiones del servicio
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

## El estándar (Core)

Un servicio profesional tiene 9 dimensiones:

1. **Identidad** — qué servicio es y a qué vertical pertenece
2. **Proveedor** — quién lo entrega, con qué credenciales
3. **Partes** — quién recibe (beneficiario), quién solicita (solicitante), quién paga (pagador)
4. **Contrato de servicio** — reglas acordadas antes del compromiso: evidencia requerida, políticas, arbitraje
5. **Agendamiento** — cuándo, dónde, cuánto dura
6. **Ciclo de vida** — 9 estados universales desde solicitud hasta cierre
7. **Prueba de entrega** — checkin, checkout, evidencia por vertical
8. **Documentación y facturación** — fichas, minutas, cobro, documento tributario

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
- **Agentes AI** — protocolo MCP con 23 herramientas para interacción programática

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

Cualquier plataforma puede implementar la especificación Servicialo.

## Licencia

MIT
