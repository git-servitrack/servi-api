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

- [ ] Create service request schema
- [ ] Define request priorities
- [ ] Define request statuses
- [ ] Create request number generator
- [ ] Create service request repository
- [ ] Create service request service
- [ ] Create service request controller
- [ ] Create service request routes

### Core Endpoints

- [ ] Create service request
- [ ] List service requests
- [ ] Get service request by ID
- [ ] Update service request details
- [ ] Update request status
- [ ] Add request remarks
- [ ] Attach request to asset

### Workflow Controls

- [ ] Enforce valid request status transitions
- [ ] Record request status history
- [ ] Add priority-based sorting

---

## PHASE 5 - Maintenance Operations Domain

### Maintenance Module

- [ ] Create maintenance job schema
- [ ] Create maintenance log schema
- [ ] Create repair action structure
- [ ] Create maintenance repository
- [ ] Create maintenance service
- [ ] Create maintenance controller
- [ ] Create maintenance routes

### Core Endpoints

- [ ] Open maintenance job from request
- [ ] Assign technician to maintenance job
- [ ] Start maintenance job
- [ ] Add diagnosis notes
- [ ] Add repair action log
- [ ] Put job on hold
- [ ] Complete maintenance job
- [ ] View maintenance history

### Workflow Controls

- [ ] Enforce valid maintenance status transitions
- [ ] Record technician activity history
- [ ] Require completion data before closure

---

## PHASE 6 - Technician Domain

### Technician Module

- [ ] Create technician schema
- [ ] Create technician repository
- [ ] Create technician service
- [ ] Create technician controller
- [ ] Create technician routes

### Core Endpoints

- [ ] Register technician
- [ ] Update technician profile
- [ ] Assign technician
- [ ] List technician workloads
- [ ] View technician maintenance history
- [ ] Generate technician scorecard summary

---

## PHASE 7 - Spare Parts Domain

### Spare Parts Module

- [ ] Create spare part schema
- [ ] Create stock movement schema
- [ ] Create part usage schema
- [ ] Create spare parts repository
- [ ] Create spare parts service
- [ ] Create spare parts controller
- [ ] Create spare parts routes

### Core Endpoints

- [ ] Register spare part
- [ ] Update spare part details
- [ ] Add stock
- [ ] Deduct stock
- [ ] Reserve part for maintenance
- [ ] Record part usage for maintenance job
- [ ] View stock movement history
- [ ] View low-stock items

### Controls

- [ ] Prevent invalid negative stock
- [ ] Track all stock movements
- [ ] Link usage to maintenance jobs

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
