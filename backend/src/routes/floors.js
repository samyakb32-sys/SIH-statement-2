import { Router } from "express";
import db from "../db/index.js";
import { newId } from "../utils/ids.js";

const router = Router();

/** Slice a building's height into N equal floors (or accept custom per-floor heights). */
router.post("/slice", (req, res) => {
  const { buildingId, numFloors, floorHeight, startHeight = 0 } = req.body;
  const building = db.prepare("SELECT * FROM buildings WHERE id = ?").get(buildingId);
  if (!building) return res.status(404).json({ error: "Building not found" });
  if (!numFloors || numFloors < 1) return res.status(400).json({ error: "numFloors must be >= 1" });

  const height = floorHeight || (building.heightMeters ? building.heightMeters / numFloors : 3);

  db.prepare("DELETE FROM floors WHERE buildingId = ?").run(buildingId);

  const insert = db.prepare(
    `INSERT INTO floors (id, buildingId, floorNumber, minHeight, maxHeight, label) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const floors = [];
  const txn = db.transaction(() => {
    for (let i = 0; i < numFloors; i++) {
      const floorNumber = i + 1;
      const minHeight = startHeight + i * height;
      const maxHeight = minHeight + height;
      const id = newId("flr");
      insert.run(id, buildingId, floorNumber, minHeight, maxHeight, `Floor ${floorNumber}`);
      floors.push({ id, buildingId, floorNumber, minHeight, maxHeight, label: `Floor ${floorNumber}` });
    }
    db.prepare("UPDATE buildings SET heightMeters = ? WHERE id = ?").run(
      startHeight + numFloors * height,
      buildingId
    );
  });
  txn();

  res.status(201).json(floors);
});

router.get("/building/:buildingId", (req, res) => {
  const floors = db
    .prepare("SELECT * FROM floors WHERE buildingId = ? ORDER BY floorNumber ASC")
    .all(req.params.buildingId);
  res.json(floors);
});

router.get("/:id", (req, res) => {
  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(req.params.id);
  if (!floor) return res.status(404).json({ error: "Floor not found" });
  const units = db.prepare("SELECT * FROM units WHERE floorId = ? ORDER BY unitNumber ASC").all(floor.id);
  res.json({ ...floor, units: units.map((u) => ({ ...u, coordinates: u.coordinates ? JSON.parse(u.coordinates) : null })) });
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM floors WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Floor not found" });
  res.status(204).end();
});

export default router;
