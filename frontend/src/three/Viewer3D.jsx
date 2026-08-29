import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { BuildingModel, PlaceholderBuilding } from "./BuildingModel.jsx";
import { FloorSlices } from "./FloorSlices.jsx";
import { UnitMarkers } from "./UnitMarkers.jsx";

export function Viewer3D({
  modelUrl,
  floors = [],
  units = [],
  selectedFloorId,
  onSelectFloor,
  highlightedUnitId,
  onBounds,
  showUnits = true,
  fallbackHeight = 16,
}) {
  const [footprint, setFootprint] = useState(12);

  const handleBounds = useCallback(
    (box) => {
      const fp = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
      if (fp && Number.isFinite(fp)) setFootprint(fp);
      onBounds?.(box);
    },
    [onBounds]
  );

  const floorsById = Object.fromEntries(floors.map((f) => [f.id, f]));

  return (
    <div className="h-full w-full rounded-lg overflow-hidden bg-slate-900">
      <Canvas shadows camera={{ position: [18, 14, 18], fov: 45 }}>
        <color attach="background" args={["#0f1f38"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
        <Suspense fallback={null}>
          {modelUrl ? (
            <BuildingModel url={modelUrl} onBounds={handleBounds} />
          ) : (
            <PlaceholderBuilding heightMeters={fallbackHeight} onBounds={handleBounds} />
          )}
          {floors.length > 0 && (
            <FloorSlices
              floors={floors}
              footprint={footprint * 1.02}
              selectedFloorId={selectedFloorId}
              onSelect={onSelectFloor}
            />
          )}
          {showUnits && units.length > 0 && (
            <UnitMarkers units={units} floorsById={floorsById} highlightedUnitId={highlightedUnitId} />
          )}
          <Environment preset="city" />
        </Suspense>
        <Grid args={[60, 60]} position={[0, 0, 0]} cellColor="#28527d" sectionColor="#1e3a5f" fadeDistance={40} />
        <OrbitControls makeDefault minDistance={4} maxDistance={80} target={[0, fallbackHeight / 3, 0]} />
      </Canvas>
    </div>
  );
}
