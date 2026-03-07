# DEVELOPER.md

## Role

The Developer implements SERVI-API features according to architecture, rules, and delivery priorities.

This role is responsible for writing clean, typed, maintainable backend code using:

- Express.js
- TypeScript
- MongoDB
- SOA-oriented layering

---

## Development Objectives

- build features by domain
- respect controller/service/repository separation
- maintain strong typing
- write readable and reusable code
- preserve long-term maintainability

---

## Implementation Rules

### 1. Start from Domain Ownership

Before writing code, identify:

- which domain owns the feature
- which service should contain the logic
- which repository methods are needed
- what schema or DTO changes are required

### 2. Keep Controllers Thin

Controllers should only:

- receive request
- call service
- return response
- call `next(error)` on failure

### 3. Write Service-First Logic

The service layer should:

- validate domain rules
- orchestrate repositories
- manage status transitions
- prepare response-ready business data

### 4. Repositories Must Be Reusable

Repositories should expose reusable methods such as:

- create
- findById
- findOne
- findMany
- updateById
- aggregate summaries

---

## Recommended Coding Style

### Naming

Use explicit method names.

Examples:

- `createAsset`
- `createServiceRequest`
- `assignTechnicianToMaintenanceJob`
- `recordSparePartUsage`
- `getTechnicianScorecard`

### File Naming

Prefer clear module naming:

- `asset.controller.ts`
- `asset.service.ts`
- `asset.repository.ts`
- `asset.model.ts`
- `asset.route.ts`

### Function Size

Keep functions focused.
Split large service methods into smaller private helpers when necessary.

---

## Expected Service Pattern

### Controller

- receives request
- calls service
- returns standardized success response

### Service

- validates business rules
- calls repository
- coordinates related actions
- returns final business result

### Repository

- performs Mongoose operations only

---

## Validation Expectations

Each endpoint should validate:

- required fields
- allowed enums
- ids
- pagination inputs
- uploaded file rules
- business preconditions where relevant

Suggested options:

- Zod
- Joi
- express-validator

The final choice should stay consistent project-wide.

---

## Error Handling Expectations

Use:

- custom error classes
- standardized error response format
- centralized middleware

Examples of useful error types:

- `BadRequestError`
- `NotFoundError`
- `ConflictError`
- `UnauthorizedError`
- `ForbiddenError`
- `ExternalServiceError`

---

## Logging Expectations

Useful log points:

- failed database operations
- rejected status transitions
- integration failures
- upload failures
- unexpected exceptions

Avoid noisy logs for routine success paths unless required for auditing.

---

## Module-by-Module Developer Guidance

### Asset Module

Implement:

- create asset
- list asset
- get asset
- update asset
- change asset status

### Service Request Module

Implement:

- create request
- auto-generate request number
- update request status
- attach request to asset
- view request history

### Maintenance Module

Implement:

- create maintenance job
- assign technician
- start job
- record diagnosis
- record repair action
- complete job

### Technician Module

Implement:

- create technician
- update technician
- track assignments
- summarize scorecard metrics

### Spare Parts Module

Implement:

- register part
- add stock
- record stock movement
- deduct usage
- prevent invalid stock states

### Documentation Module

Implement:

- upload metadata handling
- link media to business entities
- support photo retrieval records

### Intelligence Module

Implement:

- submit analysis requests
- store damage detection outputs
- store predictive outputs
- expose results via clean service interfaces

---

## Testing Mindset While Developing

Before considering implementation complete, check:

- happy path
- invalid input path
- not found path
- invalid state transition path
- integration failure path

---

## Definition of Good Code

Good code in this project is:

- typed
- layered
- readable
- explicit
- domain-aligned
- testable
- safe for future scaling

---

## Developer Rule

Never solve a structural problem with a shortcut that increases future maintenance cost.
