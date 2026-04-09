const UPSTREAM = 'https://coordinalo.com/api/mcp'

// Headers to forward from the client to the upstream MCP server
const FORWARD_HEADERS = [
  'content-type',
  'authorization',
  'x-org-api-key',
  'x-bootstrap-key',
  'x-admin-token',
  'x-digitalo-internal',
  'x-source',
  'x-forwarded-for',
  'x-real-ip',
  'user-agent',
  'accept',
  'mcp-session-id',
]

function buildUpstreamHeaders(incoming: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of FORWARD_HEADERS) {
    const val = incoming.get(key)
    if (val) out[key] = val
  }
  return out
}

function mergeHeaders(upstream: Headers, cors: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  upstream.forEach((v, k) => { out[k] = v })
  Object.assign(out, cors)
  return out
}

const CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': FORWARD_HEADERS.join(', '),
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: Request) {
  const res = await fetch(UPSTREAM, {
    method: 'GET',
    headers: buildUpstreamHeaders(request.headers),
  })
  return new Response(res.body, {
    status: res.status,
    headers: { ...mergeHeaders(res.headers, CORS_HEADERS as Record<string, string>) },
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const res = await fetch(UPSTREAM, {
    method: 'POST',
    headers: buildUpstreamHeaders(request.headers),
    body,
  })
  return new Response(res.body, {
    status: res.status,
    headers: { ...mergeHeaders(res.headers, CORS_HEADERS as Record<string, string>) },
  })
}

export async function DELETE(request: Request) {
  const res = await fetch(UPSTREAM, {
    method: 'DELETE',
    headers: buildUpstreamHeaders(request.headers),
  })
  return new Response(res.body, {
    status: res.status,
    headers: { ...mergeHeaders(res.headers, CORS_HEADERS as Record<string, string>) },
  })
}
