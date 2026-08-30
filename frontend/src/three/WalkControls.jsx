import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

/**
 * Free-fly WASD + mouse-look camera, no collision detection — a "walk
 * mode" for looking around inside a floor, not a physics-accurate game
 * character. Click the viewer to lock the pointer; Esc releases it.
 */
export function WalkControls({ eyeHeight = 1.6 }) {
  const { camera } = useThree();
  const keys = useRef({});

  useEffect(() => {
    // Reset to the building's center, not wherever the orbit camera was
    // left — otherwise walk mode can start tens of metres outside the
    // building instead of inside the floor you meant to look around.
    camera.position.set(0, eyeHeight, 0);
    camera.rotation.set(0, 0, 0);
    const onDown = (e) => (keys.current[e.code] = true);
    const onUp = (e) => (keys.current[e.code] = false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [camera, eyeHeight]);

  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const speed = 6 * delta;

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    if (keys.current["KeyW"]) camera.position.addScaledVector(forward.current, speed);
    if (keys.current["KeyS"]) camera.position.addScaledVector(forward.current, -speed);
    if (keys.current["KeyA"]) camera.position.addScaledVector(right.current, -speed);
    if (keys.current["KeyD"]) camera.position.addScaledVector(right.current, speed);
    camera.position.y = eyeHeight;
  });

  return <PointerLockControls />;
}
