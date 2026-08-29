export function StatCard({ label, value, accent = false }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold text-navy-900">{value}</span>
      <span className={`text-sm font-medium ${accent ? "text-amber-600" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}
