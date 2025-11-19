import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type MapType = 'cima' | 'detalhe';

interface MapContextType {
  mapType: MapType;
  toggleMapType: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [mapType, setMapType] = useState<MapType>(() => {
    const savedMapType = localStorage.getItem('mapType') as MapType | null;
    return savedMapType || 'cima';
  });

  useEffect(() => {
    localStorage.setItem('mapType', mapType);
  }, [mapType]);

  const toggleMapType = () => {
    setMapType((prevMapType) => (prevMapType === 'cima' ? 'detalhe' : 'cima'));
  };

  return (
    <MapContext.Provider value={{ mapType, toggleMapType }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
