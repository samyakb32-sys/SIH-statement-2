import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/upload", label: "Upload Building" },
  { to: "/search", label: "Search ULPIN" },
  { to: "/owners", label: "Owner Dashboard" },
];

function linkClass({ isActive }) {
  return [
    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
    isActive ? "bg-navy-700 text-white" : "text-slate-300 hover:text-white hover:bg-navy-800",
  ].join(" ");
}

export function Navbar() {
  return (
    <header className="bg-navy-950 border-b border-navy-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded bg-amber-500 flex items-center justify-center font-bold text-navy-950">
            3D
          </span>
          <span className="text-white font-semibold tracking-tight">
            3D ULPIN <span className="text-slate-400 font-normal">| SIH26011</span>
          </span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
