Help me implement PHASE 8 of my SERVI-API backend.

Stack:

- Express.js
- TypeScript
- MongoDB
- Mongoose
- SOA

Goal:
Build the Documentation and Upload module.

Please create:

- media file model/schema
- documentation repository
- documentation service
- documentation controller
- documentation routes
- upload middleware integration

Required features:

- validate file type and size
- upload damage photos
- upload repair completion photos
- link photos to assets
- link photos to service requests
- link photos to maintenance jobs
- store uploaded-by
- store timestamps
- store file context tags

Rules:

- do not expose unsafe file paths
- keep upload handling secure
- support future integration with cloud storage
- controller must remain thin
- service should handle file metadata and linking logic

Please include:

- suggested upload architecture
- file naming strategy
- metadata schema design
- validation rules
- code structure
- endpoint examples
