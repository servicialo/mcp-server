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

Sitio público que documenta el estándar: definición de servicio, las 8 dimensiones, los 9 estados del ciclo de vida, principios de diseño y el esquema del protocolo.

### @servicialo/mcp-server

Servidor MCP que permite a agentes de IA interactuar con organizaciones de servicios profesionales. Dos modos de operación:

- **Modo descubrimiento** — sin credenciales, 4 herramientas públicas para buscar organizaciones y consultar disponibilidad
- **Modo autenticado** — con credenciales, 23 herramientas para agendar, gestionar clientes, pagos, proveedores y nóminas

```bash
npx -y @servicialo/mcp-server
```

Ver documentación completa en [`packages/mcp-server/README.md`](packages/mcp-server/README.md).

## El estándar

Un servicio profesional tiene 8 dimensiones:

1. **Identidad** — qué servicio es y a qué vertical pertenece
2. **Proveedor** — quién lo entrega, con qué credenciales
3. **Cliente** — quién lo recibe, quién paga
4. **Agendamiento** — cuándo, dónde, cuánto dura
5. **Ciclo de vida** — 9 estados universales desde solicitud hasta cierre
6. **Prueba de entrega** — checkin, checkout, evidencia
7. **Documentación** — fichas, minutas, reportes
8. **Facturación** — monto, pagador, estado de pago

## Implementaciones

Cualquier plataforma puede implementar la especificación Servicialo. La primera implementación de referencia es [Coordinalo](https://coordinalo.com).

## Licencia

MIT
