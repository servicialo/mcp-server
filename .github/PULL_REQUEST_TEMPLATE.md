## Related issue

<!-- Link the issue this PR addresses. Every PR must reference an existing issue. -->

Closes #

## What changed

<!-- Concise summary of the changes. -->

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Protocol change (modification to dimensions, states, principles, or modules)
- [ ] New evidence vertical
- [ ] Documentation update
- [ ] Schema change (`schema/`)
- [ ] MCP server change (`packages/mcp-server/`)
- [ ] CI / tooling

## Checklist

- [ ] I have read [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] My changes follow the existing code style and conventions
- [ ] I have added or updated tests where applicable
- [ ] All existing tests pass (`npm test` in `packages/mcp-server/`)
- [ ] I have updated documentation to reflect my changes
- [ ] This PR targets the `main` branch

### If this is a protocol change:

- [ ] An RFC issue was opened and the 14-day discussion period has passed
- [ ] PROTOCOL.md has been updated
- [ ] JSON Schemas have been updated to reflect the change
- [ ] The CHANGELOG.md has been updated under `[Unreleased]`
- [ ] Backwards compatibility impact has been documented

### If this modifies the MCP server:

- [ ] `packages/mcp-server/` builds without errors (`npm run build`)
- [ ] New or modified tools include input validation via Zod schemas
- [ ] The package version in `package.json` has been bumped if publishing is needed

## Notes for reviewers

<!-- Anything the reviewer should know — design trade-offs, open questions, etc. -->
