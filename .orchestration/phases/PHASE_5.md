Help me build PHASE 5 of my SERVI-API backend.

Stack:

- Express.js
- TypeScript
- MongoDB
- Mongoose
- SOA

Goal:
Build the Maintenance Operations domain.

Please generate:

- maintenance job model/schema
- maintenance log model/schema if separate
- maintenance repository
- maintenance service
- maintenance controller
- maintenance routes

Required features:

- open maintenance job from service request
- assign technician to maintenance job
- start maintenance job
- add diagnosis notes
- add repair action log
- put job on hold
- complete maintenance job
- view maintenance history
- enforce valid maintenance status transitions
- record technician activity history
- require completion data before closure

Suggested statuses:

- created
- assigned
- in_progress
- on_hold
- completed
- cancelled

Rules:

- Controllers stay thin
- Services own workflow logic
- Repositories own persistence logic
- Preserve history and auditability
- Keep relations clean with service requests and technicians

Please include:

- suggested schema fields
- file breakdown
- actual code structure
- state transition validation
- endpoint examples
- closure validation rules
