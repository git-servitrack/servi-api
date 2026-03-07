# Orchestration Layer - SERVI-API

## Purpose

This orchestration layer defines how the API project is planned, reviewed, implemented, and validated across roles. It exists to keep development organized, consistent, and production-oriented while building the backend for **Servi Track**.

The API stack is:

- **Express.js**
- **TypeScript**
- **MongoDB**
- **Service-Oriented Architecture (SOA)**

This orchestration is focused on the **API side only**.

---

## Project Scope

The API supports the backend foundation for the following business capabilities:

- Service request intake and centralized maintenance management
- Technician assignment and workflow updates
- Maintenance records and repair history
- Spare parts tracking
- Technician performance scorecards
- Photo documentation for damaged or repaired assets
- Damage detection integration
- Predictive maintenance forecasting integration
- Reporting and traceability

---

## Architecture Style

The backend follows a **layered SOA-inspired structure**:

- **Routes Layer** – HTTP endpoints and route binding
- **Controller Layer** – request/response handling only
- **Service Layer** – business rules and orchestration logic
- **Repository Layer** – data access and persistence
- **Model Layer** – MongoDB schemas and document definitions
- **Helper / Middleware / Config Layer** – shared utilities and technical cross-cutting concerns

This structure keeps the codebase maintainable, testable, and scalable.

---

## Main Principles

1. Controllers must stay thin.
2. Services own business rules.
3. Repositories own database interactions.
4. Models must remain clean and normalized where practical.
5. Validation must happen before business logic executes.
6. Error handling must be centralized.
7. Logging must be consistent and useful for debugging.
8. New features must align with the approved API scope.
9. AI/ML capabilities must be integrated through service boundaries, not hardcoded into controllers.
10. Security, auditability, and maintainability are non-negotiable.

---

## Orchestration Files

### Core Documents

- `ARCHITECTURE.md` – overall technical architecture and module boundaries
- `RULES.md` – development rules and engineering constraints
- `TODO.md` – implementation roadmap and delivery checklist

### Agent Documents

- `agents/PROJECT_PLANNER.md` – breaks down phases, priorities, and milestones
- `agents/PM.md` – manages execution flow, dependencies, and delivery discipline
- `agents/ARCHITECT.md` – defines structural and architectural decisions
- `agents/DEVELOPER.md` – implementation guidance and coding standards
- `agents/QA.md` – testing strategy and quality gates
- `agents/REVIEWER.md` – code review standards and release-readiness checks

---

## Working Model

The expected implementation flow is:

1. Read `ARCHITECTURE.md`
2. Follow `RULES.md`
3. Pull tasks from `TODO.md`
4. Use the role documents inside `/agents` for decision-making per responsibility
5. Keep all API work aligned with SOA boundaries

---

## Non-Goals for This Phase

The following are out of scope for the current API orchestration phase unless explicitly added later:

- Frontend UI implementation
- Mobile application implementation
- Full ML model training pipeline inside the Node.js API
- DevOps deployment scripts
- Real-time socket infrastructure
- Billing, invoicing, or client contract logic

---

## Success Criteria

The orchestration layer is successful when:

- The backend structure remains clean and predictable
- Features are implemented consistently
- Roles and responsibilities are clear
- API growth does not collapse maintainability
- AI-related integrations remain modular
- The team can build faster with less ambiguity
