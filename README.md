# BuildingOS

BuildingOS is a property and building operations management application. This repository contains a React/TypeScript client and a Node.js/Express server, with database access and migrations managed through Drizzle ORM.

## Project areas

The codebase includes modules and interfaces for:
- Organizations, buildings, floors, units, and tenant records
- Role-based access and tenant-scoped operations
- Telegram Mini App authentication flows
- Firebase integration
- Building/unit visualization and related UI components

These bullets describe areas represented in the repository; they are not a guarantee that every workflow has been independently verified in production.

## Technology

- React, TypeScript, Vite
- Node.js and Express
- PostgreSQL with Drizzle ORM
- Firebase SDKs
- Three.js and React Three Fiber ecosystem components where used by the UI

## Getting started

1. Install a supported Node.js LTS release and npm.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the environment variables required by the server, database, Firebase, and any enabled authentication integrations. Keep real credentials in a local environment file or secret manager; never commit secrets or production data.
4. Start the development server:

   ```bash
   npm run dev
   ```

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the client and bundle the server |
| `npm run lint` | Run TypeScript checking |
| `npm run typecheck` | Run TypeScript checking |
| `npm test` | Run the configured 3D system test |

**Test safety:** review test configuration before running tests. Run integration tests only against an isolated test database, never a production database.

## Database and deployment

Database schema and migration files are maintained in the repository. Review the relevant environment configuration and deployment documentation before attempting a deployment. This portfolio cleanup does not change production code, database migrations, or deployment configuration.

## Sample data and privacy

The file `fixtures/buildingos-portfolio-sample.json` contains synthetic example data for portfolio/demo purposes. It is not a production backup and must not be used to restore a real environment.

Real database backups, personal information, tokens, credentials, and environment files must remain outside the public repository. If a real backup has previously been committed, deleting the current file does not remove it from Git history; history cleanup requires a separately reviewed and authorized operation.

## Project status

This repository is presented as a software project and code sample. Verify the current build, test, security, and deployment state in your own environment before relying on it operationally.
