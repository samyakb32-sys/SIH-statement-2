# 3D ULPIN — Vertical Property Mapping (SIH26011)

A prototype web application that extends India's 2D ULPIN (Unique Land Parcel
Identification Number) system into the vertical dimension — mapping floors
and units inside a multi-storey building, not just the land parcel beneath
it.

This is a **hackathon prototype**, built to demonstrate an end-to-end flow:
upload a 3D building scan → slice it into floors → tag units → generate a
unique 3D-ULPIN per unit → search and visualize ownership in 3D.

## Tech stack

- **Frontend**: React + Vite + Tailwind CSS, 3D viewer via Three.js
  (`@react-three/fiber` + `@react-three/drei`)
- **Backend**: Node.js + Express
- **Database**: SQLite via `better-sqlite3` (zero-setup, stands in for
  PostGIS in a production system)
- **3D models**: manually exported `.glb` / `.gltf` / `.obj` files (e.g. from
  the KIRI Engine app). There is no live KIRI API integration — this is a
  static file upload.

## Project structure

```
backend/    Express API + SQLite DB + seed data
frontend/   React + Vite app, Three.js viewer
```

## Running locally

Requires Node.js 18+.

### 1. Backend

```bash
cd backend
npm install
npm start        # or: npm run dev  (auto-restarts on changes)
```

Starts the API on `http://localhost:4000`. On first run it seeds the SQLite
database (`backend/data/ulpin.db`) with a demo building — "College Building,
Nagpur" — with 5 floors and 2–3 units per floor, dummy owners, and
auto-generated 3D-ULPIN IDs (base `MH27-BUILD-0001`).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Starts the app on `http://localhost:5173`, proxying `/api` and `/uploads`
requests to the backend.

Open `http://localhost:5173` in your browser. Try searching for
`MH27-BUILD-0001-F01-U01` on the Search page to see the seeded demo unit.

## Core flows

1. **Landing page** — explains the 2D vs 3D ULPIN problem/solution, shows
   live stats pulled from the database.
2. **Upload Building** (`/upload`) — drag & drop a `.glb`/`.gltf`/`.obj`
   file (or skip it and use the placeholder block), set a floor count, and
   save. This slices the model's bounding-box height into N equal floors.
3. **Building Detail** (`/buildings/:id`) — pick a floor from the sidebar to
   highlight it in the 3D viewer, or switch to the top-down view to
   click-and-drag rectangles marking individual units, assign an owner, and
   save. Each save auto-generates a 3D-ULPIN via
   `backend/src/utils/ulpin.js`.
4. **Search ULPIN** (`/search`) — look up a unit by its full 3D-ULPIN ID;
   shows owner/floor/building details and highlights that exact unit in the
   3D viewer.
5. **Owner Dashboard** (`/owners`) — list every unit registered to a given
   owner name, across buildings.

## The ID scheme

```
[Existing 2D ULPIN base]-F[FloorNumber]-U[UnitNumber]
Example: MH27-BUILD-0142-F05-U02
```

See `backend/src/utils/ulpin.js` for the (deliberately simple,
well-commented) generation logic — this is the key piece for judges to
inspect.

## Out of scope for this prototype

- No real authentication (no login system)
- No live KIRI Engine API integration (manual file export/upload only)
- No payments, no production deployment config
- No real georeferencing/GPS — building position is arbitrary/local

## Architecture summary (for your presentation)

3D ULPIN is a three-tier web app: a React/Three.js frontend renders an
uploaded 3D building scan and lets a surveyor slice it into floors and draw
unit boundaries in a top-down 2D projection, while an Express + SQLite
backend stores buildings, floors, and units as normalized records and derives
each unit's 3D-ULPIN by appending a floor and unit suffix to the parcel's
existing 2D ULPIN — keeping the new identifier fully backward-compatible
with today's land records. The demo swaps PostGIS/production infra for
SQLite and a static file upload in place of live KIRI Engine integration,
but the data model (building → floor → unit, each independently queryable
and addressable in 3D space) is designed to map directly onto a production
GIS stack.
