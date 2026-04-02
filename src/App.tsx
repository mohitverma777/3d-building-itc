import { useState } from 'react';
import Scene from './components/Scene';
import NavigationPanel from './components/UI/NavigationPanel';
import SidePanel from './components/UI/SidePanel';
import type { FloorData, FloorType } from './data/buildingData';

function App() {
  const [activeFilter, setActiveFilter] = useState<FloorType | 'All'>('All');
  const [activeFloor, setActiveFloor] = useState<FloorData | null>(null);

  const handleSelectFilter = (filter: FloorType | 'All') => {
    setActiveFilter(filter);
    setActiveFloor(null); // Reset active floor when filter changes
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <NavigationPanel activeFilter={activeFilter} onSelectFilter={handleSelectFilter} />
      <SidePanel activeFloor={activeFloor} onClose={() => setActiveFloor(null)} />
      
      {/* 3D Canvas Container */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Scene activeFilter={activeFilter} activeFloor={activeFloor} onSelectFloor={setActiveFloor} />
      </div>
    </div>
  );
}

export default App;
