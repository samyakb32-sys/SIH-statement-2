const ELEMENT_COLOR = {
  door: "#92400e",
  window: "#38bdf8",
  table: "#a855f7",
  counter: "#f97316",
  open_space: "#94a3b8",
};

// Doors/windows sit flat against the floor's edge; furniture gets a low box.
const ELEMENT_HEIGHT_RATIO = {
  door: 0.85,
  window: 0.4,
  table: 0.14,
  counter: 0.2,
  open_space: 0.02,
};

/** Renders doors, windows, and furniture as simple colored boxes within their floor. */
export function ElementMarkers({ elements, floorsById }) {
  return (
    <group>
      {elements.map((el) => {
        const floor = floorsById[el.floorId];
        if (!floor || !el.coordinates) return null;
        const { x = 0, z = 0, width = 1, depth = 1 } = el.coordinates;
        const floorHeight = floor.maxHeight - floor.minHeight;
        const boxHeight = floorHeight * (ELEMENT_HEIGHT_RATIO[el.type] ?? 0.2);

        return (
          <mesh
            key={el.id}
            position={[x, floor.minHeight + boxHeight / 2, z]}
            renderOrder={3}
          >
            <boxGeometry args={[width, boxHeight, depth]} />
            <meshStandardMaterial
              color={ELEMENT_COLOR[el.type] ?? "#94a3b8"}
              transparent={el.type === "open_space"}
              opacity={el.type === "open_space" ? 0.15 : 1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
