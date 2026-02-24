# Roadmap

This roadmap reflects the current direction of the **Servicialo open standard** and its reference tooling. Priorities may shift based on community feedback and RFC outcomes.

> Servicialo is a community-driven standard. If you want to influence the roadmap, open a [feature request](https://github.com/servicialo/mcp-server/issues/new?template=feature_request.md) or submit an [RFC](./CONTRIBUTING.md).

---

## Short Term — Solidify the Foundation

_Target: Protocol v0.4_

- [ ] **Finalize JSON Schemas** — complete validation coverage for all 9 lifecycle states and 6 exception flows.
- [ ] **Conformance test suite** — portable tests any implementation can run to verify protocol compliance.
- [ ] **Expand evidence verticals** — add at least 2 new verticals beyond Health, Home, Legal, and Education (community-proposed).
- [ ] **MCP server hardening** — improve error handling, input validation, and edge-case coverage.
- [ ] **OpenAPI specification** — publish a formal API description for the HTTP endpoints consumed by the MCP server.
- [ ] **Multilingual documentation** — English translation of the core specification (PROTOCOL.md and README).

## Mid Term — Grow the Ecosystem

_Target: Protocol v0.5 – v0.8_

- [ ] **Finance module** — move billing and payment lifecycle from "design" to "stable" status with full schema support.
- [ ] **Dispute resolution module** — formalize the 3-phase dispute model into a stable, implementable specification.
- [ ] **Multi-implementation interoperability** — define and test cross-platform compatibility between independent Servicialo implementations.
- [ ] **Agent SDK / client libraries** — reference libraries (TypeScript, Python) for building Servicialo-aware AI agents.
- [ ] **Webhook / event specification** — standardize real-time notifications for state transitions.
- [ ] **Governance expansion** — establish a contributors group and formalize the RFC review process with multiple reviewers.

## Long Term — Standard Maturity

_Target: Protocol v1.0_

- [ ] **Protocol v1.0** — declare the Core module (8 dimensions, 9 states, 7 principles) as stable with backwards-compatibility guarantees.
- [ ] **Formal governance body** — transition from single-maintainer to a multi-stakeholder steering committee.
- [ ] **Certification program** — optional conformance certification for platforms implementing Servicialo.
- [ ] **Industry adoption** — at least 3 independent implementations beyond the [Coordinalo](https://coordinalo.com) reference implementation.
- [ ] **Accessibility and localization** — specification available in Spanish, English, and Portuguese; tooling supports i18n service metadata.

---

## How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the RFC process, vertical proposals, and code contribution guidelines.
