import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { Maximize2, Minimize2 } from 'lucide-react';

// --- Design note ---
// A real 360° photo tour needs an actual on-site equirectangular panorama
// per room, which doesn't exist for any property in this app (these are
// fictional listings with stock cover photos, not real physical spaces
// that have been photographed). Rather than fake that, this renders a
// procedurally generated 3D "dollhouse" floor plan from the property's
// bedroom/bathroom counts - real geometry, real orbit/zoom, real clickable
// hotspots, honestly built from data the property actually has.
//
// If real panoramic photography becomes available later (e.g. a
// `property.panoramaUrl` field), swap the <Scene> below for a single
// sphere with an inverted-normal mesh and that image as its texture via
// drei's <Sphere> + useTexture - the Canvas/OrbitControls/fullscreen shell
// here stays the same either way.

const ROOM_COLORS = {
  living: '#fde68a',
  kitchen: '#fdba74',
  bedroom: '#93c5fd',
  bathroom: '#5eead4',
};

const WALL_HEIGHT = 1.4;
const WALL_THICKNESS = 0.08;
const ROW_MAX_WIDTH = 14;
const ROOM_GAP = 0.6;

/**
 * Procedurally lays out a simple floor plan from room counts alone - a
 * living room + kitchen, one box per bedroom, one box per bathroom, packed
 * left-to-right and wrapped into new rows, then re-centered on the origin.
 * Deterministic for a given bedrooms/bathrooms pair, so the layout doesn't
 * jump around on unrelated re-renders.
 */
function generateFloorPlan({ bedrooms = 0, bathrooms = 0 }) {
  const defs = [
    { name: 'Living Room', w: 6, d: 5, color: ROOM_COLORS.living },
    { name: 'Kitchen', w: 4, d: 4, color: ROOM_COLORS.kitchen },
  ];

  const bedroomCount = Math.max(Math.round(bedrooms) || 1, 1);
  for (let i = 0; i < bedroomCount; i++) {
    defs.push({
      name: bedroomCount === 1 ? 'Bedroom' : i === 0 ? 'Master Bedroom' : `Bedroom ${i + 1}`,
      w: i === 0 ? 5 : 4,
      d: i === 0 ? 4.5 : 4,
      color: ROOM_COLORS.bedroom,
    });
  }

  const bathroomCount = Math.max(Math.round(bathrooms) || 1, 1);
  for (let i = 0; i < bathroomCount; i++) {
    defs.push({
      name: bathroomCount === 1 ? 'Bathroom' : `Bathroom ${i + 1}`,
      w: 2.5,
      d: 2.5,
      color: ROOM_COLORS.bathroom,
    });
  }

  let x = 0;
  let z = 0;
  let rowHeight = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const placed = [];

  defs.forEach((room, i) => {
    if (x > 0 && x + room.w > ROW_MAX_WIDTH) {
      x = 0;
      z += rowHeight + ROOM_GAP;
      rowHeight = 0;
    }
    const cx = x + room.w / 2;
    const cz = z + room.d / 2;
    placed.push({ id: `room-${i}`, ...room, x: cx, z: cz });
    minX = Math.min(minX, cx - room.w / 2);
    maxX = Math.max(maxX, cx + room.w / 2);
    minZ = Math.min(minZ, cz - room.d / 2);
    maxZ = Math.max(maxZ, cz + room.d / 2);
    x += room.w + ROOM_GAP;
    rowHeight = Math.max(rowHeight, room.d);
  });

  const offsetX = (minX + maxX) / 2;
  const offsetZ = (minZ + maxZ) / 2;
  return placed.map((room) => ({ ...room, x: room.x - offsetX, z: room.z - offsetZ }));
}

function RoomFloor({ room }) {
  return (
    <mesh position={[room.x, 0, room.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[room.w, room.d]} />
      <meshStandardMaterial color={room.color} />
    </mesh>
  );
}

/** Four thin boxes around the room's perimeter - a low "dollhouse" cutaway wall, not a full ceiling-height wall, so the layout stays readable from an orbiting camera. */
function RoomWalls({ room }) {
  const { x, z, w, d } = room;
  const wallMaterial = <meshStandardMaterial color="#e2e8f0" />;
  return (
    <group>
      <mesh position={[x, WALL_HEIGHT / 2, z - d / 2]}>
        <boxGeometry args={[w, WALL_HEIGHT, WALL_THICKNESS]} />
        {wallMaterial}
      </mesh>
      <mesh position={[x, WALL_HEIGHT / 2, z + d / 2]}>
        <boxGeometry args={[w, WALL_HEIGHT, WALL_THICKNESS]} />
        {wallMaterial}
      </mesh>
      <mesh position={[x - w / 2, WALL_HEIGHT / 2, z]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, d]} />
        {wallMaterial}
      </mesh>
      <mesh position={[x + w / 2, WALL_HEIGHT / 2, z]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, d]} />
        {wallMaterial}
      </mesh>
    </group>
  );
}

/** A clickable 3D pin above a room's center. Click toggles its tooltip; only one hotspot is active at a time (managed by the parent). */
function Hotspot({ room, isActive, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const scale = hovered || isActive ? 1.3 : 1;

  return (
    <group position={[room.x, WALL_HEIGHT + 0.3, room.z]}>
      <mesh
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isActive ? null : room.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial
          color={isActive ? '#1d4ed8' : '#2563eb'}
          emissive={isActive ? '#1d4ed8' : '#1e3a8a'}
          emissiveIntensity={isActive ? 0.6 : 0.25}
        />
      </mesh>

      {isActive && (
        <Html distanceFactor={10} center style={{ pointerEvents: 'none' }}>
          <div className="w-max max-w-[170px] -translate-y-12 rounded-lg bg-white px-3 py-2 text-center shadow-lg ring-1 ring-slate-900/10">
            <p className="text-xs font-semibold text-slate-900">{room.name}</p>
            <p className="text-[10px] text-slate-500">
              ~{Math.round(room.w * 3.281)} × {Math.round(room.d * 3.281)} ft
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ rooms, activeHotspot, setActiveHotspot }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />
      <PerspectiveCamera makeDefault position={[9, 8, 9]} fov={50} />
      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.08}
      />

      {/* Neutral ground plane for visual context beyond the floor plan's edges. */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {rooms.map((room) => (
        <group key={room.id}>
          <RoomFloor room={room} />
          <RoomWalls room={room} />
          <Hotspot room={room} isActive={activeHotspot === room.id} onSelect={setActiveHotspot} />
        </group>
      ))}
    </>
  );
}

/**
 * Interactive 3D floor plan viewer with orbit/pan/zoom and clickable room
 * hotspots. See the design note at the top of this file for why this is a
 * procedural floor plan rather than a 360° photo sphere.
 *
 * Props:
 *  - property: the property document (reads bedrooms/bathrooms/propertyType)
 */
export default function VirtualTour3D({ property }) {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const rooms = useMemo(
    () => generateFloorPlan({ bedrooms: property?.bedrooms, bathrooms: property?.bathrooms }),
    [property?.bedrooms, property?.bathrooms]
  );

  // Escape closes fullscreen - this is a CSS/state-driven overlay rather
  // than the browser's native Fullscreen API (see the fullscreen button
  // below for why), so it needs its own key handler rather than relying
  // on the browser's built-in Escape-to-exit behavior.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (property?.propertyType === 'Land') {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-6 text-center">
        <p className="text-sm text-slate-500">A virtual tour isn't available for vacant land listings.</p>
      </div>
    );
  }

  const canvas = (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${
        isFullscreen ? 'h-full' : 'aspect-[16/10]'
      }`}
    >
      <Canvas onPointerMissed={() => setActiveHotspot(null)}>
        <Scene rooms={rooms} activeHotspot={activeHotspot} setActiveHotspot={setActiveHotspot} />
      </Canvas>

      {/*
        This toggles a viewport-covering CSS overlay rather than calling the
        browser's native requestFullscreen(). The native Fullscreen API is
        unreliable for arbitrary elements on iOS Safari specifically, which
        real visitors to a real-estate site are very likely to be using -
        a CSS overlay works identically everywhere with no feature
        detection needed.
      */}
      <button
        type="button"
        onClick={() => setIsFullscreen((f) => !f)}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
        className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-white"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-500">
        Drag to orbit &middot; Scroll to zoom &middot; Click a pin for details
      </div>
    </div>
  );

  if (isFullscreen) {
    return <div className="fixed inset-0 z-50 bg-slate-900/95 p-4 sm:p-8">{canvas}</div>;
  }

  return canvas;
}
