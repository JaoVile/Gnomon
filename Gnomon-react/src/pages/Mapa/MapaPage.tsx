import { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import Campus3D from '../../components/Campus3d';
import Map2D, { 
  type TurnInstruction,
  type Node2D
} from '../../components/Map2D';
import RouteInstructions from '../../components/RouteInstructions';
import Toast from '../../components/Toast';
import { useThemeVars } from '../../libs/useThemeVars';
import { useMapData } from '../../hooks/useMapData';
import './MapaPage.css';

export default function MapaPage() {
  const [activeNav, setActiveNav] = useState('Mapa');
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [topDown] = useState(false);

  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  useLayoutEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobilePortrait(isMobile && isPortrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const DETAIL_MAP = '/maps/Campus_2D_DETALHE.png';
  const { data: mapData } = useMapData();

  const [originId, setOriginId] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [path, setPath] = useState<Node2D[] | null>(null);
  const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { routePrimary } = useThemeVars();

  const handleSelectOrigin = (nodeId: string, label?: string) => {
    setOriginId(nodeId);
    setOriginLabel(label || null);
    setPath(null);
    setToast({
      message: `📍 Ponto de partida: ${label || 'Local marcado'}`,
      type: 'success'
    });
  };

  const handleRouteCalculated = (newPath: Node2D[], instructions: TurnInstruction[]) => {
    setPath(newPath);
    setTurnInstructions(instructions);
    setToast({
      message: '🗺️ Rota calculada com sucesso!',
      type: 'success'
    });
  };

  const clearRoute = () => {
    setPath(null);
    setTurnInstructions([]);
    setToast({ message: 'Rota removida', type: 'info' });
  };

  const clearOrigin = () => {
    setOriginId(null);
    setOriginLabel(null);
    setPath(null);
    setTurnInstructions([]);
    setToast({ message: 'Ponto de partida removido', type: 'info' });
  };

  return (
    <div id="map-app-container">
      <header className="top-bar">
        <i className="fa-solid fa-bars menu-icon"></i>
        <Link to="/" className="logo-container">
          <img src={logoIcon} alt="Ícone Gnomon" />
          <span>GNOMON</span>
        </Link>
        <Link to="/config">
          <i className="fa-solid fa-gear profile-icon"></i>
        </Link>
      </header>

      <main className="content-area">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {turnInstructions.length > 0 && (
          <RouteInstructions
            instructions={turnInstructions}
            onClose={() => {
              setTurnInstructions([]);
              setPath(null);
            }}
          />
        )}
        
        <div id="map-container">
          {mode === '3d' ? (
            <Campus3D url="/models/Campus.glb" topDown={topDown} />
          ) : (
            <Map2D
              mapData={mapData}
              mapImageUrl={DETAIL_MAP}
              strokeColor={routePrimary}
              path={path}
              originId={originId}
              onSelectOrigin={handleSelectOrigin}
              onRouteCalculated={handleRouteCalculated}
            />
          )}
        </div>

        <div className="map-controls-overlay">
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Buscar local, sala ou serviço..." />
            <div className="view-toggle">
              <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D</button>
              <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D</button>
            </div>
          </div>

          <div className="bottom-controls">
            {originId && !path && (
              <div className="origin-indicator">
                <span>
                  Você está em: <strong>{originLabel || 'Local selecionado'}</strong>
                </span>
                <button onClick={clearOrigin}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {path && (
              <div className="route-controls">
                <button onClick={clearRoute}>
                  <i className="fa-solid fa-xmark"></i> Limpar Rota
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bottom-nav">
        <div className={`nav-item ${activeNav === 'Mapa' ? 'active' : ''}`} onClick={() => setActiveNav('Mapa')}>
          <i className="fa-solid fa-map-location-dot"></i>
          <span>Mapa</span>
        </div>
        <div className={`nav-item ${activeNav === 'Locais' ? 'active' : ''}`} onClick={() => setActiveNav('Locais')}>
          <i className="fa-solid fa-list-ul"></i>
          <span>Locais</span>
        </div>
        <div className={`nav-item ${activeNav === 'Favoritos' ? 'active' : ''}`} onClick={() => setActiveNav('Favoritos')}>
          <i className="fa-solid fa-star"></i>
          <span>Favoritos</span>
        </div>
        <div className={`nav-item ${activeNav === 'Ajustes' ? 'active' : ''}`} onClick={() => setActiveNav('Ajustes')}>
          <i className="fa-solid fa-gear"></i>
          <span>Ajustes</span>
        </div>
      </footer>
    </div>
  );
}
