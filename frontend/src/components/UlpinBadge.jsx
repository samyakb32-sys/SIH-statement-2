export function UlpinBadge({ ulpinId, size = "md" }) {
  const sizeClass = size === "lg" ? "text-lg px-3 py-1.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center rounded font-mono font-semibold bg-navy-900 text-amber-400 tracking-wide ${sizeClass}`}
    >
      {ulpinId}
    </span>
  );
}
