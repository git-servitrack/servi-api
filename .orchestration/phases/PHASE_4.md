Help me implement PHASE 4 of my SERVI-API backend using Express + TypeScript + MongoDB + SOA.

Goal:
Build the Service Request domain.

Please generate:

- service request model/schema
- service request repository
- service request service
- service request controller
- service request routes
- validation layer or DTO validation

Required features:

- create service request
- list service requests
- get service request by ID
- update service request details
- update request status
- add request remarks
- attach request to asset
- generate unique request number
- record status history
- enforce valid request status transitions
- support priority-based sorting

Suggested statuses:

- pending
- reviewed
- assigned
- in_progress
- on_hold
- completed
- cancelled

Rules:

- Keep business logic inside service layer
- Enforce clean state transitions
- Use standardized API response shape
- Use clean naming and strong typing

Please provide:

- file structure
- code per file
- status transition logic
- recommended schema design
- validation and error handling approach
