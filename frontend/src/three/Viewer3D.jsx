import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { BuildingModel, PlaceholderBuilding } from "./BuildingModel.jsx";
import { FloorSlices } from "./FloorSlices.jsx";
import { UnitMarkers } from "./UnitMarkers.jsx";
import { ElementMarkers } from "./ElementMarkers.jsx";
import { WalkControls } from "./WalkControls.jsx";

export function Viewer3D({
  modelUrl,
  floors = [],
  units = [],
  elements = [],
  selectedFloorId,
  onSelectFloor,
  highlightedUnitId,
  onBounds,
  showUnits = true,
  fallbackHeight = 16,
  walkMode = false,
  focusFloorId,
  onExitWalk,
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

  const focusFloor = floors.find((f) => f.id === focusFloorId);
  // "Walk mode" hides floors above the one you're focused on, so it feels
  // like you're standing inside it instead of looking at a stack of slabs.
  const visibleFloors = walkMode && focusFloor ? floors.filter((f) => f.floorNumber <= focusFloor.floorNumber) : floors;
  const visibleFloorIds = new Set(visibleFloors.map((f) => f.id));
  const visibleUnits = walkMode ? units.filter((u) => visibleFloorIds.has(u.floorId)) : units;
  const visibleElements = walkMode ? elements.filter((e) => visibleFloorIds.has(e.floorId)) : elements;

  const floorsById = Object.fromEntries(floors.map((f) => [f.id, f]));
  const eyeHeight = focusFloor ? focusFloor.minHeight + 1.6 : 1.6;

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden bg-slate-900">
      <Canvas shadows camera={{ position: [18, 14, 18], fov: 45 }}>
        <color attach="background" args={["#0f1f38"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
        <Suspense fallback={null}>
          {!walkMode &&
            (modelUrl ? (
              <BuildingModel url={modelUrl} onBounds={handleBounds} />
            ) : (
              <PlaceholderBuilding heightMeters={fallbackHeight} onBounds={handleBounds} />
            ))}
          {visibleFloors.length > 0 && (
            <FloorSlices
              floors={visibleFloors}
              footprint={footprint * 1.02}
              selectedFloorId={selectedFloorId}
              onSelect={onSelectFloor}
              dimAll={walkMode}
            />
          )}
          {showUnits && visibleUnits.length > 0 && (
            <UnitMarkers units={visibleUnits} floorsById={floorsById} highlightedUnitId={highlightedUnitId} />
          )}
          {visibleElements.length > 0 && <ElementMarkers elements={visibleElements} floorsById={floorsById} />}
          {!walkMode && <Environment preset="city" />}
        </Suspense>
        <Grid args={[60, 60]} position={[0, 0, 0]} cellColor="#28527d" sectionColor="#1e3a5f" fadeDistance={40} />
        {walkMode ? (
          <WalkControls eyeHeight={eyeHeight} />
        ) : (
          <OrbitControls makeDefault minDistance={4} maxDistance={80} target={[0, fallbackHeight / 3, 0]} />
        )}
      </Canvas>

      {walkMode && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 pointer-events-none">
          <span className="pointer-events-auto bg-navy-950/90 text-slate-200 text-xs px-3 py-1.5 rounded-md">
            Click to look around · WASD to move · Esc to release mouse
          </span>
          <button
            onClick={onExitWalk}
            className="pointer-events-auto bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-semibold px-3 py-1.5 rounded-md"
          >
            Exit Walk Mode
          </button>
        </div>
      )}
    </div>
  );
}
