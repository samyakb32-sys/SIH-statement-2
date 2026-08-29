import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, safeName);
  },
});

const allowedExt = new Set([".glb", ".gltf", ".obj"]);

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.has(ext)) return cb(new Error("Only .glb, .gltf, .obj files are allowed"));
    cb(null, true);
  },
});

const router = Router();

router.post("/", upload.single("model"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});

export default router;
