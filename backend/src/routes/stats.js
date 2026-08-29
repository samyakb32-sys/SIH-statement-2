import { Router } from "express";
import db from "../db/index.js";

const router = Router();

router.get("/", (req, res) => {
  const buildings = db.prepare("SELECT COUNT(*) as n FROM buildings").get().n;
  const floors = db.prepare("SELECT COUNT(*) as n FROM floors").get().n;
  const units = db.prepare("SELECT COUNT(*) as n FROM units").get().n;
  const owners = db.prepare("SELECT COUNT(DISTINCT ownerName) as n FROM units").get().n;
  res.json({ buildings, floors, units, owners });
});

export default router;
