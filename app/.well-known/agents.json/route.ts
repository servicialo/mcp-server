// Canonical .well-known/agents.json alias for the apex. Crawlers and
// discovery agents look here by convention; the implementation lives under
// /api/registry/.well-known/agents.json and is re-exported to keep a single
// source of truth.
export { GET, OPTIONS } from '@/app/api/registry/.well-known/agents.json/route';
