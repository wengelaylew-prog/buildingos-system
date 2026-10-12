# BuildingOS

BuildingOS is a property and building operations management platform for organizing properties, buildings, units, and tenant information.

## Features

- Organization and building management
- Floors, units, and tenant records
- Role-based access and tenant-scoped operations
- Telegram Mini App authentication
- Firebase integration
- Building and unit visualization

## Tech stack

- React, TypeScript, and Vite
- Node.js and Express
- PostgreSQL and Drizzle ORM
- Firebase
- Three.js and React Three Fiber

## Getting started

### Requirements

- Node.js LTS
- npm
- A configured PostgreSQL database and any required service credentials

### Install

```bash
npm install
```

Create a local environment file using `.env.example` as a reference, then set the database and service variables required by your environment.

### Run locally

```bash
npm run dev
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the client and bundle the server |
| `npm run lint` | Run TypeScript checking |
| `npm run typecheck` | Run TypeScript checking |
| `npm test` | Run the configured 3D system test |

## Database

The database schema and Drizzle migrations are maintained in the `drizzle/` directory. Use an isolated development or test database when running database-related workflows.

## Sample data

A small synthetic dataset is available at `fixtures/buildingos-portfolio-sample.json` for demonstrations and portfolio review. It contains fictitious records and is not a production backup.

## Project status

BuildingOS is under active development. The repository provides an overview of the application's structure and implementation; available features and deployment readiness may vary by environment.
