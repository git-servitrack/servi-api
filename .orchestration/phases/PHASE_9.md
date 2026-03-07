Help me implement PHASE 9 of my SERVI-API backend.

Stack:

- Express.js
- TypeScript
- MongoDB
- Mongoose
- SOA

Goal:
Build the Intelligence Integration domain for:

1. damage detection
2. predictive maintenance

Important:
The Node.js API is only the orchestration/integration layer.
Do not put ML training logic inside the Express API.

Please generate:

- damage detection result schema/model
- predictive maintenance result schema/model
- intelligence integration repository
- intelligence integration service
- intelligence controller
- intelligence routes

Required features:

- endpoint to submit image for damage analysis
- store severity level
- store confidence score
- store detected damage labels
- store suggested maintenance action
- endpoint to trigger predictive maintenance
- store risk level
- store next maintenance recommendation
- store forecast explanation metadata if available
- add timeout handling
- add failure fallback logic
- add integration error logging

Requirements:

- design this as integration-ready with an external Python ML service or inference service
- keep controllers thin
- keep service layer responsible for orchestration
- use typed request/response contracts
- persist inference snapshots for traceability

Please include:

- recommended contract between Node.js API and ML service
- schema design
- routes and controller flow
- error handling design
- example request and response payloads
- code structure for this phase
