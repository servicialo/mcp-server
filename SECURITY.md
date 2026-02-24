# Security Policy

## Supported Versions

| Component | Version | Supported |
|-----------|---------|:---------:|
| Protocol (Servicialo) | 0.3 | Yes |
| `@servicialo/mcp-server` | 0.5.x | Yes |

Only the latest released versions receive security updates. Older protocol versions (v0.1, v0.2) are no longer supported.

## Reporting a Vulnerability

If you discover a security issue in the Servicialo standard or the reference MCP server, please report it privately.

**Email:** [security@servicialo.com](mailto:security@servicialo.com)

Include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof of concept if possible.
- The affected component (protocol specification, MCP server, JSON schemas).

**Do not** open a public GitHub issue for security vulnerabilities.

## What to Expect

- **Acknowledgement** within 72 hours of your report.
- **Initial assessment** within 7 days, including severity classification.
- **Resolution or mitigation plan** within 30 days for confirmed issues.

We will coordinate disclosure with you. Credit will be given to reporters unless they prefer to remain anonymous.

## Scope

### In scope

- Flaws in the protocol specification that could lead to unsafe state transitions, unauthorized lifecycle changes, or evidence forgery.
- Vulnerabilities in the `@servicialo/mcp-server` reference implementation (authentication bypass, injection, data exposure).
- Issues in the JSON Schemas (`schema/`) that allow invalid or malicious payloads to pass validation.

### Out of scope

- Vulnerabilities in third-party implementations of the Servicialo standard. Report those directly to the platform maintainer.
- Issues in the servicialo.com website unrelated to the protocol or MCP server.
- Social engineering or phishing attacks.
- Denial-of-service attacks against infrastructure not maintained in this repository.

## Disclosure Policy

We follow coordinated disclosure. We ask reporters to allow up to 90 days for a fix before public disclosure. If a fix is released sooner, we will coordinate an earlier disclosure date with the reporter.
