import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "../components/StatCard.jsx";
import { UlpinBadge } from "../components/UlpinBadge.jsx";
import { api } from "../lib/api.js";

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest text-amber-400 uppercase mb-4">
              Smart India Hackathon &middot; SIH26011
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
              Land records stop at the ground floor. <span className="text-amber-400">3D ULPIN</span>{" "}
              doesn't.
            </h1>
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              ULPIN identifies a land parcel in 2D — it has no way to say who owns Floor 5, Unit B of the
              building sitting on it. 3D ULPIN extends the same numbering scheme into the vertical
              dimension, giving every floor and unit inside a multi-storey building its own unique,
              queryable identity.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/upload"
                className="bg-amber-500 hover:bg-amber-600 text-navy-950 font-semibold px-5 py-3 rounded-md transition-colors"
              >
                Upload Building
              </Link>
              <Link
                to="/search"
                className="bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white font-semibold px-5 py-3 rounded-md transition-colors"
              >
                Search ULPIN
              </Link>
            </div>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-navy-950 rounded-md p-4 border border-navy-800">
                <p className="text-slate-400 mb-2 font-medium">2D ULPIN (today)</p>
                <UlpinBadge ulpinId="MH27-BUILD-0142" />
                <p className="text-slate-500 mt-3 text-xs">Identifies the land parcel only.</p>
              </div>
              <div className="bg-navy-950 rounded-md p-4 border border-amber-500/40">
                <p className="text-slate-400 mb-2 font-medium">3D ULPIN (proposed)</p>
                <UlpinBadge ulpinId="MH27-BUILD-0142-F05-U02" />
                <p className="text-slate-500 mt-3 text-xs">Pinpoints Floor 5, Unit 2 inside it.</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-4">
              Same base ID, extended with a floor and unit suffix — fully backward compatible with existing
              2D records.
            </p>
          </div>
        </div>
      </section>

      {/* Problem vs solution */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">The problem</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            India's ULPIN system gives every land parcel a unique ID, but it maps the world in two
            dimensions. In dense urban areas with multi-storey apartments and commercial complexes, one
            parcel ID can represent dozens of separately owned units stacked vertically — with no formal
            record connecting the ID to a specific floor or unit. This creates ambiguity in ownership
            records, disputes, taxation, and disaster response.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">The solution</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            3D ULPIN takes a 3D scan of a building (captured on a smartphone and processed externally),
            slices it into floors, and lets a surveyor tag individual units on each floor. Every unit
            receives a unique ID derived from the existing 2D ULPIN, viewable and searchable in an
            interactive 3D model — turning a flat parcel record into a navigable vertical property
            registry.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Live demo data</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Buildings Mapped" value={stats?.buildings ?? "—"} />
          <StatCard label="Floors Sliced" value={stats?.floors ?? "—"} />
          <StatCard label="Units Tagged" value={stats?.units ?? "—"} accent />
          <StatCard label="Unique Owners" value={stats?.owners ?? "—"} />
        </div>
      </section>
    </div>
  );
}
