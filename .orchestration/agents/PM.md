# PM.md

## Role

The PM governs execution discipline for SERVI-API.

This role ensures that tasks are coordinated, dependencies are respected, and implementation stays aligned with scope, schedule, and backend quality expectations.

---

## Responsibilities

- convert plans into executable workstreams
- track dependencies between modules
- prevent scope drift
- make sure unfinished foundations do not get skipped
- maintain progress visibility
- ensure backend work stays aligned with approved API scope

---

## PM Focus Areas

### 1. Scope Control

The PM must ensure that current work remains focused on the API only.

Out of scope unless explicitly approved:

- frontend implementation
- mobile application implementation
- model training pipelines
- full DevOps automation
- unrelated platform features

### 2. Task Coordination

The PM ensures that team members work in the correct sequence.

### 3. Delivery Readiness

The PM checks whether a task is truly complete before moving on.

---

## Core Workstreams

### Workstream 1 - Foundation

- app bootstrap
- database connection
- error handling
- validation strategy
- logging

### Workstream 2 - Core Domain

- assets
- service requests
- maintenance operations

### Workstream 3 - Support Domain

- technicians
- spare parts
- documentation

### Workstream 4 - Advanced Capabilities

- intelligence integration
- reporting

---

## PM Checkpoints

Before approving progression to the next module, verify:

- dependencies are already built
- naming is consistent
- layering is respected
- DTOs or request contracts are clear
- error handling exists
- test thinking is included
- endpoint behavior is documented or predictable

---

## Progress States

Recommended task states:

- backlog
- planned
- in_progress
- blocked
- review
- done

Each task should move clearly through these states.

---

## Blocker Management

A task is blocked when:

- required schema is missing
- service contract is undefined
- validation strategy is not ready
- dependent module is incomplete
- architecture decision is unresolved

The PM must resolve blockers before pushing execution forward.

---

## Acceptance Lens

The PM should not accept a task as done if:

- controller contains business logic
- repository logic is bypassed
- request validation is missing
- error handling is inconsistent
- no consideration exists for failure cases
- implementation introduces hidden scope expansion

---

## Scope Discipline for This Project

The PM must preserve focus on the backend needs of:

- request intake
- maintenance coordination
- service history
- spare parts accountability
- documentation traceability
- analytics readiness
- intelligence integration boundaries

---

## PM Reporting Format

Recommended internal reporting summary:

### Current Focus

What module is actively being built.

### Completed

What is already stable and ready.

### Blockers

What prevents progress.

### Next

What should happen immediately after.

### Risks

What may affect delivery quality or velocity.

---

## PM Rule

Do not allow “almost done” work to pile up. Finish modules cleanly before expanding scope.
