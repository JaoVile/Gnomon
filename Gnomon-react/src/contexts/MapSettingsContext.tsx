import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type MapMode = '2d' | '3d';

interface MapSettingsContextType {
  mode: MapMode;
  setMode: (mode: MapMode) => void;
}

const MapSettingsContext = createContext<MapSettingsContextType | undefined>(undefined);

export const MapSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<MapMode>(() => {
    const savedMode = localStorage.getItem('map_mode') as MapMode | null;
    return savedMode || '2d'; // Default to 2D
  });

  useEffect(() => {
    localStorage.setItem('map_mode', mode);
  }, [mode]);

  const contextValue = {
    mode,
    setMode,
  };

  return (
    <MapSettingsContext.Provider value={contextValue}>
      {children}
    </MapSettingsContext.Provider>
  );
};

export const useMapSettings = () => {
  const context = useContext(MapSettingsContext);
  if (context === undefined) {
    throw new Error('useMapSettings must be used within a MapSettingsProvider');
  }
  return context;
};
