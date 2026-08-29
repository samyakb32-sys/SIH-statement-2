import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import buildingsRouter from "./routes/buildings.js";
import floorsRouter from "./routes/floors.js";
import unitsRouter from "./routes/units.js";
import statsRouter from "./routes/stats.js";
import uploadRouter from "./routes/upload.js";
import "./db/index.js";
import { seedIfEmpty } from "./db/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 4000;

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

app.listen(PORT, () => {
  console.log(`3D ULPIN backend listening on http://localhost:${PORT}`);
});
