# Release checklist for Servicialo vX.Y.Z

## Before release
- [ ] Update version in `packages/mcp-server/package.json`
- [ ] Update protocol version in `PROTOCOL.md` header
- [ ] Run `npx tsx distribution/publish.ts check-all`
- [ ] Review any open registry issues

## After release
- [ ] Run `npx tsx distribution/publish.ts update-entry --all`
- [ ] Review generated diffs for each registry
- [ ] Submit updated entries to registries where version is referenced in the entry text
- [ ] Update `distribution/registries.yaml` with new submission dates
- [ ] If new registries discovered, add them to `registries.yaml`

## Manual submissions (if version is referenced)
- [ ] mcpservers.org — resubmit if description changed
- [ ] Glama.ai — check if listing auto-updates from npm
- [ ] APIs.guru — auto-updates from OpenAPI spec URL (no action needed unless URL changed)
