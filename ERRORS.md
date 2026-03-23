# Servicialo — Protocol Error Codes

Error codes for the Servicialo protocol. Implementations MUST use these codes in error responses. See [HTTP_PROFILE.md §2.5](./spec/HTTP_PROFILE.md) for the error envelope format.

## Error Envelope

All error responses MUST use this structure:

```json
{
  "errors": [
    {
      "status": "422",
      "code": "INVALID_TRANSITION",
      "title": "Invalid state transition",
      "detail": "Cannot transition from 'requested' to 'in_progress'. Valid targets: ['scheduled'].",
      "source": { "pointer": "/data/attributes/to_state" }
    }
  ]
}
```

## Standard Error Codes

### Authentication & Authorization

| Code | HTTP | Description | When it fires |
|------|------|-------------|---------------|
| `UNAUTHORIZED` | 401 | Missing or invalid credentials. | Request has no auth token or token is malformed. |
| `FORBIDDEN` | 403 | Valid credentials but insufficient permissions. | Authenticated user lacks permission for the requested resource. |
| `MANDATE_REQUIRED` | 403 | Agent action requires a valid mandate. | AI agent attempts an action without a delegation mandate (§10). |
| `MANDATE_EXPIRED` | 403 | Mandate has expired or been revoked. | Agent presents a mandate past its `valid_until` or with status `revoked`. |
| `SCOPE_INSUFFICIENT` | 403 | Mandate does not grant the required scope. | Agent's mandate lacks the `resource:action` pair for this operation. |

### Lifecycle & State Transitions

| Code | HTTP | Description | When it fires |
|------|------|-------------|---------------|
| `INVALID_TRANSITION` | 422 | State transition is not permitted. | Attempting to move to a state that is not a valid successor of the current state (§6.1). |
| `EVIDENCE_REQUIRED` | 422 | Missing evidence for this transition. | Transition to `documented` or `verified` without the evidence required by the vertical schema (§9). |
| `EVIDENCE_INVALID` | 422 | Evidence does not meet vertical schema requirements. | Submitted evidence fails validation against the vertical's evidence schema. |
| `TRANSITION_CONFLICT` | 409 | Concurrent transition conflict. | Another transition was applied between read and write — optimistic concurrency violation. |

### Resource Conflicts

| Code | HTTP | Description | When it fires |
|------|------|-------------|---------------|
| `CONFLICT` | 409 | Resource state conflicts with the operation. | Generic conflict — e.g., creating a duplicate, modifying a finalized record. |
| `RESOURCE_UNAVAILABLE` | 409 | Physical resource is not available for the requested slot. | Booking a provider, room, or equipment that is already committed. |
| `SERVICE_ORDER_EXHAUSTED` | 422 | Service Order limits exceeded. | Attempting to create a service that would exceed the Order's quantity, hours, or budget cap. |

### Contract & Policy Violations

| Code | HTTP | Description | When it fires |
|------|------|-------------|---------------|
| `CANCELLATION_OUTSIDE_POLICY` | 422 | Cancellation violates the contract's cancellation policy. | Cancelling after the policy window has closed. |
| `DISPUTE_WINDOW_CLOSED` | 422 | Dispute filed after the allowed window. | Client opens a dispute after `dispute_deadline_days` from completion. |

### Validation & Compatibility

| Code | HTTP | Description | When it fires |
|------|------|-------------|---------------|
| `VALIDATION_ERROR` | 422 | Request body failed schema validation. | JSON payload does not conform to the expected schema. |
| `NOT_FOUND` | 404 | Resource does not exist. | Requested service, session, order, or provider not found. |
| `UNSUPPORTED_VERSION` | 406 | Protocol version not supported. | `X-Servicialo-Version` header specifies an unknown version. |

## Extension Rules

Implementations MAY define additional error codes. Custom codes:

- MUST use `UPPERCASE_SNAKE_CASE`
- MUST NOT conflict with standard codes above
- SHOULD be prefixed with the implementation name (e.g., `COORDINALO_QUEUE_FULL`)
- MUST include `status`, `code`, and `title` fields
