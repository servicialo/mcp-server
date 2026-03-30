# Certification — Becoming a Servicialo-Certified Implementation

**Version 1.0.0**

## Overview

Servicialo certification is objective and automated. If your implementation passes the test suite, it's certified. No discretionary approval, no gatekeepers, no subjective review processes.

## Certification Levels

### Level 1 — Core Certified

Minimum viable Servicialo implementation. Required for listing in the meta-registry.

**Requirements:**

1. **8 Dimensions** — Model services using all 8 canonical dimensions (identity, provider, client, schedule, location, lifecycle, evidence, billing)

2. **9 Lifecycle States** — Implement the complete lifecycle with valid transitions:
   ```
   requested → scheduled → confirmed → in_progress → completed → documented → invoiced → charged → verified
   ```

3. **3+ Exception Flows** — Handle at least 3 of the 6 standard exception flows:
   - Client no-show
   - Cancellation
   - Rescheduling
   - Provider no-show
   - Quality dispute
   - Partial delivery

4. **JSON Schema Conformance** — API responses conform to the protocol's JSON Schema for services, transitions, and evidence

5. **Discovery Endpoint** — Expose a Level 2 agent card at `/.well-known/agent.json`

### Level 2 — Full Protocol

Complete Servicialo implementation including advanced features.

**Additional requirements beyond Level 1:**

6. **All 6 Exception Flows** — Handle all standard exception flows
7. **Service Orders** — Support bilateral agreements with computed ledger
8. **Physical Resources** — Model resources as first-class entities with tripartite scheduling
9. **Evidence by Vertical** — Support configurable evidence types per vertical
10. **Pre-Agreed Contracts** — Expose service contracts via `contract.get`

### Level 3 — Network Participant

Full protocol plus network contribution.

**Additional requirements beyond Level 2:**

11. **MCP Server** — Expose tools via MCP with both discovery and authenticated modes
12. **Resolver Registration** — Register in the global resolver with heartbeat
13. **Network Telemetry** — Contribute anonymous, aggregate operational data
14. **A2A Support** — Expose A2A Agent Card and task router

## Test Suite

The certification test suite is open source and can be run against any implementation.

### Running the Tests

```bash
npx @servicialo/certification-suite \
  --base-url https://your-platform.com \
  --org-slug your-test-org \
  --api-key your-test-key \
  --level 1
```

### Test Categories

| Category | Tests | Level |
|----------|-------|-------|
| Schema validation | 8 dimension fields present and correctly typed | 1 |
| Lifecycle transitions | All 9 states reachable via valid transitions | 1 |
| Exception flows | Cancellation, no-show, rescheduling tested | 1 |
| Discovery | `/.well-known/agent.json` returns valid agent card | 1 |
| Service Orders | Order lifecycle with computed ledger validation | 2 |
| Resource scheduling | Tripartite availability check with buffer | 2 |
| Evidence | Vertical-specific evidence recording and validation | 2 |
| MCP tools | All 34 tools callable with correct input/output | 3 |
| Resolver | Registration, heartbeat, endpoint update | 3 |
| A2A | Agent card exposure, task submission and completion | 3 |

## Certification Process

1. **Self-test:** Run the certification suite against your implementation
2. **Submit results:** Open a PR to the [Servicialo registry](https://github.com/servicialo/protocol) with your test results and implementation details
3. **Automated verification:** CI re-runs the test suite against your public endpoint
4. **Listing:** If tests pass, your implementation is added to `servicialo.com/.well-known/registries.json`

## Maintaining Certification

- The test suite runs weekly against all listed implementations
- If an implementation fails tests for 7 consecutive days, its status changes to `degraded`
- If failures persist for 30 days, the implementation is delisted
- Re-certification requires passing the full suite again

## Certification Badge

Certified implementations may display the Servicialo certification badge:

```
Servicialo Certified — Level {1|2|3}
Protocol Version: 1.0.0
```

## Revoking Certification

Certification can only be revoked by automated test failure. There is no manual revocation process. This is a deliberate design decision to prevent gatekeeping.
