# REVIEWER.md

## Role

The Reviewer protects code quality and architectural consistency in SERVI-API.

This role performs structured review on completed work before it is treated as stable.

---

## Review Objectives

- verify alignment with architecture
- verify compliance with engineering rules
- verify maintainability
- verify safe API behavior
- verify readiness for future extension

---

## Reviewer Checklist

### 1. Layering Check

Confirm that:

- routes only register handlers
- controllers are thin
- services own business logic
- repositories own persistence logic

Reject if:

- controller contains workflow decisions
- repository contains policy logic
- helper hides business logic

---

### 2. Typing Check

Confirm that:

- DTOs are typed
- service inputs and outputs are typed
- response data is typed where practical
- `any` is avoided

Reject if:

- weak typing dominates the module
- key contracts are ambiguous
- payload assumptions are unchecked

---

### 3. Validation Check

Confirm that:

- request validation exists
- enums are enforced
- ids are validated
- bad inputs are handled safely

Reject if:

- invalid payload can reach service logic unchecked

---

### 4. Error Handling Check

Confirm that:

- custom errors are used appropriately
- centralized error flow is preserved
- no raw internal errors leak in production paths

Reject if:

- controller manually improvises inconsistent error responses
- service throws vague strings instead of structured errors

---

### 5. Domain Integrity Check

Confirm that:

- the feature belongs to the correct module
- naming reflects business meaning
- status transitions are protected
- workflow history is preserved where necessary

Reject if:

- module responsibility is blurred
- feature crosses too many domains without justification

---

### 6. Repository Quality Check

Confirm that:

- queries are reusable
- filters are clear
- aggregation logic is understandable
- indexes are considered where needed

Reject if:

- database logic is duplicated in multiple places
- repository methods are vague or overgrown

---

### 7. Maintainability Check

Confirm that:

- files are readable
- method names are explicit
- code is not over-nested
- duplication is minimal

Reject if:

- code solves the problem but creates technical debt immediately

---

### 8. Security and Safety Check

Confirm that:

- sensitive data is not exposed
- upload handling is constrained
- integrations are failure-aware
- unsafe assumptions are avoided

Reject if:

- endpoint can be abused due to missing safeguards

---

## Review Questions

The reviewer should ask:

- Is the module easy to understand?
- Is the domain ownership clear?
- Would another developer know where to extend this?
- Does this implementation preserve future scalability?
- Is this ready for production hardening later?

---

## Common Rejection Reasons

- fat controller
- missing validation
- mixed domain logic
- inconsistent response format
- poor naming
- hidden side effects
- incomplete failure handling
- no thought for invalid workflow states

---

## Approval Standard

Approve only when the code is:

- structurally correct
- readable
- typed
- consistent
- domain-aligned
- reasonably safe

---

## Reviewer Rule

Do not approve code that works today but weakens the architecture tomorrow.
