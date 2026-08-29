import { useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/** Loads a .glb/.gltf model and reports its bounding box back to the parent. */
export function BuildingModel({ url, onBounds }) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    onBounds?.(box);
  }, [cloned, onBounds]);

  return <primitive object={cloned} />;
}

/** Simple fallback box model used when no real scan is available. */
export function PlaceholderBuilding({ heightMeters = 16, footprint = 10, onBounds }) {
  useEffect(() => {
    const half = footprint / 2;
    const box = new THREE.Box3(
      new THREE.Vector3(-half, 0, -half),
      new THREE.Vector3(half, heightMeters, half)
    );
    onBounds?.(box);
  }, [heightMeters, footprint, onBounds]);

  return (
    <mesh position={[0, heightMeters / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[footprint, heightMeters, footprint]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
  );
}
