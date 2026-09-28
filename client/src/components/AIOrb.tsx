import { Canvas, useFrame } from "@react-three/fiber";
import {
  Sphere,
  MeshDistortMaterial,
  Float,
  Stars,
} from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import OrbRings from "./OrbRings";

interface OrbProps {
  thinking?: boolean;
  speaking?: boolean;
}

function Orb({ thinking, speaking }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
    if (innerRef.current) {
      const scale = speaking
        ? 1 + Math.sin(state.clock.elapsedTime * 8) * 0.08
        : 1;
      innerRef.current.scale.setScalar(scale);
    }
  });

  const color = useMemo(() => {
    if (thinking) return "#f472b6";
    if (speaking) return "#60a5fa";
    return "#8b5cf6";
  }, [thinking, speaking]);

  return (
    <group>
      {/* Outer glowing sphere */}
      <Sphere ref={meshRef} args={[1.2, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          distort={thinking ? 0.6 : 0.35}
          speed={thinking ? 4 : 1.5}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* Inner core */}
      <Sphere ref={innerRef} args={[0.7, 32, 32]}>
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </Sphere>

      {/* Rotating rings */}
      <OrbRings color={color} intensity={speaking ? 0.9 : 0.6} />

      {/* Point lights */}
      <pointLight position={[0, 0, 0]} intensity={2} color={color} distance={5} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#60a5fa" />
      <pointLight position={[-3, -3, 2]} intensity={1} color="#ec4899" />
    </group>
  );
}

export default function AIOrb({ thinking = false, speaking = false }: OrbProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade />
        <ambientLight intensity={0.3} />

        <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
          <Orb thinking={thinking} speaking={speaking} />
        </Float>
      </Canvas>
    </div>
  );
}