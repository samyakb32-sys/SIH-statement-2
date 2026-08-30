import { Router } from "express";
import db from "../db/index.js";
import { newId } from "../utils/ids.js";

const ALLOWED_TYPES = new Set(["door", "window", "table", "counter", "open_space"]);

function serialize(e) {
  return { ...e, coordinates: JSON.parse(e.coordinates) };
}

const router = Router();

router.get("/", (req, res) => {
  const { floorId } = req.query;
  const rows = floorId
    ? db.prepare("SELECT * FROM elements WHERE floorId = ? ORDER BY createdAt ASC").all(floorId)
    : db.prepare("SELECT * FROM elements ORDER BY createdAt ASC").all();
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { floorId, type, label, coordinates } = req.body;
  if (!ALLOWED_TYPES.has(type)) {
    return res.status(400).json({ error: `type must be one of: ${[...ALLOWED_TYPES].join(", ")}` });
  }
  if (!coordinates) return res.status(400).json({ error: "coordinates is required" });

  const floor = db.prepare("SELECT * FROM floors WHERE id = ?").get(floorId);
  if (!floor) return res.status(404).json({ error: "Floor not found" });

  const id = newId("elem");
  db.prepare(
    `INSERT INTO elements (id, floorId, buildingId, type, label, coordinates) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, floorId, floor.buildingId, type, label || null, JSON.stringify(coordinates));

  res.status(201).json(serialize(db.prepare("SELECT * FROM elements WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const element = db.prepare("SELECT * FROM elements WHERE id = ?").get(req.params.id);
  if (!element) return res.status(404).json({ error: "Element not found" });

  const { label, coordinates } = req.body;
  db.prepare("UPDATE elements SET label = ?, coordinates = ? WHERE id = ?").run(
    label ?? element.label,
    coordinates ? JSON.stringify(coordinates) : element.coordinates,
    element.id
  );

  res.json(serialize(db.prepare("SELECT * FROM elements WHERE id = ?").get(element.id)));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM elements WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Element not found" });
  res.status(204).end();
});

export default router;
