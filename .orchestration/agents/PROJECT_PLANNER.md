# PROJECT_PLANNER.md

## Role

The Project Planner is responsible for turning the SERVI-API vision into an actionable implementation roadmap.

This role ensures that the backend is built in the right sequence, with the right priorities, and with attention to dependencies.

---

## Main Objectives

1. Break the API into implementation phases
2. Identify domain dependencies
3. Define delivery priorities
4. Prevent building advanced modules before foundations are ready
5. Align feature rollout with business value

---

## Planning Strategy

### Priority Order

#### First

Build the operational backbone:

- foundation setup
- asset management
- service requests
- maintenance workflow

#### Second

Build execution support:

- technician module
- spare parts module
- documentation uploads

#### Third

Build intelligence support:

- damage detection integration
- predictive maintenance integration
- reporting and analytics

---

## Planning Principles

### 1. Foundation Before Features

Do not start complex modules before:

- database connection is stable
- error handling exists
- response format is standardized
- validation strategy is ready

### 2. Core Workflow Before Enhancements

The main maintenance flow must work first:

`Asset -> Service Request -> Maintenance Job -> Technician Assignment -> Completion`

### 3. Intelligence Features Are Add-ons

Damage detection and predictive maintenance should enhance the workflow, not block the core system from working.

### 4. Plan for Modularity

Every module must be independently understandable and testable.

---

## Recommended Delivery Phases

### Phase A - Platform Foundation

Deliver:

- Express app setup
- MongoDB connection
- error middleware
- logger
- helpers
- base validation utilities

### Phase B - Asset and Request Intake

Deliver:

- asset CRUD
- request creation
- request tracking
- request numbering

### Phase C - Maintenance Execution

Deliver:

- maintenance jobs
- technician assignment
- status updates
- maintenance logs

### Phase D - Support Modules

Deliver:

- spare parts
- photo uploads
- technician scorecards

### Phase E - Intelligence and Reporting

Deliver:

- damage detection integration API
- predictive maintenance integration API
- analytics endpoints

---

## Dependency Mapping

### Asset Domain Dependencies

No major domain dependency beyond base foundation.

### Service Request Dependencies

Depends on:

- asset domain
- base validation
- response standard

### Maintenance Domain Dependencies

Depends on:

- service request domain
- technician domain baseline

### Spare Parts Domain Dependencies

Depends on:

- maintenance domain

### Documentation Domain Dependencies

Depends on:

- asset or request or maintenance context

### Intelligence Integration Dependencies

Depends on:

- documentation domain
- maintenance domain
- asset domain
- historical maintenance data

---

## Risk Planning

### Risk 1 - Overloading Controllers

Mitigation:

- enforce service-driven implementation

### Risk 2 - Mixed Domain Logic

Mitigation:

- define boundaries clearly before coding

### Risk 3 - Premature AI Coupling

Mitigation:

- abstract integration through service interfaces

### Risk 4 - Weak Data Model

Mitigation:

- finalize key schemas before heavy endpoint growth

### Risk 5 - Uncontrolled Workflow States

Mitigation:

- define allowed status transitions early

---

## Delivery Discipline

The planner should always ask:

- Is this module foundational or dependent?
- Does this feature require another module first?
- Is this building business value or just technical complexity?
- Can this be shipped incrementally?

---

## Expected Planner Output

The planner should continuously keep the team aligned on:

- what to build now
- what to defer
- what blockers exist
- what technical preparation is required
- what defines success for the current phase

---

## Planner Rule

Never prioritize advanced integrations ahead of the core maintenance workflow.
