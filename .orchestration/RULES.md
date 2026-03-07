# RULES.md

## Core Engineering Rules

### Rule 1 - Follow SOA Boundaries

Every feature must belong to a clear service domain.

Do not mix unrelated business logic in one module.

---

### Rule 2 - Controllers Must Stay Thin

Controllers may:

- parse request input
- call service methods
- return responses
- pass errors to middleware

Controllers may not:

- execute direct database logic
- compute workflow rules
- embed business decisions

---

### Rule 3 - Services Own Business Logic

All business rules must live in the service layer.

Examples:

- generating request numbers
- deciding priority defaults
- validating maintenance status transitions
- computing technician performance
- determining spare-part deduction rules

---

### Rule 4 - Repositories Own Persistence

Repositories are the only layer allowed to perform direct model queries for normal domain flow.

Do not write Mongoose queries inside:

- controllers
- route files
- middleware
- helpers

---

### Rule 5 - Use Strong Typing

All domain methods, DTOs, and responses must use TypeScript types or interfaces.

Avoid:

- `any`
- implicit return types in service contracts
- weakly typed request payload handling

---

### Rule 6 - Standardize API Responses

All endpoints must return the same response shape.

Do not return inconsistent formats between modules.

---

### Rule 7 - Centralize Error Handling

Use a centralized error middleware.

Do not send raw error objects directly from controllers.

Use:

- custom error classes
- error codes
- safe production messages

---

### Rule 8 - Validate Before Execution

Every input must be validated before it reaches core business logic.

Validation must cover:

- required fields
- format checks
- enum checks
- object id checks
- pagination params
- uploaded file restrictions

---

### Rule 9 - Do Not Hardcode Magic Values

Extract reusable constants for:

- statuses
- priorities
- roles
- severity levels
- stock movement types
- maintenance categories

---

### Rule 10 - Keep Domain Names Explicit

Use domain-meaningful naming.

Prefer:

- `createServiceRequest`
- `assignTechnicianToJob`
- `recordSparePartUsage`

Avoid vague names such as:

- `handleData`
- `processItem`
- `updateAll`

---

## Folder Rules

### `/routes`

- route registration only
- no business logic
- versioning-ready structure preferred

### `/controllers`

- request/response only
- one controller per domain or module
- must call service layer only

### `/services`

- domain logic only
- orchestrates repositories and helpers
- may call integration adapters

### `/repositories`

- query abstraction only
- no transport logic
- no HTTP concerns

### `/models`

- schema definitions only
- add indexes where useful
- keep virtuals intentional and documented

### `/middleware`

- reusable technical middleware only
- no domain workflow logic

### `/helpers`

- shared pure utilities
- no hidden business logic
- no direct route coupling

---

## Database Rules

### Schema Design

- define indexes for commonly queried fields
- include timestamps on major collections
- support soft status tracking where required
- avoid schema ambiguity

### IDs and References

- use MongoDB ObjectId references where appropriate
- use generated human-readable codes for business references
- never expose internal design shortcuts as business identifiers

### Auditability

Major workflow records should support:

- createdBy
- updatedBy
- timestamps
- status history where needed

---

## Service Request Rules

- every service request must have a unique request number
- every request must be tied to a valid asset or asset reference context
- request status transitions must be controlled
- requests cannot jump to invalid states

Suggested statuses:

- pending
- reviewed
- assigned
- in_progress
- on_hold
- completed
- cancelled

---

## Maintenance Rules

- maintenance jobs must be linked to a service request
- status changes must be tracked
- repair actions must be recorded clearly
- spare parts usage must be associated to the maintenance context
- completion must require minimum required closure data

---

## Spare Parts Rules

- stock deduction must be transactional in behavior at application level
- negative stock must never be allowed without explicit override policy
- all stock movement must be traceable
- part usage must reference job, technician, and quantity where applicable

---

## Documentation Rules

- only allowed file types may be uploaded
- file size limits must be enforced
- metadata must be stored
- uploads should be linked to asset, request, or job context
- sensitive file paths or provider secrets must never be exposed

---

## Intelligence Integration Rules

- AI/ML integrations must be abstracted behind service interfaces
- the Express API must not directly contain training logic
- inference results must be stored with traceable metadata
- predicted outputs must be treated as assistive, not absolute truth
- confidence scores and severity levels should be recorded when available

---

## Logging Rules

Log:

- request failures
- validation failures
- unexpected exceptions
- critical workflow changes
- external integration failures

Do not log:

- passwords
- secrets
- tokens
- unnecessary personal data

---

## Testing Rules

Every new module should include:

- unit tests for service logic
- repository tests where necessary
- controller tests for main flows
- failure-case coverage for validations and status transitions

---

## Review Rules

A task is not complete if:

- it breaks layering
- it skips validation
- it adds inconsistent naming
- it ignores typing
- it bypasses repository abstraction
- it lacks error-path thinking

---

## Refactoring Rules

Refactor immediately when:

- controller becomes too large
- service mixes multiple domains without reason
- repository contains business logic
- duplicate logic appears in more than one module
- response or error patterns drift from standard

---

## Final Rule

Readable, modular, and maintainable code is more important than fast but messy implementation.
