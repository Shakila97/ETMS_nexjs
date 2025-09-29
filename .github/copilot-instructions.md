# Copilot Instructions for ETMS Codebase

## Overview
This workspace contains a full-stack Employee Task Management System (ETMS) with a Next.js frontend (`etms-frontend`) and a Node.js/Express backend (`etms-backend`). The architecture is modular, separating concerns between UI, API, business logic, and data models.

## Architecture & Data Flow
- **Frontend (`etms-frontend`)**: Built with Next.js (TypeScript). Uses the `app/` directory for routing and API calls. UI components are organized under `components/`, with modules for each feature (attendance, employees, leave, etc.). Data fetching and business logic are handled in `lib/` and `hooks/`.
- **Backend (`etms-backend`)**: Node.js/Express REST API. Routes are defined in `routes/`, controllers in `controllers/`, and models in `models/`. Middleware for auth, logging, validation, and error handling is in `middleware/`. Utility functions are in `utils/`.
- **Data Flow**: Frontend calls backend APIs via endpoints defined in `etms-backend/routes/`. Backend interacts with models for CRUD operations.

## Developer Workflows
- **Frontend**:
  - Start: `pnpm dev` in `etms-frontend/`
  - Build: `pnpm build`
  - Lint: `pnpm lint`
  - Type-check: `pnpm typecheck`
- **Backend**:
  - Start: `npm start` or `node server.js` in `etms-backend/`
  - Logs: Check `etms-backend/logs/` for access, error, security, and slow logs

## Project-Specific Conventions
- **API Layer**: Frontend API calls are organized by feature in `app/api/`. Backend routes mirror these features for clear mapping.
- **Auth**: JWT-based authentication. Tokens generated in `etms-backend/utils/generateToken.js` and validated in middleware.
- **Error Handling**: Centralized in `etms-backend/middleware/errorHandler.js`.
- **Validation**: Request validation via `etms-backend/middleware/validation.js` and `utils/validators.js`.
- **Logging**: Custom logging middleware writes to multiple log files for security and performance monitoring.
- **UI Components**: Shared UI elements are in `components/ui/`. Feature modules are in `components/modules/`.

## Integration Points & Dependencies
- **Frontend**: Next.js, TypeScript, pnpm, custom hooks, modular components
- **Backend**: Express, JWT, custom middleware, modular controllers/models
- **Cross-Component Communication**: API endpoints (REST) are the main integration point. Keep endpoint contracts stable.

## Key Files & Directories
- `etms-frontend/app/api/` — Frontend API layer
- `etms-frontend/components/` — UI and feature modules
- `etms-frontend/lib/` — Data and business logic utilities
- `etms-backend/routes/` — API endpoints
- `etms-backend/controllers/` — Business logic
- `etms-backend/models/` — Data models
- `etms-backend/middleware/` — Auth, logging, validation, error handling
- `etms-backend/utils/` — Utility functions
- `etms-backend/logs/` — Log files

## Examples
- To add a new feature, create corresponding modules in both frontend (`components/modules/`, `app/api/`) and backend (`routes/`, `controllers/`, `models/`).
- For authentication, use the JWT utilities and middleware provided.
- For debugging, check backend logs and use frontend type-check/lint commands.

---
For questions or unclear conventions, review the structure above and check the relevant directories for examples.
