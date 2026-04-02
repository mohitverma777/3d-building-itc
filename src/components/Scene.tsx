import { useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Sky,
  CameraControls,
  SoftShadows,
  ContactShadows,
} from '@react-three/drei';
import Building from './Building';
import Hotspots from './Hotspots';
import type { FloorData, FloorType } from '../data/buildingData';

interface SceneProps {
  activeFilter: FloorType | 'All';
  activeFloor: FloorData | null;
  onSelectFloor: (floor: FloorData) => void;
}

// Sun position — golden-hour dusk (low but above horizon)
const SUN_ELEVATION   = 4.5;   // degrees above horizon → warm golden hour
const SUN_AZIMUTH     = 210;   // south-south-west

const SceneContent: FC<SceneProps> = ({ activeFilter, activeFloor, onSelectFloor }) => {
  const cameraControlsRef = useRef<any>(null);

  useEffect(() => {
    if (cameraControlsRef.current) {
      if (activeFloor) {
        const yOffset = activeFloor.yPos + 2.7 + 5;
        cameraControlsRef.current.setLookAt(
          20, yOffset, 20,
          0, activeFloor.yPos + 2.7, 0,
          true
        );
      } else {
        cameraControlsRef.current.setLookAt(
          26, 26, 30,
          0, 12, 0,
          true
        );
      }
    }
  }, [activeFloor]);

  // Direction vector for directional light from sun azimuth/elevation
  const phi   = (90 - SUN_ELEVATION) * (Math.PI / 180);
  const theta = SUN_AZIMUTH * (Math.PI / 180);
  const sunX  = Math.sin(phi) * Math.cos(theta) * 80;
  const sunY  = Math.cos(phi) * 80 + 5;          // ensure positive Y
  const sunZ  = Math.sin(phi) * Math.sin(theta) * 80;

  return (
    <>
      <CameraControls
        ref={cameraControlsRef}
        makeDefault
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2.1}
        maxDistance={80}
        minDistance={6}
        dollySpeed={1.2}
      />

      {/* ── PHYSICALLY-BASED SKY ───────────────────────────── */}
      {/* Golden-hour dusk: blue sky fading to orange on horizon */}
      <Sky
        distance={450000}
        sunPosition={[sunX, sunY, sunZ]}
        inclination={SUN_ELEVATION / 90}
        azimuth={0.55}
        turbidity={8}
        rayleigh={2.0}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
      />

      {/* ── LIGHTING ──────────────────────────────────────── */}

      {/* 1. Hemisphere: warm golden-orange sky top, warm sandy ground bounce */}
      <hemisphereLight
        args={['#FFBF7A', '#6B4B22', 0.65]}
      />

      {/* 2. Key sun – warm golden (late afternoon), low raking angle */}
      <directionalLight
        position={[sunX * 0.5, Math.max(sunY * 0.5, 10), sunZ * 0.5]}
        intensity={2.2}
        color="#FFD060"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={250}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* 3. Cool blue sky fill (twilight scatter from opposite direction) */}
      <directionalLight
        position={[-15, 30, -20]}
        intensity={0.4}
        color="#7090C8"
      />

      {/* 4. Ambient — enough to read stone detail in shadow areas */}
      <ambientLight intensity={0.28} color="#FFE0B0" />

      {/* ── GROUND ──────────────────────────────────────── */}

      {/* Inner: warm cream paved stone courtyard (lit by uplights) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <circleGeometry args={[32, 64]} />
        <meshStandardMaterial
          color="#C0A070"
          roughness={0.82}
          metalness={0.04}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Driveway approach */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 16]} receiveShadow>
        <planeGeometry args={[12, 18]} />
        <meshStandardMaterial color="#B89860" roughness={0.85} />
      </mesh>

      {/* Outer dark landscaping */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <ringGeometry args={[32, 300, 72]} />
        <meshStandardMaterial color="#1E1810" roughness={0.97} />
      </mesh>

      {/* ── CONTACT SHADOW (crisp pool of shadow under building) ── */}
      <ContactShadows
        position={[0, -0.05, 0]}
        width={48}
        height={48}
        far={3}
        blur={2.5}
        opacity={0.65}
        color="#200C00"
      />

      {/* ── BUILDING ──────────────────────────────────────── */}
      {/* Building raised 2.7 so podium base sits on ground */}
      <Building position={[0, 2.7, 0]} />

      {/* ── HOTSPOTS ──────────────────────────────────────── */}
      <Hotspots
        activeFilter={activeFilter}
        activeFloor={activeFloor}
        onSelectFloor={onSelectFloor}
      />
    </>
  );
};

const Scene: FC<SceneProps> = (props) => {
  return (
    <Canvas
      shadows="soft"
      camera={{ position: [26, 26, 30], fov: 36, near: 0.1, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: 4,           // ACESFilmic tonemapping
        toneMappingExposure: 0.9,
        outputColorSpace: 'srgb',
      }}
    >
      <SoftShadows size={18} samples={24} focus={0.8} />
      <SceneContent {...props} />
    </Canvas>
  );
};

export default Scene;
