# QA.md

## Role

The QA role ensures that SERVI-API is correct, stable, and ready for reliable use.

Quality assurance covers:

- functional correctness
- validation coverage
- workflow consistency
- error handling
- regression resistance

---

## QA Objectives

1. verify that features work as expected
2. verify that invalid inputs fail safely
3. verify that workflow transitions are controlled
4. verify that API responses are consistent
5. verify that integrations fail gracefully

---

## Testing Scope

### 1. Unit Testing

Focus on:

- service methods
- rule validation
- status transition logic
- scorecard calculations
- stock deduction logic

### 2. Controller Testing

Focus on:

- request handling
- response format
- success and failure paths
- middleware integration behavior

### 3. Repository Testing

Focus on:

- critical query correctness
- aggregation behavior
- filters and pagination
- relation lookups

### 4. Integration Testing

Focus on:

- end-to-end module flow
- request to maintenance conversion
- technician assignment flows
- spare parts usage flows
- upload + intelligence result persistence flow

---

## Critical QA Scenarios

### Asset Module

- create asset successfully
- reject invalid asset payload
- update asset correctly
- filter assets correctly

### Service Request Module

- create service request successfully
- generate unique request number
- reject invalid request payload
- reject invalid status transition
- return proper history tracking

### Maintenance Module

- create maintenance job from request
- assign technician correctly
- reject completion without required fields
- reject invalid workflow jumps
- preserve maintenance history

### Spare Parts Module

- add stock correctly
- deduct stock correctly
- reject negative stock violation
- track stock movement history
- link usage to maintenance job

### Documentation Module

- accept allowed file type
- reject disallowed file type
- reject oversized upload
- link uploaded file to valid entity

### Intelligence Integration Module

- persist valid analysis result
- handle timeout or integration failure
- reject malformed external response
- keep inference result traceable

---

## QA Quality Gates

A feature should not pass QA if:

- request validation is missing
- response shape is inconsistent
- error message behavior is unpredictable
- business rules are bypassed
- status transition control is weak
- edge cases were ignored
- integration errors crash the endpoint

---

## Regression Focus

Retest affected flows whenever changes occur in:

- request statuses
- maintenance statuses
- inventory logic
- upload handling
- intelligence integration contracts
- shared helpers
- error middleware

---

## Suggested Test Categories

### Functional

Does it work?

### Negative

Does it fail safely?

### Boundary

Does it handle limits properly?

### State-based

Does it enforce valid transitions?

### Integration

Does it coordinate modules correctly?

---

## QA Deliverables

For every significant module, QA should produce:

- tested scenarios list
- failed scenarios list
- bug summary
- risk summary
- release recommendation

---

## QA Rule

If a workflow can enter a bad state, QA must treat it as a critical issue.
