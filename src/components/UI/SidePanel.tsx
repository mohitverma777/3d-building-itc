import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { FloorData } from '../../data/buildingData';

interface SidePanelProps {
  activeFloor: FloorData | null;
  onClose: () => void;
}

const SidePanel: FC<SidePanelProps> = ({ activeFloor, onClose }) => {
  return (
    <AnimatePresence>
      {activeFloor && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '1rem',
            bottom: '1rem',
            right: '1rem',
            width: '360px',
            padding: '2rem',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em', 
                color: 'var(--electric-blue)', 
                fontWeight: 700 
              }}>
                Floor {activeFloor.level} - {activeFloor.type}
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.5rem', lineHeight: 1.1 }}>{activeFloor.title}</h2>
            </div>
            <button 
              onClick={onClose} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--dark-grey)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--soft-grey)' }} />

          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#555', flexGrow: 1 }}>
            {activeFloor.description}
          </p>

          {(activeFloor.price || activeFloor.specs) && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.4)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.6)' 
            }}>
              {activeFloor.specs && (
                <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 500 }}>
                  <span style={{ color: '#888', marginRight: '8px' }}>Specs:</span> {activeFloor.specs}
                </div>
              )}
              {activeFloor.price && (
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--living-green)' }}>
                  {activeFloor.price}
                </div>
              )}
            </div>
          )}

          <button className="glass-button" style={{ 
            marginTop: 'auto', 
            padding: '1rem', 
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 700, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'var(--electric-blue)',
            color: 'white',
            borderColor: 'var(--electric-blue)',
            boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)'
          }}>
            360° Virtual Tour
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidePanel;
