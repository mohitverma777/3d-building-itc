import type { FC } from 'react';
import type { FloorType } from '../../data/buildingData';
import { Filter } from 'lucide-react';

interface NavigationPanelProps {
  activeFilter: FloorType | 'All';
  onSelectFilter: (filter: FloorType | 'All') => void;
}

const filters: (FloorType | 'All')[] = ['All', 'Available Units', 'Amenities', 'Technical Infrastructure'];

const NavigationPanel: FC<NavigationPanelProps> = ({ activeFilter, onSelectFilter }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      padding: '1rem',
      pointerEvents: 'auto',
      zIndex: 10
    }} className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <Filter size={20} color="var(--electric-blue)" />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Filters</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filters.map(filter => (
          <button
            key={filter}
            className={`glass-button ${activeFilter === filter ? 'active' : ''}`}
            style={{
              padding: '0.75rem 1rem',
              textAlign: 'left',
              width: '100%',
              fontSize: '0.9rem'
            }}
            onClick={() => onSelectFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationPanel;
