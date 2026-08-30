import { Router } from "express";
import db from "../db/index.js";
import { newId } from "../utils/ids.js";
import { generateBuildingUlpin } from "../utils/ulpin.js";

const router = Router();

router.get("/", (req, res) => {
  const buildings = db.prepare("SELECT * FROM buildings ORDER BY createdAt DESC").all();
  res.json(buildings);
});

router.get("/:id", (req, res) => {
  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(req.params.id);
  if (!building) return res.status(404).json({ error: "Building not found" });

  const floors = db
    .prepare("SELECT * FROM floors WHERE buildingId = ? ORDER BY floorNumber ASC")
    .all(building.id);

  const units = db
    .prepare("SELECT * FROM units WHERE buildingId = ? ORDER BY floorId, unitNumber ASC")
    .all(building.id)
    .map((u) => ({ ...u, coordinates: u.coordinates ? JSON.parse(u.coordinates) : null }));

  const elements = db
    .prepare("SELECT * FROM elements WHERE buildingId = ? ORDER BY createdAt ASC")
    .all(building.id)
    .map((e) => ({ ...e, coordinates: JSON.parse(e.coordinates) }));

  res.json({ ...building, floors, units, elements });
});

router.post("/", (req, res) => {
  const { name, address, modelUrl, heightMeters, stateCode } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const countRow = db.prepare("SELECT COUNT(*) as n FROM buildings").get();
  const ulpinBase = generateBuildingUlpin(stateCode, countRow.n + 1);
  const id = newId("bldg");

  db.prepare(
    `INSERT INTO buildings (id, name, ulpinBase, address, modelUrl, heightMeters)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, ulpinBase, address || null, modelUrl || null, heightMeters || 0);

  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(id);
  res.status(201).json(building);
});

router.patch("/:id", (req, res) => {
  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(req.params.id);
  if (!building) return res.status(404).json({ error: "Building not found" });

  const { name, address, modelUrl, heightMeters } = req.body;
  db.prepare(
    `UPDATE buildings SET name = ?, address = ?, modelUrl = ?, heightMeters = ? WHERE id = ?`
  ).run(
    name ?? building.name,
    address ?? building.address,
    modelUrl ?? building.modelUrl,
    heightMeters ?? building.heightMeters,
    building.id
  );

  res.json(db.prepare("SELECT * FROM buildings WHERE id = ?").get(building.id));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM buildings WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Building not found" });
  res.status(204).end();
});

export default router;
