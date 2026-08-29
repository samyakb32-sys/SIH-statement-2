import { useState } from "react";
import { Link } from "react-router-dom";
import { Viewer3D } from "../three/Viewer3D.jsx";
import { UlpinBadge } from "../components/UlpinBadge.jsx";
import { api } from "../lib/api.js";

export default function Search() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.searchUlpin(query.trim());
      const building = await api.getBuilding(data.building.id);
      setResult({ ...data, building });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Search by 3D-ULPIN</h1>
      <p className="text-slate-500 mb-6 text-sm">
        Try the demo ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">MH27-BUILD-0001-F01-U01</code>
      </p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. MH27-BUILD-0001-F01-U01"
          className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-md"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

      {result && (
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 h-fit">
            <UlpinBadge ulpinId={result.unit.ulpinId} size="lg" />
            <dl className="text-sm divide-y divide-slate-100">
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Owner</dt>
                <dd className="font-medium text-navy-900">{result.unit.ownerName}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Unit type</dt>
                <dd className="font-medium capitalize">{result.unit.unitType}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Area</dt>
                <dd className="font-medium">{result.unit.area ?? "—"} sq.m</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Floor</dt>
                <dd className="font-medium">{result.floor.label}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Building</dt>
                <dd className="font-medium">
                  <Link to={`/buildings/${result.building.id}`} className="text-navy-800 underline">
                    {result.building.name}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-slate-500">Address</dt>
                <dd className="font-medium text-right">{result.building.address}</dd>
              </div>
            </dl>
          </div>

          <div className="h-[480px]">
            <Viewer3D
              modelUrl={result.building.modelUrl}
              floors={result.building.floors}
              units={result.building.units}
              selectedFloorId={result.floor.id}
              highlightedUnitId={result.unit.id}
              fallbackHeight={result.building.heightMeters}
            />
            <p className="text-xs text-slate-500 mt-2">
              The matched unit is highlighted in amber; its floor slab is outlined.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
