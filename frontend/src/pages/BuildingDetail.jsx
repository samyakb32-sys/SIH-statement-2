import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Viewer3D } from "../three/Viewer3D.jsx";
import { UlpinBadge } from "../components/UlpinBadge.jsx";
import { UnitDrawPanel } from "../components/UnitDrawPanel.jsx";
import { api } from "../lib/api.js";

export default function BuildingDetail() {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const [loading, setLoading] = useState(true);
  const [footprint, setFootprint] = useState(10);

  const load = useCallback(async () => {
    const data = await api.getBuilding(id);
    setBuilding(data);
    setSelectedFloor((prev) => data.floors.find((f) => f.id === prev?.id) || data.floors[0] || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-slate-500">Loading…</div>;
  if (!building) return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 text-slate-500">Building not found.</div>;

  const unitsOnFloor = building.units.filter((u) => u.floorId === selectedFloor?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-bold text-navy-900">{building.name}</h1>
        <UlpinBadge ulpinId={building.ulpinBase} size="lg" />
      </div>
      <p className="text-slate-500 mb-8 text-sm">{building.address}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Floor list */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 h-fit">
          <h2 className="font-semibold text-navy-900 mb-3">Floors</h2>
          <ul className="space-y-1">
            {building.floors.map((floor) => (
              <li key={floor.id}>
                <button
                  onClick={() => setSelectedFloor(floor)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                    selectedFloor?.id === floor.id
                      ? "bg-navy-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{floor.label}</span>
                  <span className="text-xs opacity-70">
                    {building.units.filter((u) => u.floorId === floor.id).length} units
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 3D viewer */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy-900">3D Viewer</h2>
            <button
              onClick={() => setShowTop((v) => !v)}
              className="text-sm font-medium bg-navy-900 hover:bg-navy-800 text-white px-3 py-1.5 rounded-md"
            >
              {showTop ? "Back to 3D View" : "Top-Down View (Tag Units)"}
            </button>
          </div>

          {!showTop ? (
            <div className="h-[480px]">
              <Viewer3D
                modelUrl={building.modelUrl}
                floors={building.floors}
                units={building.units}
                selectedFloorId={selectedFloor?.id}
                onSelectFloor={setSelectedFloor}
                fallbackHeight={building.heightMeters}
                onBounds={(box) => {
                  const fp = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
                  if (fp && Number.isFinite(fp)) setFootprint(fp);
                }}
              />
            </div>
          ) : (
            selectedFloor && (
              <UnitDrawPanel
                floor={selectedFloor}
                units={unitsOnFloor}
                onCreated={load}
                worldSize={footprint}
              />
            )
          )}
        </div>
      </div>

      {/* Units table */}
      <div className="mt-10">
        <h2 className="font-semibold text-navy-900 mb-3">
          Units on {selectedFloor?.label ?? "—"}
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">3D-ULPIN</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Area (sq.m)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unitsOnFloor.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No units tagged on this floor yet. Switch to top-down view to draw one.
                  </td>
                </tr>
              )}
              {unitsOnFloor.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2 font-mono text-navy-800">{u.ulpinId}</td>
                  <td className="px-4 py-2">{u.ownerName}</td>
                  <td className="px-4 py-2 capitalize">{u.unitType}</td>
                  <td className="px-4 py-2">{u.area ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
