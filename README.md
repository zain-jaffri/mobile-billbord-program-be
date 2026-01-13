# mobile-billboard-program-be

Modernized backend architecture for the Mobile Billboard Program. This codebase is a Clean Architecture / MVC split built on Express + TypeScript + Sequelize, with a strict service/controller separation and schema-aligned models.

## What This Project Is

- **Express + TypeScript (strict)** API service
- **Sequelize ORM** for all database access
- **Postgres (Supabase)** connection via env config
- **Clean Architecture** layering (routes → controllers → services → models)
- **Zod validation** for type-safe inputs
- **Centralized logging + error handling**

## High-Level Architecture

- **Routes**: Define HTTP endpoints and validation.
- **Controllers**: Request/response handling only.
- **Services**: Business logic and orchestration (transactions, workflow rules).
- **Models**: Sequelize models aligned to the database schema.
- **Shared**: Database init, middleware, errors, utilities.

This separation keeps business logic testable and prevents controllers from owning behavior.

## Directory Structure

```
src/
  app.ts                    # Express app wiring
  server.ts                 # Startup + DB init

  modules/
    drivers/
      driver.model.ts
      driver.service.ts
      driver.controller.ts
      driver.routes.ts
      driver.dto.ts

    vehicles/
      vehicle.model.ts
      vehicle.service.ts
      vehicle.controller.ts
      vehicle.routes.ts
      vehicle.dto.ts

    deployments/
      deployment.model.ts
      deployment.service.ts
      deployment.controller.ts
      deployment.routes.ts
      deployment.dto.ts

    qrCodes/
      qrCode.model.ts
      qrCode.service.ts
      qrCode.controller.ts
      qrCode.routes.ts
      qrCode.dto.ts

    odometer/
      odometer.model.ts
      odometer.service.ts
      odometer.controller.ts
      odometer.routes.ts
      odometer.dto.ts

    submissions/
      submission.model.ts
      submission.service.ts
      submission.controller.ts
      submission.routes.ts
      submission.dto.ts

    payments/
      payment.model.ts
      payment.service.ts
      payment.controller.ts
      payment.routes.ts
      payment.dto.ts

  shared/
    config.ts               # Env-based config
    sequelize.ts            # Sequelize instance
    db.ts                   # Model associations + init
    errors.ts               # Error types
    middleware/
      asyncHandler.ts       # Async error wrapper
      errorHandler.ts       # Centralized error response
      requestContext.ts     # User context from headers
      requestLogger.ts      # Detailed request/response logging
      validate.ts           # Zod request validation
    utils/
      zapier.ts             # Zapier webhook utility
```

## Key Domain Rules Preserved

- Creating a new driver also creates a vehicle and optionally a deployment and odometer reading.
- Returning driver workflow only updates fields that actually changed.
- Deployments are event-based and append-only; active QR is derived from assign without later unassign.
- Inactive drivers trigger cascade unassignments.
- Odometer readings are historical; corrections are new entries.
- Form submissions link to QR and indirectly to drivers.
- Payments can be assigned retroactively.
- Zapier fires only after successful transaction commit.

## Database Integration

Connection is initialized at startup:

- `src/shared/sequelize.ts` creates the Sequelize instance.
- `src/shared/db.ts` defines associations and runs `sequelize.authenticate()`.
- `src/server.ts` calls `initDb()` before listening.

### Required Environment Variables

```
DB_HOST=
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=postgres
DB_SSL=true
NODE_ENV=development
PORT=3000
```

## Request/Response Logging

Every request is logged with:
- method, path, params, query, headers, body
- response status and duration
- error stack traces

Logger lives in `src/shared/middleware/requestLogger.ts` and is wired in `src/app.ts`.

## Validation

Zod schemas are defined in each module’s `*.dto.ts` and enforced via `validate` middleware.

Example:
- `src/modules/drivers/driver.dto.ts`
- `src/modules/deployments/deployment.dto.ts`

## Error Handling

Centralized error handling lives in `src/shared/middleware/errorHandler.ts`:

- Known errors return JSON with status code
- Unknown errors return 500
- Errors are logged with requestId

## Running the Project

```
npm install
npm run dev
```

## Notes / Gaps

- Migrations are not yet included in this repo. If you want, we can generate Sequelize migrations to match the current schema.
- This project currently logs full request bodies; if you need redaction, we can add a sanitizer.

## Supabase Schema Setup

If you need to replicate the database schema in Supabase, use the Postgres schema SQL provided earlier. Let me know if you want it embedded here or generated as a migration file.
