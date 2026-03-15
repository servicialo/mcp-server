#!/usr/bin/env npx tsx
/**
 * Servicialo Distribution CLI
 *
 * Usage:
 *   npx tsx distribution/publish.ts status
 *   npx tsx distribution/publish.ts check <registry-id>
 *   npx tsx distribution/publish.ts check-all
 *   npx tsx distribution/publish.ts generate-entry <registry-id>
 *   npx tsx distribution/publish.ts update-entry <registry-id>
 *   npx tsx distribution/publish.ts update-entry --all
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRIES_PATH = resolve(__dirname, "registries.yaml");
const MCP_PACKAGE_JSON = resolve(
  __dirname,
  "../packages/mcp-server/package.json",
);
const PROTOCOL_MD = resolve(__dirname, "../PROTOCOL.md");

// ---------------------------------------------------------------------------
// Types and YAML helpers
// ---------------------------------------------------------------------------

interface Registry {
  id: string;
  name: string;
  url: string;
  type: string;
  status: string;
  pr_url: string;
  submit_url?: string;
  last_checked: string;
  entry_format: string;
  section: string;
  submitted_version: string;
  last_entry: string;
  notes: string;
}

function parseRegistries(yamlContent: string): Registry[] {
  const doc = YAML.parse(yamlContent);
  return (doc?.registries || []) as Registry[];
}

function saveRegistries(registries: Registry[]): void {
  const doc = { registries };
  writeFileSync(REGISTRIES_PATH, YAML.stringify(doc, { lineWidth: 120 }));
}

// ---------------------------------------------------------------------------
// Protocol metadata
// ---------------------------------------------------------------------------

function getPackageVersion(): string {
  const pkg = JSON.parse(readFileSync(MCP_PACKAGE_JSON, "utf-8"));
  return pkg.version;
}

function getPackageDescription(): string {
  const pkg = JSON.parse(readFileSync(MCP_PACKAGE_JSON, "utf-8"));
  return pkg.description;
}

function getProtocolVersion(): string {
  const md = readFileSync(PROTOCOL_MD, "utf-8");
  const match = md.match(/version:\s*([\d.]+)/i) || md.match(/v([\d.]+)/);
  return match ? match[1] : "unknown";
}

// ---------------------------------------------------------------------------
// GitHub PR status check
// ---------------------------------------------------------------------------

function checkGitHubPR(prUrl: string): { state: string; merged: boolean } {
  const match = prUrl.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
  );
  if (!match) return { state: "unknown", merged: false };
  const [, owner, repo, num] = match;
  try {
    const result = execSync(
      `gh pr view ${num} -R ${owner}/${repo} --json state,mergedAt`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const data = JSON.parse(result);
    return {
      state: data.state?.toLowerCase() || "unknown",
      merged: !!data.mergedAt,
    };
  } catch {
    return { state: "error", merged: false };
  }
}

function checkWebRegistry(url: string): boolean {
  try {
    const result = execSync(
      `curl -sL "${url}" | grep -i servicialo | head -1`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Entry generators
// ---------------------------------------------------------------------------

function generateEntry(registry: Registry): string {
  const version = getPackageVersion();
  const desc = getPackageDescription();
  const protoVersion = getProtocolVersion();

  switch (registry.entry_format) {
    case "markdown_list":
      if (registry.id === "punkpeye-awesome-mcp") {
        return `- [servicialo/mcp-server](https://github.com/servicialo/mcp-server) 📇 ☁️ 🍎 🪟 🐧 - ${desc}. Protocol v${protoVersion}, npm v${version}.`;
      }
      return `- [Servicialo](https://github.com/servicialo/mcp-server) - ${desc}. Protocol v${protoVersion}, npm v${version}.`;

    case "json_seed":
      return JSON.stringify(
        {
          name: "com.servicialo/mcp-server",
          description: desc,
          repository: {
            url: "https://github.com/servicialo/mcp-server",
          },
          version_detail: {
            version,
            release_date: new Date().toISOString().split("T")[0],
          },
          packages: [
            {
              registry_name: "npm",
              name: "@servicialo/mcp-server",
              version,
            },
            {
              registry_name: "pypi",
              name: "servicialo",
              version,
            },
          ],
        },
        null,
        2,
      );

    case "web_form":
      return [
        `Server Name: Servicialo`,
        `Description: ${desc}`,
        `URL: https://github.com/servicialo/mcp-server`,
        `Version: ${version}`,
        `Protocol: v${protoVersion}`,
      ].join("\n");

    default:
      return `Servicialo MCP Server v${version} — ${desc}`;
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdStatus(registries: Registry[]) {
  const version = getPackageVersion();
  console.log(`\nServicialo Distribution Status (package v${version})\n`);
  console.log(
    "ID".padEnd(24) +
      "Status".padEnd(18) +
      "Last Checked".padEnd(14) +
      "Current?".padEnd(10) +
      "PR/URL",
  );
  console.log("-".repeat(90));
  for (const r of registries) {
    const current =
      r.submitted_version === version ? "✓" : `✗ (${r.submitted_version || "—"})`;
    console.log(
      r.id.padEnd(24) +
        r.status.padEnd(18) +
        (r.last_checked || "—").padEnd(14) +
        current.padEnd(10) +
        (r.pr_url || r.submit_url || "—"),
    );
  }
  console.log();
}

function cmdCheck(registries: Registry[], id: string): void {
  const registry = registries.find((r) => r.id === id);
  if (!registry) {
    console.error(`Registry not found: ${id}`);
    process.exit(1);
  }

  const now = new Date().toISOString().split("T")[0];
  registry.last_checked = now;

  if (registry.type === "github_pr" && registry.pr_url) {
    const { state, merged } = checkGitHubPR(registry.pr_url);
    if (merged) {
      registry.status = "merged";
      console.log(`✓ ${id}: PR merged!`);
    } else if (state === "closed") {
      registry.status = "rejected";
      console.log(`✗ ${id}: PR closed without merge`);
    } else if (state === "open") {
      registry.status = "submitted";
      console.log(`◷ ${id}: PR still open`);
    } else {
      console.log(`? ${id}: state=${state}`);
    }
  } else if (registry.type === "web_submit") {
    const found = checkWebRegistry(registry.url);
    if (found) {
      registry.status = "listed";
      console.log(`✓ ${id}: Found on registry`);
    } else {
      console.log(`◷ ${id}: Not found on registry (status: ${registry.status})`);
    }
  }
}

function cmdCheckAll(registries: Registry[]): void {
  console.log("\nChecking all registries...\n");
  for (const r of registries) {
    cmdCheck(registries, r.id);
  }
  console.log("\nDone.\n");
}

function cmdGenerateEntry(registries: Registry[], id: string) {
  const registry = registries.find((r) => r.id === id);
  if (!registry) {
    console.error(`Registry not found: ${id}`);
    process.exit(1);
  }
  console.log(generateEntry(registry));
}

function cmdUpdateEntry(registries: Registry[], id: string) {
  const registry = registries.find((r) => r.id === id);
  if (!registry) {
    console.error(`Registry not found: ${id}`);
    process.exit(1);
  }

  const newEntry = generateEntry(registry);
  const oldEntry = registry.last_entry || "(no previous entry)";

  console.log(`\n--- Registry: ${registry.name} ---\n`);
  console.log("OLD ENTRY:");
  console.log(oldEntry);
  console.log("\nNEW ENTRY:");
  console.log(newEntry);

  if (oldEntry.trim() === newEntry.trim()) {
    console.log("\n→ No changes needed.");
  } else {
    console.log("\n→ Entry has changed. Review and submit manually.");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`
Usage:
  npx tsx distribution/publish.ts status
  npx tsx distribution/publish.ts check <registry-id>
  npx tsx distribution/publish.ts check-all
  npx tsx distribution/publish.ts generate-entry <registry-id>
  npx tsx distribution/publish.ts update-entry <registry-id>
  npx tsx distribution/publish.ts update-entry --all
`);
  process.exit(0);
}

const yamlContent = readFileSync(REGISTRIES_PATH, "utf-8");
const registries = parseRegistries(yamlContent);

switch (command) {
  case "status":
    cmdStatus(registries);
    break;

  case "check":
    if (!args[1]) {
      console.error("Usage: check <registry-id>");
      process.exit(1);
    }
    cmdCheck(registries, args[1]);
    saveRegistries(registries);
    break;

  case "check-all":
    cmdCheckAll(registries);
    saveRegistries(registries);
    break;

  case "generate-entry":
    if (!args[1]) {
      console.error("Usage: generate-entry <registry-id>");
      process.exit(1);
    }
    cmdGenerateEntry(registries, args[1]);
    break;

  case "update-entry":
    if (args[1] === "--all") {
      for (const r of registries) {
        cmdUpdateEntry(registries, r.id);
      }
    } else if (args[1]) {
      cmdUpdateEntry(registries, args[1]);
    } else {
      console.error("Usage: update-entry <registry-id> | --all");
      process.exit(1);
    }
    break;

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
