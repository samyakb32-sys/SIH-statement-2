import { useState } from "react";

const HIGHLIGHT = "#f59e0b";
const DEFAULT_COLOR = "#1e3a5f";

/** Renders one semi-transparent slab per floor, highlighted on hover/selection. */
export function FloorSlices({ floors, footprint = 12, selectedFloorId, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <group>
      {floors.map((floor) => {
        const height = floor.maxHeight - floor.minHeight;
        const isActive = floor.id === hoveredId || floor.id === selectedFloorId;
        return (
          <mesh
            key={floor.id}
            position={[0, floor.minHeight + height / 2, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(floor.id);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredId((id) => (id === floor.id ? null : id));
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(floor);
            }}
          >
            <boxGeometry args={[footprint, height * 0.94, footprint]} />
            <meshStandardMaterial
              color={isActive ? HIGHLIGHT : DEFAULT_COLOR}
              transparent
              opacity={isActive ? 0.45 : 0.16}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
