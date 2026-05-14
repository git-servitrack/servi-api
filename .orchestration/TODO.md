# TODO.md

## API Delivery Roadmap

This file tracks the recommended implementation sequence for SERVI-API.

---

## PHASE 1 - Foundation Setup

### Project Setup

- [x] Confirm final folder structure
- [x] Clean base Express + TypeScript bootstrap
- [x] Configure TypeScript compiler settings
- [x] Configure environment loading
- [x] Configure MongoDB connection
- [x] Add base app bootstrap flow
- [x] Add health check endpoint
- [x] Add centralized error middleware
- [x] Add not-found middleware
- [x] Add response helper
- [x] Add logger utility
- [x] Add request logging middleware
- [x] Add base validation strategy
- [x] Add API version prefix strategy

### Engineering Standards

- [x] Create shared constants
- [x] Create custom error classes
- [x] Create pagination helper
- [x] Create ObjectId validation helper
- [x] Define common DTO patterns
- [x] Define standard response contracts

---

## PHASE 2 - Authentication and User Foundation

### User and Access Base

- [x] Define user model
- [x] Define role model or role enum strategy
- [x] Implement user repository
- [x] Implement user service
- [x] Implement auth controller
- [x] Implement auth routes
- [x] Add password hashing
- [x] Add login flow
- [x] Add access token strategy
- [x] Add role-based middleware foundation

> Note: Full authorization granularity can expand later, but the base identity layer should be established early.

---

## PHASE 3 - Core Asset Domain

### Asset Module

- [x] Create asset schema
- [x] Define asset categories
- [x] Define asset status enum
- [x] Create asset repository
- [x] Create asset service
- [x] Create asset controller
- [x] Create asset routes
- [x] Implement create asset endpoint
- [x] Implement list assets endpoint
- [x] Implement get asset details endpoint
- [x] Implement update asset endpoint

### Asset Enhancements

- [x] Add asset code generation rule
- [x] Add asset filtering and pagination

---

## PHASE 4 - Service Request Domain

### Service Request Module

- [x] Create service request schema
- [x] Define request priorities
- [x] Define request statuses
- [x] Create service request repository
- [x] Create service request service
- [x] Create service request controller
- [x] Create service request routes

### Core Endpoints

- [x] Create service request
- [x] List service requests
- [x] Get service request by ID
- [x] Update service request details
- [x] Update request status
- [x] Add request remarks
- [x] Attach request to asset

---

## PHASE 5 - Maintenance Operations Domain

### Maintenance Module

- [x] Create maintenance job schema
- [x] Create maintenance log schema
- [x] Create repair action structure
- [x] Create maintenance repository
- [x] Create maintenance service
- [x] Create maintenance controller
- [x] Create maintenance routes

### Core Endpoints

- [x] Open maintenance job from request
- [x] Assign technician to maintenance job
- [x] Start maintenance job
- [x] Add diagnosis notes
- [x] Add repair action log
- [x] Put job on hold
- [x] Complete maintenance job
- [x] View maintenance history

### Workflow Controls

- [x] Enforce valid maintenance status transitions
- [x] Record technician activity history
- [x] Require completion data before closure

---

## PHASE 6 - Technician Operations Views

### Technician User Strategy

- [x] Use User model with technician role
- [x] Reuse user list filtering for technician listing
- [x] Reuse maintenance assignment workflow for technician assignment

### Core Views

- [x] List technician workloads
- [x] View technician maintenance history
- [x] Generate technician scorecard summary

> Note: A separate technician module is not needed yet because technicians are users with role `technician`.
> Use existing user filtering, for example `GET /user?filter=role:technician`, instead of creating a duplicate endpoint.
> Create a separate technician profile model only when technician-specific fields are needed, such as certifications, skills, availability, or employment metadata.

---

## PHASE 7 - Spare Parts Domain

### Spare Parts Module

- [x] Create spare part schema
- [x] Create stock movement schema
- [x] Create part usage schema
- [x] Create spare parts repository
- [x] Create spare parts service
- [x] Create spare parts controller
- [x] Create spare parts routes

### Core Endpoints

- [x] Register spare part
- [x] Update spare part details
- [x] Add stock
- [x] Deduct stock
- [x] Reserve part for maintenance
- [x] Record part usage for maintenance job
- [x] View stock movement history
- [x] View low-stock items

### Controls

- [x] Prevent invalid negative stock
- [x] Track all stock movements
- [x] Link usage to maintenance jobs

---

## PHASE 8 - Documentation and Uploads

### Documentation Module

- [ ] Create media file schema
- [ ] Create documentation repository
- [ ] Create documentation service
- [ ] Create documentation controller
- [ ] Create documentation routes

### Upload Features

- [ ] Configure upload middleware
- [ ] Validate file type and size
- [ ] Upload damage photos
- [ ] Upload repair completion photos
- [ ] Link photos to assets
- [ ] Link photos to service requests
- [ ] Link photos to maintenance jobs

### Metadata

- [ ] Store uploaded-by
- [ ] Store timestamps
- [ ] Store file context tags

---

## PHASE 9 - Intelligence Integration

### Damage Detection Integration

- [ ] Define damage detection request contract
- [ ] Define damage detection result schema
- [ ] Create intelligence integration repository
- [ ] Create intelligence integration service
- [ ] Create intelligence controller
- [ ] Create intelligence routes
- [ ] Add endpoint to submit image for analysis
- [ ] Store severity level
- [ ] Store confidence score
- [ ] Store detected damage labels
- [ ] Store suggested maintenance action

### Predictive Maintenance Integration

- [ ] Define predictive maintenance request contract
- [ ] Define result schema for failure forecast
- [ ] Add endpoint to trigger prediction
- [ ] Store risk level
- [ ] Store next maintenance recommendation
- [ ] Store forecast explanation metadata if available

### Integration Safety

- [ ] Add timeout handling
- [ ] Add failure fallback logic
- [ ] Add integration error logging

---

## PHASE 10 - Reporting and Analytics

### Reporting Module

- [ ] Create reporting service
- [ ] Create reporting controller
- [ ] Create reporting routes

### Reports

- [ ] Asset maintenance history report
- [ ] Technician performance report
- [ ] Spare parts usage report
- [ ] Downtime report
- [ ] High-risk equipment report
- [ ] Request volume summary
- [ ] Completion rate summary

---

## PHASE 11 - Testing and Hardening

### Automated Testing

- [ ] Add unit tests for services
- [ ] Add controller tests
- [ ] Add repository tests for critical queries
- [ ] Add validation tests
- [ ] Add error-path tests
- [ ] Add integration tests for key workflows

### Security and Stability

- [ ] Sanitize inputs
- [ ] Add rate limiting if needed
- [ ] Harden upload endpoints
- [ ] Review secret handling
- [ ] Review production logging
- [ ] Review error exposure

---

## PHASE 12 - Documentation

### API Documentation

- [ ] Document modules
- [ ] Document request and response samples
- [ ] Document error codes
- [ ] Document role assumptions
- [ ] Document workflow transitions
- [ ] Document AI integration contracts

### Developer Documentation

- [ ] Add local setup guide
- [ ] Add environment variable guide
- [ ] Add testing guide
- [ ] Add folder responsibility guide

---

## Priority Recommendation

### Highest Priority

1. Foundation setup
2. Asset domain
3. Service request domain
4. Maintenance operations
5. Technician assignment
6. Spare parts
7. Documentation uploads

### Next Priority

8. Intelligence integration
9. Reporting
10. Hardening and documentation

---

## Definition of Done

A task is complete only when:

- [ ] code follows SOA layering
- [ ] types are defined
- [ ] validations are added
- [ ] error handling is covered
- [ ] response format is standardized
- [ ] important edge cases are considered
- [ ] code is review-ready
