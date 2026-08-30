import { Router } from "express";
import db from "../db/index.js";
import { newId } from "../utils/ids.js";
import { generateUnitUlpin } from "../utils/ulpin.js";

const router = Router();

function serialize(u) {
  return { ...u, coordinates: u.coordinates ? JSON.parse(u.coordinates) : null };
}

router.get("/", (req, res) => {
  const { owner, ulpinId } = req.query;
  let rows;
  if (ulpinId) {
    rows = db.prepare("SELECT * FROM units WHERE ulpinId = ?").all(ulpinId);
  } else if (owner) {
    rows = db.prepare("SELECT * FROM units WHERE ownerName LIKE ? ORDER BY createdAt DESC").all(`%${owner}%`);
  } else {
    rows = db.prepare("SELECT * FROM units ORDER BY createdAt DESC").all();
  }
  res.json(rows.map(serialize));
});

router.get("/search/:ulpinId", (req, res) => {
  const unit = db.prepare("SELECT * FROM units WHERE ulpinId = ?").get(req.params.ulpinId);
  if (!unit) return res.status(404).json({ error: "No unit found with that 3D-ULPIN" });

  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(unit.floorId);
  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(unit.buildingId);

  res.json({ unit: serialize(unit), floor, building });
});

router.post("/", (req, res) => {
  const { floorId, ownerName, area, unitType, coordinates } = req.body;
  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(floorId);
  if (!floor) return res.status(404).json({ error: "Floor not found" });
  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(floor.buildingId);
  if (!ownerName) return res.status(400).json({ error: "ownerName is required" });

  // MAX(unitNumber), not COUNT(*): if a unit was ever deleted, COUNT would
  // reissue a lower unitNumber that collides with a surviving unit's
  // ulpinId (UNIQUE constraint) and the insert below would fail outright.
  const maxRow = db
    .prepare("SELECT MAX(unitNumber) as n FROM units WHERE floorId = ?")
    .get(floorId);
  const unitNumber = (maxRow.n || 0) + 1;
  const ulpinId = generateUnitUlpin(building.ulpinBase, floor.floorNumber, unitNumber);

  const id = newId("unit");
  db.prepare(
    `INSERT INTO units (id, ulpinId, floorId, buildingId, unitNumber, ownerName, area, unitType, coordinates)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    ulpinId,
    floorId,
    building.id,
    unitNumber,
    ownerName,
    area || null,
    unitType || "residential",
    coordinates ? JSON.stringify(coordinates) : null
  );

  res.status(201).json(serialize(db.prepare("SELECT * FROM units WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const unit = db.prepare("SELECT * FROM units WHERE id = ?").get(req.params.id);
  if (!unit) return res.status(404).json({ error: "Unit not found" });

  const { ownerName, area, unitType, coordinates } = req.body;
  db.prepare(
    `UPDATE units SET ownerName = ?, area = ?, unitType = ?, coordinates = ? WHERE id = ?`
  ).run(
    ownerName ?? unit.ownerName,
    area ?? unit.area,
    unitType ?? unit.unitType,
    coordinates ? JSON.stringify(coordinates) : unit.coordinates,
    unit.id
  );

  res.json(serialize(db.prepare("SELECT * FROM units WHERE id = ?").get(unit.id)));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM units WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Unit not found" });
  res.status(204).end();
});

export default router;
