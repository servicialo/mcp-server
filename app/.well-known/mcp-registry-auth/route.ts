export function GET() {
  const value = process.env.MCP_REGISTRY_AUTH_VALUE;
  if (!value) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(value, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store",
    },
  });
}
