# ARCHITECTURE.md

## System Overview

SERVI-API is the backend service for **Servi Track**, a maintenance and equipment monitoring platform for machines, tools, and vehicles used in contractor operations.

The API is responsible for:

- receiving and managing service requests
- assigning technicians
- tracking maintenance activities
- monitoring spare parts usage
- storing equipment and asset records
- handling photo documentation
- generating operational reports
- integrating with intelligent modules for:
  - damage detection
  - predictive maintenance

---

## Architectural Style

The backend uses **Service-Oriented Architecture (SOA)** principles applied within a modular Express.js application.

### Why SOA here?

SOA is appropriate because the system contains multiple distinct business capabilities that should evolve independently:

- Asset Management
- Service Request Management
- Maintenance Operations
- Spare Parts Management
- Technician Management
- Documentation Management
- Reporting
- Intelligence Integration

Each capability can be treated as a service domain inside one backend codebase.

---

## High-Level Layers

### 1. Route Layer

Responsible for HTTP endpoint registration.

**Responsibilities**

- map endpoints to controller handlers
- attach middleware
- keep route files minimal

### 2. Controller Layer

Responsible only for transport logic.

**Responsibilities**

- receive request
- validate request presence
- call service methods
- return standardized response
- forward errors to middleware

### 3. Service Layer

Responsible for business logic and orchestration.

**Responsibilities**

- apply domain rules
- coordinate repositories
- enforce workflow transitions
- call external integrations if needed
- calculate metrics and statuses

### 4. Repository Layer

Responsible for persistence logic.

**Responsibilities**

- execute MongoDB queries
- hide query implementation from service layer
- support pagination, filtering, and aggregation
- provide reusable data access methods

### 5. Model Layer

Responsible for schema and data structure definitions.

**Responsibilities**

- define collections
- define references and indexes
- normalize reusable document patterns
- support audit-related metadata

### 6. Cross-Cutting Layer

Shared technical concerns.

**Contains**

- middleware
- helpers
- config
- logging
- constants
- validators
- error classes

---

## Proposed Domain Services

### 1. Asset Service

Manages machine, tool, and vehicle records.

**Core responsibilities**

- register asset
- update asset profile
- track status
- maintain asset codes
- connect assets to service history

**Sample entities**

- Asset
- AssetCategory
- AssetStatus
- AssetDocument

---

### 2. Service Request Service

Handles intake and management of service requests.

**Core responsibilities**

- create service request
- generate request number
- assign request source
- set request priority
- track request status
- link request to asset

**Sample entities**

- ServiceRequest
- RequestAttachment
- RequestStatusHistory

---

### 3. Maintenance Service

Handles maintenance workflow after request creation.

**Core responsibilities**

- create maintenance job
- assign technician
- update maintenance progress
- record diagnosis
- close maintenance task
- record repair actions

**Sample entities**

- MaintenanceJob
- MaintenanceLog
- RepairAction
- JobStatusHistory

---

### 4. Technician Service

Manages technician records and operational performance.

**Core responsibilities**

- register technician
- assign technician to jobs
- track completion
- compute technician scorecard inputs
- monitor workload distribution

**Sample entities**

- Technician
- TechnicianAssignment
- TechnicianPerformanceMetric

---

### 5. Spare Parts Service

Tracks inventory usage for repairs and maintenance.

**Core responsibilities**

- register spare part
- update stock
- reserve spare part for maintenance
- deduct usage
- track low-stock threshold
- link parts to maintenance jobs

**Sample entities**

- SparePart
- SparePartUsage
- StockMovement

---

### 6. Documentation Service

Handles uploaded photos and maintenance evidence.

**Core responsibilities**

- upload asset or repair images
- store metadata
- associate files to requests or jobs
- support damage detection references
- track uploaded-by and uploaded-at data

**Sample entities**

- MediaFile
- ImageInspectionRecord

---

### 7. Reporting Service

Provides dashboards, summaries, and history views.

**Core responsibilities**

- maintenance history summaries
- downtime summaries
- asset performance reports
- technician performance reports
- spare parts consumption reports

---

### 8. Intelligence Integration Service

Acts as the API boundary for AI/ML-related functions.

**Core responsibilities**

- submit image for damage analysis
- receive detected labels and severity
- store inference results
- trigger predictive maintenance scoring
- retrieve maintenance risk estimates
- separate Node.js backend from model implementation details

**Important**
This service should call an external ML service or internal adapter module. The ML logic should not live directly in controllers.

---

## Recommended Folder Responsibilities

### `/config`

Contains:

- database connection
- environment setup
- app config
- upload config
- third-party integration config

### `/controllers`

Contains:

- one controller per domain
- no business logic
- no direct database logic

### `/services`

Contains:

- domain business rules
- orchestration logic
- integration logic
- reusable service methods

### `/repositories`

Contains:

- MongoDB query logic
- aggregation pipelines
- reusable persistence functions

### `/models`

Contains:

- mongoose schemas
- model exports
- index definitions

### `/routes`

Contains:

- express routers
- endpoint registration
- middleware attachment

### `/middleware`

Contains:

- auth middleware
- error middleware
- request logging
- validation middleware
- upload middleware

### `/helpers`

Contains:

- response formatter
- custom error classes
- utility functions
- pagination helpers
- date helpers
- code generators

### `/docs`

Contains:

- API docs
- Postman notes
- request/response examples
- module references

---

## Core Module Relationships

### Request Lifecycle

1. Asset is registered or identified
2. Service request is created
3. Request is reviewed and prioritized
4. Technician or supervisor assignment is made
5. Maintenance job is opened
6. Spare parts and repair actions are recorded
7. Photos and evidence are uploaded
8. Maintenance job is closed
9. History and reports are updated

---

## Suggested Initial Collections

- assets
- service_requests
- maintenance_jobs
- maintenance_logs
- technicians
- spare_parts
- stock_movements
- media_files
- damage_detection_results
- predictive_maintenance_results
- users
- audit_logs

---

## Key Design Rules

### Thin Controller Rule

Controllers must never:

- contain database queries
- contain business workflows
- compute domain-heavy logic

### Service Ownership Rule

Services must:

- own rules
- coordinate repositories
- control workflow transitions

### Repository Isolation Rule

Repositories must:

- be the only layer touching models for data access
- expose reusable query methods
- avoid embedding business policy

---

## API Response Standard

All endpoints should return a standard format.

### Success

```json
{
  "success": true,
  "message": "Service request created successfully.",
  "data": {},
  "meta": {}
}
```
