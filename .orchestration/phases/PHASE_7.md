Help me implement PHASE 7 of my SERVI-API backend.

Tech stack:

- Express.js
- TypeScript
- MongoDB
- Mongoose
- SOA

Goal:
Build the Spare Parts domain.

Please generate:

- spare part model/schema
- stock movement model/schema
- part usage model/schema if needed
- spare parts repository
- spare parts service
- spare parts controller
- spare parts routes

Required features:

- register spare part
- update spare part details
- add stock
- deduct stock
- reserve part for maintenance
- record part usage for maintenance job
- view stock movement history
- view low-stock items
- prevent invalid negative stock
- track all stock movements
- link usage to maintenance jobs

Rules:

- stock changes must be traceable
- service layer must enforce stock rules
- repository layer handles queries only
- keep business logic clean and auditable

Please include:

- recommended schema fields
- stock flow logic
- transaction-safe design ideas
- endpoint structure
- validation and error handling
- full code structure for this module
