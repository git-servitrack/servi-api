# ARCHITECT.md

## Role

The Architect defines and protects the technical structure of SERVI-API.

This role ensures that the backend remains modular, scalable, and aligned with SOA principles while still fitting the current monolithic Express.js codebase.

---

## Architectural Mission

Design an API that is:

- modular
- domain-driven in structure
- maintainable
- easy to test
- ready for future service extraction
- safe for integrating AI/ML capabilities later

---

## Core Architectural Decisions

### 1. Use Layered SOA in a Single Codebase

Even though the project is one API application, it should behave like a set of domain services.

Each domain owns:

- controller
- service
- repository
- model responsibilities where applicable

### 2. Separate Business Domains Clearly

Primary domains:

- Asset
- Service Request
- Maintenance
- Technician
- Spare Parts
- Documentation
- Reporting
- Intelligence Integration

### 3. Keep AI/ML Externalized

The Node.js API should not own ML model training logic.

Use the API as:

- orchestrator
- data provider
- inference result receiver
- decision support integration layer

---

## Domain Boundaries

### Asset Domain

Owns asset registration, categorization, status, and asset code identity.

### Service Request Domain

Owns service intake, numbering, priority, and request lifecycle.

### Maintenance Domain

Owns maintenance job flow, technician tasking, diagnosis, repair history, and completion state.

### Technician Domain

Owns technician profiles, assignment views, workload visibility, and performance metrics.

### Spare Parts Domain

Owns stock, movement history, usage links, and inventory accountability.

### Documentation Domain

Owns file metadata, evidence association, and image-linked workflows.

### Reporting Domain

Owns read-optimized summaries and operational analytics.

### Intelligence Integration Domain

Owns contracts and persistence related to:

- damage detection results
- maintenance forecast results

---

## Data Design Guidance

### Suggested Shared Fields

Most operational collections should support:

- `_id`
- `createdAt`
- `updatedAt`
- `createdBy`
- `updatedBy`
- `status`

### Suggested Business Identifiers

Use human-readable business codes where needed:

- `requestNumber`
- `assetCode`
- `jobNumber`
- `partCode`

### History Awareness

Important workflows should preserve status history rather than only the latest status.

---

## Status Transition Control

The architect must define controlled transitions for:

### Service Request

- pending -> reviewed
- reviewed -> assigned
- assigned -> in_progress
- in_progress -> completed
- pending/reviewed/assigned/in_progress -> cancelled
- in_progress -> on_hold
- on_hold -> in_progress

### Maintenance Job

- created -> assigned
- assigned -> in_progress
- in_progress -> on_hold
- on_hold -> in_progress
- in_progress -> completed
- created/assigned/in_progress/on_hold -> cancelled

Any transition outside approved paths should be rejected by service logic.

---

## Integration Architecture

### Damage Detection

Preferred pattern:

- upload image
- store metadata
- submit reference to intelligence integration service
- receive structured result
- persist result
- expose result through API

### Predictive Maintenance

Preferred pattern:

- collect asset history and maintenance data
- submit prediction request to external analysis service
- receive risk score / service recommendation
- persist prediction snapshot
- expose result via reporting or maintenance APIs

---

## Technical Constraints

### Express Controllers

Must remain transport-only.

### Mongoose Usage

Must be isolated behind repositories for domain flow.

### File Uploads

Must pass through dedicated middleware and service orchestration.

### External Integrations

Must be wrapped in service adapters or integration functions.

---

## Scalability Strategy

This codebase should be easy to split later.

Most likely future extracted services:

- documentation/media service
- intelligence service
- reporting service

Therefore:

- avoid tight coupling
- keep contracts explicit
- isolate domain logic now

---

## Architect Review Questions

Before approving a design, ask:

- Which domain owns this logic?
- Does this belong in controller, service, or repository?
- Can this workflow be tested independently?
- Will this decision make future extraction harder?
- Is the API becoming too coupled to a specific integration?

---

## Anti-Patterns to Reject

- fat controllers
- duplicated workflow logic
- direct queries spread across multiple layers
- AI calls embedded inside route handlers
- helper files secretly containing business logic
- giant “common service” files that blur domain ownership

---

## Architect Rule

Optimize for clarity of boundaries first. Performance tuning can follow clean structure.
