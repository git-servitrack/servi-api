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

- [x] Create media file schema
- [x] Create documentation repository
- [x] Create documentation service
- [x] Create documentation controller
- [x] Create documentation routes

### Upload Features

- [x] Configure upload middleware
- [x] Validate file type and size
- [x] Upload damage photos
- [x] Upload repair completion photos
- [x] Link photos to assets
- [x] Link photos to service requests
- [x] Link photos to maintenance jobs

### Metadata

- [x] Store uploaded-by
- [x] Store timestamps
- [x] Store file context tags

---

## PHASE 9 - Intelligence Integration

### Damage Detection - Teachable Machine TensorFlow.js

- [ ] Add TensorFlow.js runtime dependency for API-side inference
- [ ] Define local model storage path for downloaded Teachable Machine files
- [ ] Store downloaded `model.json`, `metadata.json`, and weights files under the API model assets folder
- [ ] Add environment/config support for selecting the active damage detection model path
- [ ] Create damage detection request contract
- [ ] Create damage detection result schema
- [ ] Store model name, model version, and analyzed media file reference
- [ ] Create damage detection repository
- [ ] Create damage detection service
- [ ] Create damage detection controller
- [ ] Create damage detection routes
- [ ] Load Teachable Machine model with TensorFlow.js
- [ ] Read class labels from Teachable Machine metadata
- [ ] Preprocess uploaded/documentation image for model input
- [ ] Add endpoint to analyze an existing documentation media file
- [ ] Add endpoint to upload and analyze an image in one request if needed
- [ ] Return top prediction label
- [ ] Return all class confidence scores
- [ ] Map detected labels to severity level
- [ ] Store severity level
- [ ] Store confidence score
- [ ] Store detected damage labels
- [ ] Store suggested maintenance action
- [ ] Link detection result to asset, service request, maintenance job, and media file when available
- [ ] Add minimum confidence threshold handling
- [ ] Add fallback result when model confidence is too low

### Predictive Maintenance - Decision Tree Model

- [ ] Define predictive maintenance request contract
- [ ] Define decision tree feature contract
- [ ] Define result schema for maintenance forecast
- [ ] Create predictive maintenance repository
- [ ] Create predictive maintenance service
- [ ] Create predictive maintenance controller
- [ ] Create predictive maintenance routes
- [ ] Define decision tree input features from asset condition, criticality, service age, request priority, request frequency, repair history, and parts usage
- [ ] Create feature extraction helper from existing asset, service request, maintenance, and spare parts data
- [ ] Define initial decision tree rules for maintenance risk scoring
- [ ] Add model version field for decision tree rule revisions
- [ ] Add endpoint to trigger prediction for one asset
- [ ] Add endpoint to trigger prediction for multiple assets if needed
- [ ] Store risk level
- [ ] Store risk score
- [ ] Store predicted failure likelihood
- [ ] Store next maintenance recommendation
- [ ] Store recommended maintenance window
- [ ] Store forecast explanation metadata
- [ ] Store feature snapshot used for the prediction
- [ ] Link prediction result to asset and latest related maintenance context

### Intelligence Safety and Operations

- [ ] Add timeout handling for image analysis
- [ ] Add failure fallback logic for model loading and inference
- [ ] Add integration error logging
- [ ] Add model-not-configured error handling
- [ ] Add invalid or missing media file handling
- [ ] Add tests for low-confidence detection results
- [ ] Add tests for decision tree risk branches
- [ ] Document local model setup steps for downloaded Teachable Machine files

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
