FROM node:24-slim

# Install the published MCP server and the proxy for HTTP inspection
RUN npm install -g @servicialo/mcp-server@latest mcp-proxy@latest

# Env vars passed through at runtime
ENV SERVICIALO_API_KEY="" \
    SERVICIALO_ORG_ID="" \
    SERVICIALO_BASE_URL="https://servicialo.com" \
    SERVICIALO_ADAPTER="coordinalo" \
    SERVICIALO_TELEMETRY="true" \
    SERVICIALO_COUNTRY="cl"

EXPOSE 8080

# mcp-proxy wraps the stdio server into HTTP for inspection
ENTRYPOINT ["mcp-proxy", "--port", "8080", "--", "servicialo-mcp"]
