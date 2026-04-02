import React, { useState, useMemo } from 'react';
import * as THREE from 'three';

interface BuildingProps {
  position?: [number, number, number];
}

// ─────────────────────────────────────────────────────────────────────────────
// ITC Narmada – colour palette
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  // Sandstone – warm limestone, rougher for PBR accuracy
  stone:     new THREE.Color('#D4B478'),   // warm cream limestone (brighter)
  stoneDark: new THREE.Color('#8C6E38'),   // shadowed carved stone
  stonePale: new THREE.Color('#F2E2BC'),   // bright cream cornice / capital
  stoneDeep: new THREE.Color('#6A4E20'),   // deep carved channel
  // Glass – highly reflective tinted curtain wall
  glass:     new THREE.Color('#2E5566'),   // deep tinted glass
  glassLit:  new THREE.Color('#78C2DC'),   // glass sky reflection
  // Windows – bright warm inside light (dusk = rooms are lit)
  winWarm:   new THREE.Color('#FFCC50'),   // vivid warm window glow
  winAmber:  new THREE.Color('#E8A020'),   // deeper amber variant
  // Crown
  crownOr:   new THREE.Color('#BF3500'),   // deep terracotta
  crownGlow: new THREE.Color('#FF5500'),   // orange emissive glow
  // Ornamentation
  jali:      new THREE.Color('#D4A820'),   // bold gold lattice
  pool:      new THREE.Color('#22B0C5'),   // pool cyan
  lamp:      new THREE.Color('#FFE090'),   // lamp globe warm white
};

// ─────────────────────────────────────────────────────────────────────────────
// Dimensions (matched to ITC Narmada front elevation)
// ─────────────────────────────────────────────────────────────────────────────
const FH      = 0.9;    // floor height
const FLOORS  = 17;     // tower floors total (incl. podium)
const POD_F   = 3;      // podium floors
const POD_W   = 15.0;   // podium base width
const POD_D   = 12.5;   // podium depth
const TWR_W   = 13.0;   // tower width (wider than before for proper pilaster spacing)
const TWR_D   =  9.5;   // tower depth
const ATR_W   =  3.6;   // central glass atrium width (wider for realism)
const ATR_D   =  9.3;   // atrium runs full depth
// Wing width per side
const WNG_W   = (TWR_W - ATR_W) / 2;  // ≈ 4.7 per wing

// Pilasters: 5 per wing (creates 4 bays for windows)
const PIL_COUNT = 5;
const PIL_W   = 0.38;   // pilaster face width
const PIL_D   = 0.42;   // pilaster projection depth

// setback above floor 12
const SETBACK_F  = 12;
const SETBACK_A  = 0.55;

// Y origin: podium centre
const podH  = POD_F * FH;
const podY0 = -podH / 2;
const towerBaseY = podY0 + podH / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Reusable primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Warmly lit window pane with dark stone frame */
const Win = ({ x, y, z, w = 0.70, h = 0.60, flip = false }: {
  x: number; y: number; z: number; w?: number; h?: number; flip?: boolean;
}) => {
  const dz = flip ? -0.07 : 0.07;
  return (
    <>
      <mesh position={[x, y, z]}>
        <boxGeometry args={[w, h, Math.abs(dz)]} />
        {/* High emissive for dusk: rooms lit from inside */}
        <meshStandardMaterial color={C.winWarm} emissive={C.winWarm}
          emissiveIntensity={0.78} roughness={0.1} metalness={0.15} />
      </mesh>
      {/* frame / reveal */}
      <mesh position={[x, y, z - dz * 0.5]}>
        <boxGeometry args={[w + 0.16, h + 0.14, Math.abs(dz) * 0.4]} />
        <meshStandardMaterial color={C.stoneDark} roughness={0.85} metalness={0.02} />
      </mesh>
    </>
  );
};

/** Heavy ornamental pilaster (projects out of facade) */
const Pilaster = ({ x, y, z, h }: { x: number; y: number; z: number; h: number }) => (
  <>
    {/* main shaft – cast shadow */}
    <mesh position={[x, y, z + PIL_D / 2]} castShadow receiveShadow>
      <boxGeometry args={[PIL_W, h, PIL_D]} />
      <meshStandardMaterial color={C.stone} roughness={0.78} metalness={0.04}
        envMapIntensity={0.6} />
    </mesh>
    {/* dark carved channel */}
    <mesh position={[x, y, z + PIL_D / 2 + 0.01]}>
      <boxGeometry args={[PIL_W * 0.28, h * 0.97, 0.06]} />
      <meshStandardMaterial color={C.stoneDeep} roughness={0.95} metalness={0.01} />
    </mesh>
    {/* capital */}
    <mesh position={[x, y + h / 2 - 0.12, z + PIL_D / 2]} castShadow>
      <boxGeometry args={[PIL_W + 0.14, 0.22, PIL_D + 0.12]} />
      <meshStandardMaterial color={C.stonePale} roughness={0.78} metalness={0.03} />
    </mesh>
    {/* base */}
    <mesh position={[x, y - h / 2 + 0.1, z + PIL_D / 2]}>
      <boxGeometry args={[PIL_W + 0.12, 0.18, PIL_D + 0.1]} />
      <meshStandardMaterial color={C.stonePale} roughness={0.78} metalness={0.03} />
    </mesh>
  </>
);

/** Horizontal cornice / belt slab */
const Belt = ({ y, w, d, t = 0.18, col = C.stonePale }: {
  y: number; w: number; d: number; t?: number; col?: THREE.Color;
}) => (
  <mesh position={[0, y, 0]} castShadow receiveShadow>
    <boxGeometry args={[w, t, d]} />
    <meshStandardMaterial color={col} roughness={0.82} />
  </mesh>
);

/** Vertical lamp post with glowing top */
const LampPost = ({ x, y, z, h = 2.2 }: { x: number; y: number; z: number; h?: number }) => (
  <>
    {/* shaft – cast shadow */}
    <mesh position={[x, y + h / 2, z]} castShadow>
      <cylinderGeometry args={[0.055, 0.075, h, 8]} />
      <meshStandardMaterial color={new THREE.Color('#4A3C1E')} roughness={0.7} metalness={0.5} />
    </mesh>
    {/* lamp globe */}
    <mesh position={[x, y + h + 0.15, z]}>
      <sphereGeometry args={[0.22, 12, 10]} />
      <meshStandardMaterial color={C.lamp} emissive={C.lamp} emissiveIntensity={2.5}
        roughness={0.1} metalness={0.05} />
    </mesh>
    {/* warm point light with physical falloff */}
    <pointLight position={[x, y + h + 0.22, z]}
      intensity={2.5} color="#FFD088" distance={7} decay={2} castShadow
      shadow-mapSize-width={512} shadow-mapSize-height={512} shadow-bias={-0.001} />
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// BUILDING
// ─────────────────────────────────────────────────────────────────────────────
const Building = ({ position = [0, 0, 0] }: BuildingProps) => {
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  // Pilaster x-positions on left wing front face
  // Span from left edge of left wing to atrium edge
  const lWingX0 = -(ATR_W / 2 + WNG_W);  // left edge of left wing

  // 5 pilasters evenly within left wing
  const pilarsL: number[] = [];
  for (let p = 0; p < PIL_COUNT; p++) {
    pilarsL.push(lWingX0 + 0.05 + p * (WNG_W / (PIL_COUNT - 1)));
  }
  // Mirror for right wing
  const pilarsR = pilarsL.map(x => -x);

  const elements = useMemo(() => {
    const out: React.JSX.Element[] = [];
    const frontZ = TWR_D / 2;

    // ══════════════════════════════════════════
    // A. TOWER FLOORS (above podium)
    // ══════════════════════════════════════════
    const towerFloors = FLOORS - POD_F;

    for (let i = 0; i < towerFloors; i++) {
      const fi      = i + POD_F;
      const yBase   = towerBaseY + i * FH;
      const yCtr    = yBase + FH / 2;
      const isHov   = hoveredFloor === fi;
      const sb      = fi >= SETBACK_F ? SETBACK_A : 0;
      const tW      = TWR_W - sb * 2;
      const tD      = TWR_D - sb * 1.0;
      const wW      = (tW - ATR_W) / 2;
      const fZ      = tD / 2;

      const lCX = -(ATR_W / 2 + wW / 2);
      const rCX =  (ATR_W / 2 + wW / 2);

      const winCol = isHov ? new THREE.Color('#00E5FF') : C.winWarm;
      const winEmi = isHov ? 0.9 : 0.58;

      // ── Left wing body
      out.push(
        <mesh key={`lw-${i}`} position={[lCX, yCtr, 0]} castShadow receiveShadow
          onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(fi); }}
          onPointerOut={() => setHoveredFloor(null)}>
          <boxGeometry args={[wW, FH - 0.1, tD]} />
          <meshStandardMaterial color={C.stone} roughness={0.68} metalness={0.04} />
        </mesh>
      );

      // ── Right wing body
      out.push(
        <mesh key={`rw-${i}`} position={[rCX, yCtr, 0]} castShadow receiveShadow
          onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(fi); }}
          onPointerOut={() => setHoveredFloor(null)}>
          <boxGeometry args={[wW, FH - 0.1, tD]} />
          <meshStandardMaterial color={C.stone} roughness={0.68} metalness={0.04} />
        </mesh>
      );

      // ── Central glass atrium
      out.push(
        <mesh key={`atr-${i}`} position={[0, yCtr, 0]} castShadow receiveShadow>
          <boxGeometry args={[ATR_W, FH - 0.03, ATR_D]} />
          <meshStandardMaterial color={C.glass} emissive={C.glassLit} emissiveIntensity={0.18}
            roughness={0.04} metalness={0.78} transparent opacity={0.82} />
        </mesh>
      );

      // ── Belt course every floor
      out.push(
        <mesh key={`blt-${i}`} position={[0, yBase + FH - 0.06, 0]}>
          <boxGeometry args={[tW + 0.15, 0.12, tD + 0.15]} />
          <meshStandardMaterial color={C.stonePale} roughness={0.85} />
        </mesh>
      );

      // ── Every 5th floor: gold accent band
      if (i > 0 && i % 5 === 0) {
        out.push(
          <mesh key={`gb-${i}`} position={[0, yBase + FH + 0.01, 0]}>
            <boxGeometry args={[tW + 0.3, 0.24, tD + 0.3]} />
            <meshStandardMaterial color={C.jali} roughness={0.48} metalness={0.38} />
          </mesh>
        );
      }

      // ── FRONT FACE WINDOWS (4 bays × 2 windows per wing per floor)
      // Left wing: 4 bays between 5 pilasters
      for (let bay = 0; bay < 4; bay++) {
        const bx0 = lWingX0 + bay * (WNG_W / 4);
        const bx1 = lWingX0 + (bay + 1) * (WNG_W / 4);
        const bayCX = (bx0 + bx1) / 2;
        // 2 windows side by side within each bay
        for (let w = 0; w < 2; w++) {
          const wx = bayCX - 0.22 + w * 0.44;
          out.push(
            <mesh key={`lfw-${i}-${bay}-${w}`}
              position={[wx, yBase + FH * 0.52, fZ + 0.06]}>
              <boxGeometry args={[0.35, FH * 0.62, 0.07]} />
              <meshStandardMaterial color={winCol} emissive={winCol} emissiveIntensity={winEmi}
                roughness={0.12} metalness={0.2} />
            </mesh>
          );
          // frame
          out.push(
            <mesh key={`lff-${i}-${bay}-${w}`}
              position={[wx, yBase + FH * 0.52, fZ + 0.04]}>
              <boxGeometry args={[0.46, FH * 0.74, 0.045]} />
              <meshStandardMaterial color={C.stoneDark} roughness={0.8} />
            </mesh>
          );
        }
        // horizontal divide between windows (window transom bar)
        out.push(
          <mesh key={`lft-${i}-${bay}`} position={[bayCX, yBase + FH * 0.52, fZ + 0.065]}>
            <boxGeometry args={[0.78, 0.05, 0.05]} />
            <meshStandardMaterial color={C.stoneDark} roughness={0.8} />
          </mesh>
        );
      }

      // Right wing (mirror of left)
      for (let bay = 0; bay < 4; bay++) {
        const bx0 = ATR_W / 2 + bay * (WNG_W / 4);
        const bx1 = ATR_W / 2 + (bay + 1) * (WNG_W / 4);
        const bayCX = (bx0 + bx1) / 2;
        for (let w = 0; w < 2; w++) {
          const wx = bayCX - 0.22 + w * 0.44;
          out.push(
            <mesh key={`rfw-${i}-${bay}-${w}`}
              position={[wx, yBase + FH * 0.52, fZ + 0.06]}>
              <boxGeometry args={[0.35, FH * 0.62, 0.07]} />
              <meshStandardMaterial color={winCol} emissive={winCol} emissiveIntensity={winEmi}
                roughness={0.12} metalness={0.2} />
            </mesh>
          );
          out.push(
            <mesh key={`rff-${i}-${bay}-${w}`}
              position={[wx, yBase + FH * 0.52, fZ + 0.04]}>
              <boxGeometry args={[0.46, FH * 0.74, 0.045]} />
              <meshStandardMaterial color={C.stoneDark} roughness={0.8} />
            </mesh>
          );
        }
        out.push(
          <mesh key={`rft-${i}-${bay}`} position={[bayCX, yBase + FH * 0.52, fZ + 0.065]}>
            <boxGeometry args={[0.78, 0.05, 0.05]} />
            <meshStandardMaterial color={C.stoneDark} roughness={0.8} />
          </mesh>
        );
      }

      // ── SIDE face windows (2 per side)
      for (const sx of [-1, 1]) {
        const sideX = sx * (tW / 2 + PIL_D + 0.04);
        for (let w = 0; w < 2; w++) {
          const wz = -tD * 0.22 + w * (tD * 0.44);
          out.push(
            <mesh key={`side-win-${i}-${sx}-${w}`} position={[sideX, yBase + FH * 0.52, wz]}>
              <boxGeometry args={[0.07, FH * 0.6, 0.55]} />
              <meshStandardMaterial color={winCol} emissive={winCol} emissiveIntensity={winEmi * 0.7}
                roughness={0.12} metalness={0.2} />
            </mesh>
          );
        }
      }
    }

    // ══════════════════════════════════════════
    // B. FULL-HEIGHT PILASTERS (FRONT FACE)
    //    These run from podium top to below crown
    // ══════════════════════════════════════════
    const pilH_total = towerFloors * FH + 0.2;
    const pilY_ctr   = towerBaseY + towerFloors * FH / 2;

    // Left wing: 5 pilasters
    for (let p = 0; p < PIL_COUNT; p++) {
      const px = pilarsL[p];
      out.push(
        <Pilaster key={`lpil-${p}`} x={px} y={pilY_ctr} z={frontZ} h={pilH_total} />
      );
    }
    // Right wing: 5 pilasters (mirrored)
    for (let p = 0; p < PIL_COUNT; p++) {
      const px = pilarsR[p];
      out.push(
        <Pilaster key={`rpil-${p}`} x={px} y={pilY_ctr} z={frontZ} h={pilH_total} />
      );
    }
    // Atrium edges (one each side)
    for (const ax of [-(ATR_W / 2 + PIL_W * 0.5), ATR_W / 2 + PIL_W * 0.5]) {
      out.push(<Pilaster key={`atrpil-${ax}`} x={ax} y={pilY_ctr} z={frontZ} h={pilH_total} />);
    }

    // ── Also side face pilasters (3 per side)
    for (const sx of [-1, 1]) {
      const sideX = sx * (TWR_W / 2 + PIL_D * 0.5);
      for (let p = 0; p < 3; p++) {
        const pz = -TWR_D / 2 + 0.1 + p * (TWR_D / 2);
        out.push(<Col key={`spil-${sx}-${p}`}
          x={sideX} y={pilY_ctr} z={pz} h={pilH_total} />);
      }
    }

    // ══════════════════════════════════════════
    // C. GLASS ATRIUM FRONT FACE (mullions + grid)
    // ══════════════════════════════════════════
    const glH = towerFloors * FH + 2.2;
    const glMidY = towerBaseY + towerFloors * FH / 2 - FH * 0.3;
    const glFZ   = ATR_D / 2 + 0.05;

    // 3 vertical mullions
    for (const mx of [-ATR_W * 0.28, 0, ATR_W * 0.28]) {
      out.push(
        <mesh key={`mull-v-${mx}`} position={[mx, glMidY, glFZ]}>
          <boxGeometry args={[0.06, glH, 0.07]} />
          <meshStandardMaterial color={new THREE.Color('#92B8CC')} roughness={0.2} metalness={0.85} />
        </mesh>
      );
    }
    // Horizontal glass bars every floor
    for (let f = 0; f <= towerFloors; f++) {
      const fy = towerBaseY + f * FH;
      out.push(
        <mesh key={`mull-h-${f}`} position={[0, fy, glFZ]}>
          <boxGeometry args={[ATR_W, 0.06, 0.07]} />
          <meshStandardMaterial color={new THREE.Color('#92B8CC')} roughness={0.2} metalness={0.85} />
        </mesh>
      );
    }

    // ══════════════════════════════════════════
    // D. SETBACK TRANSITION CORNICE
    // ══════════════════════════════════════════
    const sbY = towerBaseY + (SETBACK_F - POD_F) * FH;
    out.push(<Belt key="sb1" y={sbY}        w={TWR_W + 0.6} d={TWR_D + 0.6} t={0.3} />);
    out.push(<Belt key="sb2" y={sbY + 0.3}  w={TWR_W + 0.24} d={TWR_D + 0.24} t={0.16} col={C.stone} />);

    // ══════════════════════════════════════════
    // E. TWIN ORANGE CROWN TOWERS
    // ══════════════════════════════════════════
    const crownBaseY = towerBaseY + towerFloors * FH;
    const sb         = SETBACK_A;
    const cWW        = WNG_W - sb + 0.5;   // crown tower width
    const cDD        = TWR_D - sb * 0.8 + 0.4;
    const isCHov     = hoveredFloor === FLOORS + 1;
    const cemi       = isCHov ? 1.8 : 0.95;

    for (const [sx, k] of [[-1, 'L'], [1, 'R']] as [number, string][]) {
      const cx = sx * (ATR_W / 2 + cWW / 2 + sb);

      // Main crown block
      out.push(
        <mesh key={`cr-${k}`} position={[cx, crownBaseY + 1.45, 0]} castShadow
          onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(FLOORS + 1); }}
          onPointerOut={() => setHoveredFloor(null)}>
          <boxGeometry args={[cWW, 2.9, cDD]} />
          <meshStandardMaterial color={C.crownOr} emissive={C.crownGlow}
            emissiveIntensity={cemi} roughness={0.3} metalness={0.18} />
        </mesh>
      );

      // Carved horizontal stripe bands on crown
      for (let s = 0; s < 5; s++) {
        out.push(
          <mesh key={`cs-${k}-${s}`}
            position={[cx, crownBaseY + 0.3 + s * 0.55, cDD / 2 + 0.015]}>
            <boxGeometry args={[cWW - 0.2, 0.15, 0.08]} />
            <meshStandardMaterial color={C.jali} roughness={0.48} metalness={0.42}
              emissive={C.crownGlow} emissiveIntensity={0.22} />
          </mesh>
        );
      }

      // Wide overhanging flat cap
      out.push(
        <mesh key={`cc-${k}`} position={[cx, crownBaseY + 3.05, 0]}>
          <boxGeometry args={[cWW + 1.3, 0.32, cDD + 1.3]} />
          <meshStandardMaterial color={C.crownOr} emissive={C.crownGlow}
            emissiveIntensity={0.52} roughness={0.35} metalness={0.18} />
        </mesh>
      );
      // Pediment on top
      out.push(
        <mesh key={`cp-${k}`} position={[cx, crownBaseY + 3.38, 0]}>
          <boxGeometry args={[cWW * 0.72, 0.55, cDD * 0.72]} />
          <meshStandardMaterial color={C.crownOr} emissive={C.crownGlow}
            emissiveIntensity={0.65} roughness={0.35} metalness={0.18} />
        </mesh>
      );
    }

    // Atrium glass parapet reaching crown height
    out.push(
      <mesh key="atr-top" position={[0, crownBaseY + 1.5, 0]}>
        <boxGeometry args={[ATR_W + 0.08, 3.1, ATR_D]} />
        <meshStandardMaterial color={C.glass} emissive={C.glassLit} emissiveIntensity={0.23}
          roughness={0.04} metalness={0.82} transparent opacity={0.78} />
      </mesh>
    );

    // ══════════════════════════════════════════
    // F. PODIUM (3-floor wide ornate base)
    //    Rectangular main body + curved front wings
    // ══════════════════════════════════════════

    // Main podium box
    out.push(
      <mesh key="pod" position={[0, podY0, 0]} castShadow receiveShadow>
        <boxGeometry args={[POD_W, podH, POD_D]} />
        <meshStandardMaterial color={C.stone} roughness={0.72} metalness={0.04} />
      </mesh>
    );

    // Podium cornice (two-step)
    out.push(<Belt key="pc1" y={podY0 + podH / 2 + 0.1} w={POD_W + 0.65} d={POD_D + 0.65} t={0.28} />);
    out.push(<Belt key="pc2" y={podY0 + podH / 2 + 0.38} w={POD_W + 0.28} d={POD_D + 0.28} t={0.18} col={C.stone} />);

    // ── Curved side pavilion wings (semi-circular at podium level)
    // Simulated with 5 angled box slabs per side
    const segments = 5;
    const podFrontZ = POD_D / 2;
    for (const sx of [-1, 1]) {
      for (let seg = 0; seg < segments; seg++) {
        const angle = (Math.PI / 2) * (seg / (segments - 1));
        const rx    = Math.cos(angle);
        const rz    = Math.sin(angle);
        const wingR = 2.8;  // radius of curved wing
        const startX = sx * POD_W / 2;
        const wx = startX + sx * wingR * (1 - rx);
        const wz = podFrontZ - wingR * rz + wingR;
        out.push(
          <mesh key={`pod-wing-${sx}-${seg}`}
            position={[wx, podY0, wz]}
            rotation={[0, sx * angle, 0]}
            castShadow receiveShadow
          >
            <boxGeometry args={[1.0, podH, 0.9]} />
            <meshStandardMaterial color={C.stone} roughness={0.72} metalness={0.04} />
          </mesh>
        );
      }
      // Curved cornice rail
      for (let seg = 0; seg < segments - 1; seg++) {
        const angle = (Math.PI / 2) * ((seg + 0.5) / (segments - 1));
        const wx = sx * POD_W / 2 + sx * 2.8 * (1 - Math.cos(angle));
        const wz = podFrontZ - 2.8 * Math.sin(angle) + 2.8;
        out.push(
          <mesh key={`pod-rail-${sx}-${seg}`}
            position={[wx, podY0 + podH / 2 + 0.12, wz]}
            rotation={[0, sx * angle, 0]}
          >
            <boxGeometry args={[1.1, 0.28, 0.98]} />
            <meshStandardMaterial color={C.stonePale} roughness={0.8} />
          </mesh>
        );
      }
    }

    // Podium front windows: 3 floors × 8 windows
    for (let pf = 0; pf < POD_F; pf++) {
      const py = podY0 - podH / 2 + pf * FH + FH * 0.52;
      const pz = POD_D / 2 + 0.05;
      // 8 windows
      for (let c = 0; c < 8; c++) {
        const px = -POD_W / 2 + 1.0 + c * ((POD_W - 2.0) / 7);
        out.push(<Win key={`pf-${pf}-${c}`} x={px} y={py} z={pz} w={0.78} h={FH * 0.60} />);
      }
      // Podium belt
      if (pf > 0) {
        out.push(<Belt key={`pb-${pf}`}
          y={podY0 - podH / 2 + pf * FH + 0.02}
          w={POD_W} d={POD_D} t={0.1} col={C.stonePale} />);
      }
    }

    // Podium front pilasters (9)
    const pilHpod = podH + 0.12;
    for (let c = 0; c < 9; c++) {
      const px = -POD_W / 2 + 0.2 + c * ((POD_W - 0.4) / 8);
      out.push(<Pilaster key={`pp-${c}`} x={px} y={podY0} z={POD_D / 2} h={pilHpod} />);
    }

    // Jali lattice strip (bottom band on podium)
    const jY = podY0 - podH / 2 + FH * 0.2;
    for (let c = 0; c < 12; c++) {
      const jx = -POD_W / 2 + 0.8 + c * ((POD_W - 1.2) / 11);
      out.push(
        <mesh key={`jali-${c}`} position={[jx, jY, POD_D / 2 + 0.06]}>
          <boxGeometry args={[0.68, 0.28, 0.09]} />
          <meshStandardMaterial color={C.jali} roughness={0.5} metalness={0.42}
            emissive={C.winWarm} emissiveIntensity={0.08} />
        </mesh>
      );
    }

    // "ITC NARMADA" signage band on podium face (simplified as dark recessed slab)
    out.push(
      <mesh key="sign-bg" position={[0, podY0 + podH * 0.18, POD_D / 2 + 0.08]}>
        <boxGeometry args={[4.5, 0.42, 0.1]} />
        <meshStandardMaterial color={new THREE.Color('#2A1E0A')} roughness={0.9} />
      </mesh>
    );
    // Sign glow strip
    out.push(
      <mesh key="sign-glow" position={[0, podY0 + podH * 0.18, POD_D / 2 + 0.13]}>
        <boxGeometry args={[4.2, 0.25, 0.05]} />
        <meshStandardMaterial color={C.stonePale} emissive={C.stonePale}
          emissiveIntensity={0.6} roughness={0.5} />
      </mesh>
    );

    // ══════════════════════════════════════════
    // G. ENTRANCE PAVILION
    //    Wide ground-level covered entry with glass
    // ══════════════════════════════════════════
    const entranceZ = POD_D / 2;
    const entranceY = podY0 - podH / 2 - 0.1;

    // Entrance canopy (wide glass-like roof)
    out.push(
      <mesh key="ent-canopy" position={[0, entranceY + 1.8, entranceZ + 2.4]} castShadow>
        <boxGeometry args={[7.5, 0.16, 5.0]} />
        <meshStandardMaterial color={C.glass} emissive={C.glassLit}
          emissiveIntensity={0.18} roughness={0.06} metalness={0.75}
          transparent opacity={0.7} />
      </mesh>
    );
    // Canopy frame border
    out.push(
      <mesh key="ent-frame" position={[0, entranceY + 1.82, entranceZ + 2.4]}>
        <boxGeometry args={[7.7, 0.22, 5.2]} />
        <meshStandardMaterial color={C.stonePale} roughness={0.7} wireframe={false} />
      </mesh>
    );

    // Canopy support columns (6)
    for (const cx of [-3.0, 0, 3.0]) {
      for (const cz of [entranceZ + 0.3, entranceZ + 4.4]) {
        out.push(
          <mesh key={`ent-col-${cx}-${cz}`} position={[cx, entranceY + 1.0, cz]} castShadow>
            <boxGeometry args={[0.28, 1.9, 0.28]} />
            <meshStandardMaterial color={C.stonePale} roughness={0.72} />
          </mesh>
        );
        // Column base
        out.push(
          <mesh key={`ent-col-base-${cx}-${cz}`} position={[cx, entranceY + 0.12, cz]}>
            <boxGeometry args={[0.42, 0.22, 0.42]} />
            <meshStandardMaterial color={C.stonePale} roughness={0.75} />
          </mesh>
        );
      }
    }

    // Entry walkway paving
    out.push(
      <mesh key="walkway" position={[0, entranceY - 0.04, entranceZ + 2.5]} receiveShadow>
        <boxGeometry args={[7.0, 0.12, 5.5]} />
        <meshStandardMaterial color={new THREE.Color('#D9C490')} roughness={0.85} />
      </mesh>
    );
    // Paving grid lines
    for (let r = 0; r < 4; r++) {
      out.push(
        <mesh key={`pave-${r}`} position={[0, entranceY + 0.01, entranceZ + 1.0 + r * 1.1]}>
          <boxGeometry args={[7.1, 0.03, 0.05]} />
          <meshStandardMaterial color={C.stoneDark} roughness={0.9} />
        </mesh>
      );
    }

    // ══════════════════════════════════════════
    // H. LAMP POSTS (8 along entrance boulevard)
    // ══════════════════════════════════════════
    const lpY = entranceY + 0.06;
    for (const lx of [-2.8, -1.2, 1.2, 2.8]) {
      // Front row
      out.push(<LampPost key={`lp-f-${lx}`} x={lx} y={lpY} z={entranceZ + 5.0} h={2.4} />);
      // Second row
      out.push(<LampPost key={`lp-b-${lx}`} x={lx} y={lpY} z={entranceZ + 2.8} h={2.0} />);
    }

    // ══════════════════════════════════════════
    // I. PALM TREES (flanking entrance)
    // ══════════════════════════════════════════
    for (const tx of [-4.8, -3.6, 3.6, 4.8]) {
      const pBase = lpY;
      out.push(
        <mesh key={`pt-${tx}`} position={[tx, pBase + 0.9, entranceZ + 3.5]} castShadow>
          <cylinderGeometry args={[0.11, 0.16, 1.8, 7]} />
          <meshStandardMaterial color={new THREE.Color('#5C3D18')} roughness={0.95} />
        </mesh>
      );
      out.push(
        <mesh key={`ph-${tx}`} position={[tx, pBase + 1.95, entranceZ + 3.5]}>
          <sphereGeometry args={[0.65, 9, 7]} />
          <meshStandardMaterial color={new THREE.Color('#2E7D32')} roughness={0.88} />
        </mesh>
      );
      // Shrub base
      out.push(
        <mesh key={`ps-${tx}`} position={[tx, pBase + 0.1, entranceZ + 3.5]}>
          <sphereGeometry args={[0.38, 8, 6]} />
          <meshStandardMaterial color={new THREE.Color('#388E3C')} roughness={0.9} />
        </mesh>
      );
    }

    // ══════════════════════════════════════════
    // J. ROOFTOP POOL (on podium top, one side)
    // ══════════════════════════════════════════
    const poolY = podY0 + podH / 2 + 0.15;
    for (const sx of [-1, 1]) {
      const poolX = sx * (POD_W / 2 - 1.0);
      out.push(
        <mesh key={`pool-deck-${sx}`} position={[poolX, poolY, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.18, POD_D - 1.2]} />
          <meshStandardMaterial color={C.stonePale} roughness={0.75} />
        </mesh>
      );
      out.push(
        <mesh key={`pool-water-${sx}`} position={[poolX, poolY + 0.14, 0.3]}>
          <boxGeometry args={[1.4, 0.1, POD_D - 3.2]} />
          <meshStandardMaterial color={C.pool} emissive={C.pool}
            emissiveIntensity={0.32} roughness={0.05} metalness={0.35} transparent opacity={0.88} />
        </mesh>
      );
    }

    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredFloor]);

  // Light positions (outside memo to use in JSX)
  const crownY  = towerBaseY + (FLOORS - POD_F) * FH;
  const cLX     = -(ATR_W / 2 + WNG_W / 2);
  const cRX     =  (ATR_W / 2 + WNG_W / 2);
  const entZ    = POD_D / 2 + 2.5;

  return (
    <group position={position}>
      {elements}

      {/* ── Warm golden facade uplights (physical inverse-sq decay=2) ── */}
      {/* Ground-level flood, angled up */}
      <spotLight position={[ 0, podY0 + 0.5, entZ + 4]}
        target-position={[0, podY0 + 8, 0]}
        intensity={60} color="#FFAA40" distance={30} decay={2}
        angle={0.45} penumbra={0.4} castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.001} />
      <spotLight position={[-7, podY0 + 0.5, entZ + 2]}
        target-position={[-4, podY0 + 6, 0]}
        intensity={40} color="#FFC050" distance={22} decay={2}
        angle={0.5} penumbra={0.5} />
      <spotLight position={[ 7, podY0 + 0.5, entZ + 2]}
        target-position={[ 4, podY0 + 6, 0]}
        intensity={40} color="#FFC050" distance={22} decay={2}
        angle={0.5} penumbra={0.5} />

      {/* ── Soft fill from front (prevents too-dark shadows on face) ── */}
      <pointLight position={[0, podY0 + 6, entZ + 6]} intensity={3} color="#FFD090" distance={25} decay={2} />

      {/* ── Orange crown rim spotlights (shoot upward from beneath) ── */}
      <spotLight position={[cLX, crownY - 1.5, 0]}
        target-position={[cLX, crownY + 4, 0]}
        intensity={80} color="#FF4800" distance={16} decay={2}
        angle={0.55} penumbra={0.3} />
      <spotLight position={[cRX, crownY - 1.5, 0]}
        target-position={[cRX, crownY + 4, 0]}
        intensity={80} color="#FF4800" distance={16} decay={2}
        angle={0.55} penumbra={0.3} />

      {/* ── Backlit atrium glass (cyan rim from behind) ─────────────── */}
      <pointLight position={[0, crownY + 1.5, -4]} intensity={8} color="#68C0DC" distance={14} decay={2} />

      {/* ── Pool glow ────────────────────────────────────────────────── */}
      <pointLight position={[cLX, podY0 + podH / 2 + 0.5, 0.5]}
        intensity={3} color="#22B8CC" distance={6} decay={2} />
      <pointLight position={[cRX, podY0 + podH / 2 + 0.5, 0.5]}
        intensity={3} color="#22B8CC" distance={6} decay={2} />
    </group>
  );
};

// ── Side-face pilaster (simpler than front Pilaster) ────────────────────────
function Col({ x, y, z, h }: { x: number; y: number; z: number; h: number }) {
  return (
    <mesh position={[x, y, z]} castShadow>
      <boxGeometry args={[0.32, h, 0.32]} />
      <meshStandardMaterial color={C.stoneDark} roughness={0.78} metalness={0.05} />
    </mesh>
  );
}

export default Building;
