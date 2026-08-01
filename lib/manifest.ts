import { parse } from "yaml";
import manifestRaw from "@/protocol/manifest.yaml";

/**
 * Typed loader for protocol/manifest.yaml — the single source of truth for
 * the protocol surface (version, tools, profiles, bindings, extensions,
 * state machines). Counts are never stored in the manifest: derive them here.
 *
 * The YAML is bundled at build time via the webpack asset/source rule in
 * next.config.mjs, so every consumer (all SSG/ISR server components) reads
 * the same parsed object with zero runtime file I/O.
 */

export type ToolTier = "public" | "authenticated";
export type ProfileStatus = "stable" | "candidate" | "experimental";
export type Maturity = "draft" | "experimental" | "candidate" | "stable" | "deprecated";

export interface ManifestTool {
  name: string;
  tier: ToolTier;
  phase: string;
  profile: string;
}

export interface ManifestProfile {
  id: string;
  name: string;
  status: ProfileStatus;
}

export interface ManifestExtension {
  id: string;
  name: string;
  maturity: Maturity;
  doc: string | null;
  note?: string;
}

export interface ManifestObject {
  id: string;
  name: string;
  schema: string;
  status?: string;
  defined_in?: string;
  surfaced_by?: string[];
  vertical_schemas?: string[];
  /** Conceptual object this wire object represents (e.g. service → service_delivery). */
  represents?: string;
  /** Wire object that carries this conceptual object (e.g. service_delivery → service). */
  wire_object?: string;
  note?: string;
}

export type BindingMaturity = "stable" | "candidate" | "experimental";

export interface CertaintyLevel {
  id: string;
  key: string;
  name: string;
}

export interface ProofOfServiceModel {
  doc: string;
  certainty_levels: CertaintyLevel[];
  dossier_states: string[];
  settlement_states: string[];
}

export interface ManifestImplementation {
  id: string;
  name: string;
  role: string;
  vertical: string;
  status: string;
  url: string;
  since?: string;
  conformance: string;
}

export interface ServiceLifecycle {
  schema: string;
  states: string[];
  happy_path: string[];
  required: string[];
  optional_financial: string[];
  exception: string[];
  reference_implementation_divergence: {
    tool: string;
    file: string;
    enum: string[];
    note: string;
  };
}

export interface Manifest {
  manifest_version: number;
  protocol: {
    name: string;
    version: string;
    status: "draft" | "stable";
    spec: string;
    quick_ref: string;
    canonical_url: string;
    spec_host: string;
    repository: string;
    license: string;
  };
  objects: ManifestObject[];
  profiles: ManifestProfile[];
  bindings: {
    mcp: {
      maturity: BindingMaturity;
      package: string;
      package_version: string;
      transports: string[];
      remote: string;
    };
    http: {
      maturity: BindingMaturity;
      profile: string;
      profile_version: string;
      resolver_api_version: string;
      openapi: string;
    };
    a2a: {
      maturity: BindingMaturity;
      version: string;
      agent_card: string;
      endpoint: string;
    };
  };
  tools: ManifestTool[];
  specified_unimplemented_tools: { name: string; profile: string }[];
  state_machines: {
    service_lifecycle: ServiceLifecycle;
    billing_status: { schema: string; states: string[] };
    service_order: { schema: string; states: string[] };
    dimensions: { extension: string; doc: string; note: string };
  };
  proof_of_service: ProofOfServiceModel;
  extensions: ManifestExtension[];
  implementations: ManifestImplementation[];
}

export const MANIFEST: Manifest = parse(manifestRaw) as Manifest;

export const PROTOCOL_VERSION = MANIFEST.protocol.version;
export const PACKAGE_VERSION = MANIFEST.bindings.mcp.package_version;

export const TOOL_COUNTS = {
  total: MANIFEST.tools.length,
  public: MANIFEST.tools.filter((t) => t.tier === "public").length,
  authenticated: MANIFEST.tools.filter((t) => t.tier === "authenticated").length,
} as const;

export const LIFECYCLE = MANIFEST.state_machines.service_lifecycle;
export const EXTENSIONS = MANIFEST.extensions;
export const PROFILES = MANIFEST.profiles;
export const IMPLEMENTATIONS = MANIFEST.implementations;
export const PROOF_OF_SERVICE = MANIFEST.proof_of_service;
export const BINDINGS = MANIFEST.bindings;

export function toolsByTier(tier: ToolTier): ManifestTool[] {
  return MANIFEST.tools.filter((t) => t.tier === tier);
}

export function toolsByPhase(): Map<string, ManifestTool[]> {
  const map = new Map<string, ManifestTool[]>();
  for (const tool of MANIFEST.tools) {
    const list = map.get(tool.phase) ?? [];
    list.push(tool);
    map.set(tool.phase, list);
  }
  return map;
}
