import express from "express";
import cors from "cors";
import fs from "node:fs";

import buildingsRouter from "./routes/buildings.js";
import floorsRouter from "./routes/floors.js";
import unitsRouter from "./routes/units.js";
import statsRouter from "./routes/stats.js";
import uploadRouter, { uploadsDir } from "./routes/upload.js";
import "./db/index.js";
import { seedIfEmpty } from "./db/seed.js";

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/buildings", buildingsRouter);
app.use("/api/floors", floorsRouter);
app.use("/api/units", unitsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/upload", uploadRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

seedIfEmpty();

export default app;
