
import { Html } from '@react-three/drei';
import type { FloorData, FloorType } from '../data/buildingData';

interface HotspotsProps {
  activeFilter: FloorType | 'All';
  onSelectFloor: (floor: FloorData) => void;
  activeFloor: FloorData | null;
}

import { buildingData } from '../data/buildingData';
const Hotspots: React.FC<HotspotsProps> = ({ activeFilter, onSelectFloor, activeFloor }) => {
  const visibleHotspots = buildingData.filter(
    data => activeFilter === 'All' || data.type === activeFilter
  );

  return (
    <group>
      {visibleHotspots.map(data => {
        // Offset to the edge of the building (core is roughly 4.8x4.8)
        const xOffset = 2.6;
        const zOffset = 2.6;
        const isActive = activeFloor?.id === data.id;

        return (
          <group key={data.id} position={[xOffset, data.yPos + 0.4, zOffset]}>
             <Html center zIndexRange={[100, 0]}>
                <div 
                  className={`hotspot-label ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFloor(data);
                  }}
                  style={{
                    opacity: isActive ? 1 : 0.85,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transform: 'translate(0, -50%)', // Shift right from the 3D point
                    pointerEvents: 'auto',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translate(0, -50%) scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = isActive ? '1' : '0.85';
                    e.currentTarget.style.transform = 'translate(0, -50%) scale(1)';
                  }}
                >
                  <div className="hotspot-marker" style={{ 
                    backgroundColor: isActive ? 'var(--dark-grey)' : 'var(--electric-blue)',
                    boxShadow: isActive ? '0 0 12px var(--dark-grey)' : '0 0 8px var(--electric-blue)'
                  }} />
                  <div className="hotspot-line" style={{
                    backgroundColor: isActive ? 'var(--dark-grey)' : 'var(--electric-blue)',
                    width: isActive ? '80px' : '40px',
                    transition: 'width 0.3s ease'
                  }} />
                  <div className="hotspot-text" style={{
                    borderColor: isActive ? 'var(--dark-grey)' : 'rgba(0, 229, 255, 0.4)',
                    color: isActive ? 'var(--chalk-white)' : 'var(--dark-grey)',
                    backgroundColor: isActive ? 'var(--dark-grey)' : 'rgba(255, 255, 255, 0.9)'
                  }}>
                    {data.title}
                  </div>
                </div>
             </Html>
          </group>
        );
      })}
    </group>
  );
};

export default Hotspots;
