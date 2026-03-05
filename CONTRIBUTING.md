# Contributing to Servicialo

Servicialo is an open standard for professional service delivery, and contributions are welcome.

This guide covers how to participate, whether you want to propose changes to the standard itself, improve the MCP server implementation, or help with documentation.

## Types of Contributions

### Proposals to the Standard (RFCs)

Changes to the core protocol: the 8 dimensions, the 9 lifecycle states, the foundational principles, or the modules (Core, Finance, Disputes). These follow the [RFC process](#rfc-process) described below.

### New Evidence Verticals

Proposals to define what constitutes valid evidence for a new service vertical beyond the current set (health, home, legal, education). Use the [New Vertical issue template](https://github.com/servicialo/mcp-server/issues/new?template=new-vertical.yml).

### MCP Server Improvements

Bug fixes, new features, or improvements to the `@servicialo/mcp-server` package. Use the [Bug Report template](https://github.com/servicialo/mcp-server/issues/new?template=bug-report.yml) for bugs or open a general issue for feature proposals.

### Documentation and Website

Improvements to servicialo.com content, protocol documentation, or examples. Use the [Documentation template](https://github.com/servicialo/mcp-server/issues/new?template=documentation.yml).

## RFC Process

Changes to the standard require a structured proposal:

1. **Open an Issue** using the [RFC: Standard Proposal](https://github.com/servicialo/mcp-server/issues/new?template=rfc-standard-proposal.yml) template.
2. **Title format**: `RFC-XXXX: [Descriptive title]`
3. **Required sections** in the issue:
   - **Motivation** — What problem does this solve?
   - **Proposal** — The concrete change being proposed.
   - **Impact** — Which existing implementations are affected?
   - **Alternatives considered** — What other approaches were evaluated?
4. **Discussion period** — A minimum of 14 days of open discussion before a decision is made.
5. **Review** — The maintainer (currently [@fdanioni](https://github.com/fdanioni)) reviews the proposal, may request changes, and accepts or rejects it with a public justification.
6. **Merge** — Accepted proposals are assigned to a milestone for the next version of the standard.

## Pull Requests

For code and documentation contributions:

1. Fork the repository.
2. Create a branch from `main`.
3. Every PR must reference an existing issue.
4. The maintainer reviews all PRs before merge.

See the [PR template](.github/pull_request_template.md) for the expected format.

## Design Principles

Any proposal to the standard must be consistent with these principles:

- **Vertical-agnostic** — Works for health, legal, home repair, education, and any future vertical.
- **Human and machine readable** — Structures must be parseable by software and understandable by people.
- **AI agents are first-class citizens** — The protocol assumes agents will schedule, execute, and verify services.
- **Minimum viable** — No complexity without clear justification.
- **Backwards compatible** — When possible. Breaking changes require a new major version.

## Versioning

Servicialo follows [Semantic Versioning](https://semver.org/). Breaking changes to the standard only ship in major versions. The current version is **v0.x**, which means the API surface may still change before v1.0.

## Getting Help

If you're unsure where your contribution fits, open a [general issue](https://github.com/servicialo/mcp-server/issues/new) and we'll help you find the right path.
