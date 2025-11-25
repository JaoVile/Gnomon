import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type MapType = 'cima' | 'detalhe' | 'staff';

interface MapContextType {
  mapType: MapType;
  setMapType: (type: MapType) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [mapType, setMapType] = useState<MapType>('cima'); // Default to 'cima'

  // This effect is commented out as we'll control the map type from MapaPage now
  // useEffect(() => {
  //   const savedMapType = localStorage.getItem('mapType') as MapType | null;
  //   if (savedMapType) {
  //       setMapType(savedMapType);
  //   }
  // }, []);

  useEffect(() => {
    localStorage.setItem('mapType', mapType);
  }, [mapType]);

  return (
    <MapContext.Provider value={{ mapType, setMapType }}>
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
