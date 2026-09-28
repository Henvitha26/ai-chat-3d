import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface OrbRingsProps {
  color?: string;
  intensity?: number;
}

export default function OrbRings({
  color = "#a78bfa",
  intensity = 0.6,
}: OrbRingsProps) {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.4;
      ring1.current.rotation.y = t * 0.3;
    }
    if (ring2.current) {
      ring2.current.rotation.x = -t * 0.5;
      ring2.current.rotation.z = t * 0.4;
    }
    if (ring3.current) {
      ring3.current.rotation.y = -t * 0.6;
      ring3.current.rotation.z = -t * 0.3;
    }
  });

  return (
    <group>
      {/* Ring 1 — equator */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.7, 0.008, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={intensity} />
      </mesh>

      {/* Ring 2 — tilted */}
      <mesh ref={ring2} rotation={[0.5, 0.3, 0]}>
        <torusGeometry args={[1.9, 0.006, 16, 100]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={intensity * 0.8} />
      </mesh>

      {/* Ring 3 — outer, opposite tilt */}
      <mesh ref={ring3} rotation={[-0.4, 0.8, 0.2]}>
        <torusGeometry args={[2.1, 0.005, 16, 100]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={intensity * 0.6} />
      </mesh>
    </group>
  );
}