import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const SVG_SIZE = 480;
const HANDLE_SIZE = 10;

const TOOLS = [
  { id: "room", label: "Room", kind: "unit" },
  { id: "door", label: "Door", kind: "element" },
  { id: "window", label: "Window", kind: "element" },
  { id: "table", label: "Table", kind: "element" },
  { id: "counter", label: "Counter", kind: "element" },
  { id: "open_space", label: "Open Space", kind: "element" },
];

function unitColor(type) {
  return type === "commercial" ? "#0ea5e9" : "#22c55e";
}

const ELEMENT_COLOR = {
  door: "#92400e",
  window: "#38bdf8",
  table: "#a855f7",
  counter: "#f97316",
  open_space: "#94a3b8",
};

function colorForItem(item) {
  return item.kind === "unit" ? unitColor(item.unitType) : ELEMENT_COLOR[item.type];
}

function labelForItem(item) {
  return item.kind === "unit" ? item.ulpinId.split("-").slice(-2).join("-") : item.label || item.type;
}

/**
 * Paint-style top-down floor plan editor: pick a tool, drag to place a room
 * or element, click an existing shape to select it (drag its body to move,
 * drag a corner handle to resize), edit its details in the side panel.
 *
 * `worldSize` is the building's real footprint in metres (from the 3D
 * viewer's bounding box) so shapes drawn here line up with the 3D model.
 */
export function FloorEditor({ floor, units, elements, worldSize = 12, onChanged }) {
  const svgRef = useRef(null);
  const scale = SVG_SIZE / worldSize;

  const items = [
    ...units.map((u) => ({ ...u, kind: "unit" })),
    ...elements.map((e) => ({ ...e, kind: "element" })),
  ];

  const [tool, setTool] = useState("select");
  const [selected, setSelected] = useState(null); // { kind, id }
  const [drag, setDrag] = useState(null); // { mode: 'drawing'|'moving'|'resizing', rect, ... }
  const [pendingRoomRect, setPendingRoomRect] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [unitType, setUnitType] = useState("residential");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Editable copy of the selected room's fields — kept separate from the
  // derived `items` list (which is rebuilt fresh from props every render,
  // so mutating an item directly wouldn't stick or trigger a re-render).
  const [editForm, setEditForm] = useState({ ownerName: "", unitType: "residential", area: "" });

  function toSvgRect(coordinates) {
    const width = coordinates.width * scale;
    const height = coordinates.depth * scale;
    return {
      x: SVG_SIZE / 2 + coordinates.x * scale - width / 2,
      y: SVG_SIZE / 2 + coordinates.z * scale - height / 2,
      width,
      height,
    };
  }

  function toWorldRect(rect) {
    return {
      x: (rect.x + rect.width / 2 - SVG_SIZE / 2) / scale,
      z: (rect.y + rect.height / 2 - SVG_SIZE / 2) / scale,
      width: Math.max(rect.width / scale, 0.2),
      depth: Math.max(rect.height / scale, 0.2),
    };
  }

  function getPoint(e) {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const selectedItem = selected ? items.find((it) => it.kind === selected.kind && it.id === selected.id) : null;

  useEffect(() => {
    if (selectedItem?.kind === "unit") {
      setEditForm({
        ownerName: selectedItem.ownerName,
        unitType: selectedItem.unitType,
        area: selectedItem.area ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Capturing the pointer on the SVG itself keeps move/up events flowing to
  // it even if the cursor is dragged outside the SVG's bounds mid-drag —
  // without this, a fast drag past the edge stops delivering pointermove/up
  // and the shape is left stuck mid-drag until an unrelated click "unsticks" it.
  function capturePointer(e) {
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function handleBackgroundDown(e) {
    e.stopPropagation();
    if (tool === "select") {
      setSelected(null);
      return;
    }
    capturePointer(e);
    const p = getPoint(e);
    setSelected(null);
    setDrag({ mode: "drawing", startX: p.x, startY: p.y, rect: { x: p.x, y: p.y, width: 0, height: 0 } });
  }

  function handleShapeDown(e, item) {
    e.stopPropagation();
    capturePointer(e);
    setTool("select");
    setSelected({ kind: item.kind, id: item.id });
    const p = getPoint(e);
    const rect = toSvgRect(item.coordinates);
    setDrag({ mode: "moving", startX: p.x, startY: p.y, originRect: rect, rect });
  }

  function handleHandleDown(e, corner) {
    e.stopPropagation();
    capturePointer(e);
    const p = getPoint(e);
    const rect = toSvgRect(selectedItem.coordinates);
    setDrag({ mode: "resizing", corner, startX: p.x, startY: p.y, originRect: rect, rect });
  }

  function handlePointerMove(e) {
    if (!drag) return;
    const p = getPoint(e);

    if (drag.mode === "drawing") {
      const x = Math.min(drag.startX, p.x);
      const y = Math.min(drag.startY, p.y);
      setDrag({ ...drag, rect: { x, y, width: Math.abs(p.x - drag.startX), height: Math.abs(p.y - drag.startY) } });
    } else if (drag.mode === "moving") {
      const dx = p.x - drag.startX;
      const dy = p.y - drag.startY;
      setDrag({ ...drag, rect: { ...drag.originRect, x: drag.originRect.x + dx, y: drag.originRect.y + dy } });
    } else if (drag.mode === "resizing") {
      const o = drag.originRect;
      const fixedX = drag.corner.includes("w") ? o.x + o.width : o.x;
      const fixedY = drag.corner.includes("n") ? o.y + o.height : o.y;
      const x = Math.min(fixedX, p.x);
      const y = Math.min(fixedY, p.y);
      setDrag({ ...drag, rect: { x, y, width: Math.abs(p.x - fixedX), height: Math.abs(p.y - fixedY) } });
    }
  }

  async function handlePointerUp() {
    if (!drag) return;

    if (drag.mode === "drawing") {
      if (drag.rect.width > 6 && drag.rect.height > 6) {
        if (tool === "room") {
          setPendingRoomRect(drag.rect);
        } else {
          await createElement(tool, drag.rect);
        }
      }
      setDrag(null);
      return;
    }

    // moving or resizing an existing item — skip the write entirely if a
    // click just selected it without actually dragging (originRect unchanged)
    const moved =
      drag.originRect &&
      (Math.abs(drag.rect.x - drag.originRect.x) > 1 ||
        Math.abs(drag.rect.y - drag.originRect.y) > 1 ||
        Math.abs(drag.rect.width - drag.originRect.width) > 1 ||
        Math.abs(drag.rect.height - drag.originRect.height) > 1);

    if (moved && drag.rect.width > 6 && drag.rect.height > 6 && selected) {
      const coordinates = toWorldRect(drag.rect);
      try {
        if (selected.kind === "unit") {
          await api.updateUnit(selected.id, { coordinates });
        } else {
          await api.updateElement(selected.id, { coordinates });
        }
        onChanged?.();
      } catch (err) {
        setError(err.message);
      }
    }
    setDrag(null);
  }

  async function createElement(type, svgRect) {
    setError(null);
    try {
      const countOfType = elements.filter((e) => e.type === type).length;
      const label = `${TOOLS.find((t) => t.id === type).label} ${countOfType + 1}`;
      await api.createElement({ floorId: floor.id, type, label, coordinates: toWorldRect(svgRect) });
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveRoom() {
    if (!ownerName) {
      setError("Owner name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const coordinates = toWorldRect(pendingRoomRect);
      await api.createUnit({
        floorId: floor.id,
        ownerName,
        area: area ? Number(area) : Math.round(coordinates.width * coordinates.depth * 10) / 10,
        unitType,
        coordinates,
      });
      setPendingRoomRect(null);
      setOwnerName("");
      setArea("");
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateRoom() {
    if (!selectedItem || selectedItem.kind !== "unit") return;
    if (!editForm.ownerName) {
      setError("Owner name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateUnit(selectedItem.id, {
        ownerName: editForm.ownerName,
        unitType: editForm.unitType,
        area: editForm.area === "" ? null : Number(editForm.area),
      });
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      if (selected.kind === "unit") await api.deleteUnit(selected.id);
      else await api.deleteElement(selected.id);
      setSelected(null);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const previewRect =
    drag?.mode === "drawing"
      ? drag.rect
      : drag && (drag.mode === "moving" || drag.mode === "resizing")
      ? drag.rect
      : null;

  const selectedSvgRect = selectedItem && !previewRect ? toSvgRect(selectedItem.coordinates) : null;
  const handleRect = previewRect || selectedSvgRect;

  return (
    <div className="grid md:grid-cols-[1fr_260px] gap-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button
            onClick={() => {
              setTool("select");
              setSelected(null);
            }}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-md border ${
              tool === "select"
                ? "bg-navy-900 text-white border-navy-900"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            Select
          </button>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTool(t.id);
                setSelected(null);
              }}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 ${
                tool === t.id
                  ? "bg-navy-900 text-white border-navy-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ background: t.kind === "unit" ? "#22c55e" : ELEMENT_COLOR[t.id] }}
              />
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mb-2">
          {tool === "select"
            ? "Click a shape to select it — drag its body to move, drag a corner to resize."
            : `Click and drag to place a ${TOOLS.find((t) => t.id === tool)?.label.toLowerCase()} on ${floor.label}.`}
        </p>
        <svg
          ref={svgRef}
          width={SVG_SIZE}
          height={SVG_SIZE}
          className="bg-slate-100 rounded select-none touch-none"
          style={{ cursor: tool === "select" ? "default" : "crosshair" }}
          onPointerDown={handleBackgroundDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {Array.from({ length: Math.round(worldSize) + 1 }).map((_, i) => (
            <line key={`v${i}`} x1={i * scale} y1={0} x2={i * scale} y2={SVG_SIZE} stroke="#e2e8f0" strokeWidth={1} />
          ))}
          {Array.from({ length: Math.round(worldSize) + 1 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * scale} x2={SVG_SIZE} y2={i * scale} stroke="#e2e8f0" strokeWidth={1} />
          ))}

          {items.map((item) => {
            const isSelected = selected?.kind === item.kind && selected?.id === item.id;
            const rect = isSelected && previewRect ? previewRect : toSvgRect(item.coordinates);
            const color = colorForItem(item);
            return (
              <g key={`${item.kind}-${item.id}`} onPointerDown={(e) => handleShapeDown(e, item)} style={{ cursor: "move" }}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={color}
                  fillOpacity={item.type === "open_space" ? 0.1 : 0.35}
                  stroke={isSelected ? "#0f1f38" : color}
                  strokeWidth={isSelected ? 2.5 : 2}
                  strokeDasharray={item.type === "open_space" ? "4 3" : undefined}
                />
                <text x={rect.x + 4} y={rect.y + 14} fontSize={10} fill="#0f1f38" fontFamily="monospace">
                  {labelForItem(item)}
                </text>
              </g>
            );
          })}

          {drag?.mode === "drawing" && (
            <rect
              x={drag.rect.x}
              y={drag.rect.y}
              width={drag.rect.width}
              height={drag.rect.height}
              fill="#f59e0b"
              fillOpacity={0.3}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}

          {handleRect &&
            selected &&
            !pendingRoomRect &&
            [
              { id: "nw", x: handleRect.x, y: handleRect.y },
              { id: "ne", x: handleRect.x + handleRect.width, y: handleRect.y },
              { id: "sw", x: handleRect.x, y: handleRect.y + handleRect.height },
              { id: "se", x: handleRect.x + handleRect.width, y: handleRect.y + handleRect.height },
            ].map((h) => (
              <rect
                key={h.id}
                x={h.x - HANDLE_SIZE / 2}
                y={h.y - HANDLE_SIZE / 2}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill="#f59e0b"
                stroke="#0f1f38"
                strokeWidth={1.5}
                style={{ cursor: `${h.id}-resize` }}
                onPointerDown={(e) => handleHandleDown(e, h.id)}
              />
            ))}
        </svg>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 h-fit space-y-3">
        {pendingRoomRect ? (
          <>
            <h3 className="font-semibold text-navy-900 text-sm">New Room</h3>
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
                onClick={handleSaveRoom}
                disabled={saving}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-navy-950 text-sm font-semibold py-2 rounded-md"
              >
                {saving ? "Saving…" : "Save Room"}
              </button>
              <button
                onClick={() => setPendingRoomRect(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3"
              >
                Cancel
              </button>
            </div>
          </>
        ) : selectedItem ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-navy-900 text-sm">
                {selectedItem.kind === "unit" ? "Room" : TOOLS.find((t) => t.id === selectedItem.type)?.label}
              </h3>
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: colorForItem(selectedItem) }}
              />
            </div>

            {selectedItem.kind === "unit" ? (
              <>
                <p className="text-xs font-mono text-slate-500">{selectedItem.ulpinId}</p>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Owner name</label>
                  <input
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit type</label>
                  <select
                    value={editForm.unitType}
                    onChange={(e) => setEditForm({ ...editForm, unitType: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Area (sq.m)</label>
                  <input
                    type="number"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateRoom}
                    disabled={saving}
                    className="flex-1 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-md"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={saving}
                    className="text-sm font-medium text-red-600 hover:text-red-700 px-3"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500">{selectedItem.label}</p>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  onClick={handleDeleteSelected}
                  disabled={saving}
                  className="w-full text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 py-2 rounded-md"
                >
                  {saving ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <h3 className="font-semibold text-navy-900 text-sm">Editor</h3>
            <p className="text-xs text-slate-400">
              Pick a tool above and drag on the grid to place it, or click an existing shape to edit it.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
