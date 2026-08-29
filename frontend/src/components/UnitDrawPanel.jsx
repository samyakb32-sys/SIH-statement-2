import { useRef, useState } from "react";
import { api } from "../lib/api.js";

const SVG_SIZE = 480;
const WORLD_SIZE = 24; // metres represented across the SVG canvas
const SCALE = SVG_SIZE / WORLD_SIZE;

function toWorld(px) {
  return (px - SVG_SIZE / 2) / SCALE;
}

function unitTypeColor(type) {
  return type === "commercial" ? "#0ea5e9" : "#22c55e";
}

export function UnitDrawPanel({ floor, units, onCreated }) {
  const svgRef = useRef(null);
  const [drawing, setDrawing] = useState(null); // {startX, startY, x, y, width, height}
  const [pendingRect, setPendingRect] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [unitType, setUnitType] = useState("residential");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function getPoint(e) {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e) {
    const { x, y } = getPoint(e);
    setDrawing({ startX: x, startY: y, x, y, width: 0, height: 0 });
    setPendingRect(null);
  }

  function handlePointerMove(e) {
    if (!drawing) return;
    const { x, y } = getPoint(e);
    const rectX = Math.min(drawing.startX, x);
    const rectY = Math.min(drawing.startY, y);
    setDrawing({
      ...drawing,
      x: rectX,
      y: rectY,
      width: Math.abs(x - drawing.startX),
      height: Math.abs(y - drawing.startY),
    });
  }

  function handlePointerUp() {
    if (drawing && drawing.width > 8 && drawing.height > 8) {
      setPendingRect(drawing);
    }
    setDrawing(null);
  }

  async function handleSaveUnit() {
    if (!ownerName) {
      setError("Owner name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const worldWidth = pendingRect.width / SCALE;
      const worldDepth = pendingRect.height / SCALE;
      const worldX = toWorld(pendingRect.x + pendingRect.width / 2);
      const worldZ = toWorld(pendingRect.y + pendingRect.height / 2);

      await api.createUnit({
        floorId: floor.id,
        ownerName,
        area: area ? Number(area) : Math.round(worldWidth * worldDepth * 10) / 10,
        unitType,
        coordinates: { x: worldX, z: worldZ, width: worldWidth, depth: worldDepth },
      });

      setPendingRect(null);
      setOwnerName("");
      setArea("");
      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const activeRect = drawing || pendingRect;

  return (
    <div className="grid md:grid-cols-[1fr_260px] gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-2">
          Click and drag to draw a unit boundary on <strong>{floor.label}</strong> (top-down view).
        </p>
        <svg
          ref={svgRef}
          width={SVG_SIZE}
          height={SVG_SIZE}
          className="bg-slate-100 rounded cursor-crosshair select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {Array.from({ length: WORLD_SIZE + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * SCALE}
              y1={0}
              x2={i * SCALE}
              y2={SVG_SIZE}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: WORLD_SIZE + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * SCALE}
              x2={SVG_SIZE}
              y2={i * SCALE}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          ))}

          {units.map((u) => {
            if (!u.coordinates) return null;
            const w = u.coordinates.width * SCALE;
            const h = u.coordinates.depth * SCALE;
            const x = SVG_SIZE / 2 + u.coordinates.x * SCALE - w / 2;
            const y = SVG_SIZE / 2 + u.coordinates.z * SCALE - h / 2;
            return (
              <g key={u.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={unitTypeColor(u.unitType)}
                  fillOpacity={0.35}
                  stroke={unitTypeColor(u.unitType)}
                  strokeWidth={2}
                />
                <text x={x + 4} y={y + 16} fontSize={10} fill="#0f1f38" fontFamily="monospace">
                  {u.ulpinId.split("-").slice(-2).join("-")}
                </text>
              </g>
            );
          })}

          {activeRect && (
            <rect
              x={activeRect.x}
              y={activeRect.y}
              width={activeRect.width}
              height={activeRect.height}
              fill="#f59e0b"
              fillOpacity={0.3}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}
        </svg>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 h-fit space-y-3">
        <h3 className="font-semibold text-navy-900 text-sm">New Unit</h3>
        {!pendingRect && <p className="text-xs text-slate-400">Draw a rectangle to start tagging a unit.</p>}
        {pendingRect && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Owner name</label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                placeholder="e.g. Ramesh Iyer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit type</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Area (sq.m, optional)</label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                type="number"
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                placeholder="auto-calculated"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSaveUnit}
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-navy-950 text-sm font-semibold py-2 rounded-md"
              >
                {saving ? "Saving…" : "Save Unit"}
              </button>
              <button
                onClick={() => setPendingRect(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
