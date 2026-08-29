import { useState } from "react";
import { Link } from "react-router-dom";
import { UlpinBadge } from "../components/UlpinBadge.jsx";
import { api } from "../lib/api.js";

export default function Owners() {
  const [query, setQuery] = useState("");
  const [units, setUnits] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.listUnits({ owner: query.trim() });
      setUnits(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-navy-900 mb-1">Owner Dashboard</h1>
      <p className="text-slate-500 mb-6 text-sm">Look up every unit registered to a given owner name.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Priya Kulkarni"
          className="flex-1 border border-slate-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-md"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {units && (
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
              {units.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No units found for that owner.
                  </td>
                </tr>
              )}
              {units.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">
                    <Link to={`/buildings/${u.buildingId}`}>
                      <UlpinBadge ulpinId={u.ulpinId} />
                    </Link>
                  </td>
                  <td className="px-4 py-2">{u.ownerName}</td>
                  <td className="px-4 py-2 capitalize">{u.unitType}</td>
                  <td className="px-4 py-2">{u.area ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
