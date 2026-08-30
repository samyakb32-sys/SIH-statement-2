import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Vercel functions only allow writes under /tmp; local dev keeps the DB in backend/data.
const dataDir = process.env.VERCEL ? "/tmp/ulpin-data" : path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "ulpin.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS buildings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ulpinBase TEXT NOT NULL UNIQUE,
    address TEXT,
    modelUrl TEXT,
    heightMeters REAL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS floors (
    id TEXT PRIMARY KEY,
    buildingId TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floorNumber INTEGER NOT NULL,
    minHeight REAL NOT NULL,
    maxHeight REAL NOT NULL,
    label TEXT,
    UNIQUE(buildingId, floorNumber)
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    ulpinId TEXT NOT NULL UNIQUE,
    floorId TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    buildingId TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    unitNumber INTEGER NOT NULL,
    ownerName TEXT NOT NULL,
    area REAL,
    unitType TEXT DEFAULT 'residential',
    coordinates TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Non-ownable floor plan elements: doors, windows, tables, counters, open-space
  -- markers. Kept separate from units, which carry a 3D-ULPIN and an owner —
  -- these don't (a door isn't a parcel of property).
  CREATE TABLE IF NOT EXISTS elements (
    id TEXT PRIMARY KEY,
    floorId TEXT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    buildingId TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT,
    coordinates TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
