# Directorios MCP

Estado de registro y visibilidad en directorios de MCP servers.

## Servicialo (`@servicialo/mcp-server`)

| Directorio | URL | Estado | Acción |
|------------|-----|--------|--------|
| Glama | https://glama.ai/mcp/servers/servicialo/mcp-server | Indexado, **SIN RECLAMAR** | Ir a reclamar manualmente (login con GitHub del repo) |
| Smithery | https://smithery.ai/servers/servicialo/mcp-server | "No capabilities found" | Fix aplicado en `smithery.yaml` — build + stdio local |
| mcp.so | — | No registrado | Registrar manualmente en https://mcp.so/submit |

## Coordinalo (`@coordinalo/mcp-server`)

| Directorio | URL | Estado | Acción |
|------------|-----|--------|--------|
| Glama | — | No registrado | Registrar después de publicar `packages/coordinalo-mcp` |
| Smithery | — | No registrado | Publicar via "Bring your own hosting" con URL `https://coordinalo.com/api/mcp` |
| mcp.so | — | No registrado | Registrar manualmente en https://mcp.so/submit |

## Notas

- **Glama claim**: requiere login con la cuenta de GitHub que es owner del repo `servicialo/mcp-server`
- **Smithery publish**: para Coordinalo usar el flujo de external URL en https://smithery.ai/new
- **mcp.so**: registro manual, llenar formulario con npm package name y descripción
- **Endpoint HTTP**: ambos servers exponen Streamable HTTP transport:
  - Servicialo: `https://servicialo.com/api/mcp` (protocolo, 20 tools)
  - Coordinalo: `https://coordinalo.com/api/mcp` (implementación, 41 tools)
