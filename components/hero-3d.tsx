"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Float, MeshDistortMaterial, Sphere, Environment } from "@react-three/drei"

function AnimatedBackground() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[1.5, 64, 64]} scale={1.5}>
          <MeshDistortMaterial color="#0d9488" speed={3} distort={0.4} radius={1} />
        </Sphere>
      </Float>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Environment preset="city" />
    </>
  )
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 h-screen w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <AnimatedBackground />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}
