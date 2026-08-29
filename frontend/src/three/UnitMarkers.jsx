/** Renders each tagged unit as a small colored box within its floor slab, for highlighting a search result. */
export function UnitMarkers({ units, floorsById, highlightedUnitId }) {
  return (
    <group>
      {units.map((unit) => {
        const floor = floorsById[unit.floorId];
        if (!floor || !unit.coordinates) return null;
        const { x = 0, z = 0, width = 3, depth = 3 } = unit.coordinates;
        const height = floor.maxHeight - floor.minHeight;
        const isHighlighted = unit.id === highlightedUnitId;

        return (
          <mesh key={unit.id} position={[x, floor.minHeight + height / 2, z]}>
            <boxGeometry args={[width, height * 0.98, depth]} />
            <meshStandardMaterial
              color={isHighlighted ? "#f59e0b" : unit.unitType === "commercial" ? "#0ea5e9" : "#22c55e"}
              transparent
              opacity={isHighlighted ? 0.85 : 0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}
