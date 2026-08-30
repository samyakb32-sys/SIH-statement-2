import { useState } from "react";

const HIGHLIGHT = "#f59e0b";
const DEFAULT_COLOR = "#1e3a5f";

/**
 * Renders one slab per floor, highlighted on hover/selection.
 *
 * Only the active (hovered/selected) floor is ever visibly tinted. Stacking
 * several semi-transparent boxes at once left their draw order up to WebGL,
 * which made the highlight appear to bleed onto the wrong floor depending on
 * camera angle. Inactive floors stay fully transparent (opacity 0) so there
 * is at most one visible tinted box at a time — they're still present (and
 * still raycast-able for hover/click) so the floor list stays clickable.
 */
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
            renderOrder={1}
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
              opacity={isActive ? 0.45 : 0}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
