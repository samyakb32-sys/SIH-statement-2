import { Edges } from "@react-three/drei";

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
          <mesh key={unit.id} position={[x, floor.minHeight + height / 2, z]} renderOrder={2}>
            <boxGeometry args={[width, height * 0.98, depth]} />
            <meshStandardMaterial
              color={isHighlighted ? "#f59e0b" : unit.unitType === "commercial" ? "#0ea5e9" : "#22c55e"}
              transparent
              opacity={isHighlighted ? 0.85 : 0.35}
            />
            {/* A flat-colored transparent box on its own is hard to make out against
                the floor slab, especially a small room in a wide-angle view — a
                visible edge outline keeps each unit's boundary legible at any scale. */}
            <Edges color={isHighlighted ? "#fff7ed" : "#0f1f38"} linewidth={1.5} />
          </mesh>
        );
      })}
    </group>
  );
}
