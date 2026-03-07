# SERVI-API

Backend API for Servi Track, built with Express.js, TypeScript, and MongoDB using a layered SOA-style structure.

## Overview

This project currently includes:

- foundation setup (bootstrap, env config, DB connection, logging, validation, error handling)
- API versioning strategy (`/api/v1`)
- health check endpoint
- sample user module (controller/service/repository/model)

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- Zod (validation)
- Winston + Morgan (logging)
- Swagger (API docs)

## Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

## Installation

```bash
pnpm install
```

## Environment Variables

Create `.env` in the project root:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api
API_VERSION=v1
MONGO_URI=mongodb://localhost:27017/servi-api
CORS_ORIGIN=*
LOG_LEVEL=info

# Optional (only needed if Cloudinary features are used)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- `MONGO_URI` is required.
- API base path resolves to `API_PREFIX/API_VERSION` (default: `/api/v1`).

## Scripts

- `pnpm run dev` - run in development with `nodemon + ts-node`
- `pnpm run build` - compile TypeScript to `dist/`
- `pnpm start` - run compiled app from `dist/index.js`
- `pnpm run lint` - run ESLint with `--fix`
- `pnpm test` - run tests

## API Base

- Base URL: `http://localhost:5000/api/v1`
- Swagger UI: `http://localhost:5000/api-docs`

## Current Endpoints

- `GET /api/v1/` - server welcome
- `GET /api/v1/health/` - health status
- `GET /api/v1/user/`
- `GET /api/v1/user/:id`
- `POST /api/v1/user/`
- `PUT /api/v1/user/`
- `DELETE /api/v1/user/`
- `POST /api/v1/user/search`
- `POST /api/v1/user/upload-image/:id`

## Project Structure

```text
config/         app + env + database + third-party config
controllers/    transport layer (thin controllers)
services/       business/domain logic
repositories/   persistence/query layer
models/         mongoose schemas
middleware/     technical middleware (error, validation, logging, uploads)
helpers/        shared utilities (response, logger, pagination, etc.)
routes/         route extraction/registration
types/          shared TypeScript contracts
.orchestration/ project rules, phases, and agent guides
index.ts        app entrypoint
```

## Architecture Rules

This repository follows the orchestration docs in `.orchestration/`:

- `RULES.md` for engineering constraints
- `TODO.md` for roadmap and checklist
- `phases/PHASE_*.md` for delivery phases
- `agents/*.md` for role-specific standards

## License

ISC
