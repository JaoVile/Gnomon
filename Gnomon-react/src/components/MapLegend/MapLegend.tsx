import React, { useState } from 'react';
import './MapLegend.css';

export type LegendItem = {
  type: 'color' | 'icon';
  value: string;
  label: string;
};

interface MapLegendProps {
  initialItems: LegendItem[];
  locationItems: LegendItem[];
}

const MapLegend: React.FC<MapLegendProps> = ({ initialItems, locationItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`map-legend-container ${isOpen ? 'open' : ''}`}>
      <div className="map-legend-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>Legenda</h4>
        <i className={`fa-solid fa-chevron-up ${isOpen ? 'open' : ''}`}></i>
      </div>
      <div className="map-legend-body">
        {initialItems.map((item, index) => (
          <div key={`initial-${index}`} className="map-legend-item">
            {item.type === 'color' ? (
              <span
                className="map-legend-color-swatch"
                style={{ backgroundColor: item.value }}
              ></span>
            ) : (
              <i className={`map-legend-icon ${item.value}`} style={{ color: item.value.startsWith('fa') ? 'inherit' : item.value }}></i>
            )}
            <span>{item.label}</span>
          </div>
        ))}
        {isOpen && locationItems.map((item, index) => (
          <div key={`location-${index}`} className="map-legend-item">
            {item.type === 'color' ? (
              <span
                className="map-legend-color-swatch"
                style={{ backgroundColor: item.value }}
              ></span>
            ) : (
              <i className={`map-legend-icon ${item.value}`} style={{ color: item.value.startsWith('fa') ? 'inherit' : item.value }}></i>
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapLegend;