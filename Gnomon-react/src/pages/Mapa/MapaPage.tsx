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

  // ✅ ESTADO DE NAVEGAÇÃO
  const [originId, setOriginId] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [path, setPath] = useState<Node2D[] | null>(null);
  const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]);

  // ✅ TOAST DE FEEDBACK
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { routePrimary } = useThemeVars();

  // ✅ CALLBACKS DE NAVEGAÇÃO
  const handleSelectOrigin = (nodeId: string, label?: string) => {
    console.log('📍 Origem definida:', nodeId, label);
    setOriginId(nodeId);
    setOriginLabel(label || null);
    setPath(null);
    
    setToast({
      message: `📍 ${label || 'Local marcado'}`,
      type: 'success'
    });
  };

  const handleRouteCalculated = (newPath: Node2D[], instructions: TurnInstruction[]) => {
    console.log('🗺️ Rota calculada:', newPath.length, 'pontos');
    setPath(newPath);
    setTurnInstructions(instructions);
    
    setToast({
      message: `✅ Rota calculada: ${newPath.length} pontos`,
      type: 'success'
    });
  };

  const clearRoute = () => {
    setPath(null);
    setTurnInstructions([]);
    setToast({
      message: 'Rota removida',
      type: 'info'
    });
  };

  const clearOrigin = () => {
    setOriginId(null);
    setOriginLabel(null);
    setPath(null);
    setTurnInstructions([]);
    setToast({
      message: 'Origem removida',
      type: 'info'
    });
  };

  return (
    <div id="map-app-container">
      {/* ✅ HEADER - CLICÁVEL */}
      <header className="top-bar" style={{ pointerEvents: 'auto' }}>
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
        {/* ✅ TOAST DE FEEDBACK - NÃO BLOQUEIA */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* ✅ INSTRUÇÕES DE ROTA - SEM WRAPPER BLOQUEADOR */}
        {turnInstructions.length > 0 && (
          <RouteInstructions
            instructions={turnInstructions}
            onClose={() => {
              setTurnInstructions([]);
              setPath(null);
            }}
          />
        )}
        
        {/* ✅ CONTAINER DO MAPA - PERMITE INTERAÇÕES */}
        <div id="map-container" style={{ pointerEvents: 'auto' }}>
          {mode === '3d' ? (
            <Campus3D url="/models/Campus.glb" topDown={topDown} />
          ) : (
            <div
              className={isMobilePortrait ? 'rotate-map' : ''}
              style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%', 
                overflow: 'hidden',
                pointerEvents: 'auto' // ✅ PERMITE INTERAÇÕES
              }}
            >
              <Map2D
                mapData={mapData}
                mapImageUrl={DETAIL_MAP}
                strokeColor={routePrimary}
                path={path}
                originId={originId}
                onSelectOrigin={handleSelectOrigin}
                onRouteCalculated={handleRouteCalculated}
                showCorridorsOverlay={false}
              />
            </div>
          )}
        </div>

        {/* ✅ CONTROLES DO MAPA - WRAPPER NÃO BLOQUEIA */}
        <div 
          className="map-controls-overlay" 
          style={{ 
            pointerEvents: 'none', // ✅ WRAPPER NÃO BLOQUEIA O MAPA
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '16px',
            zIndex: 10
          }}
        >
          {/* ✅ BARRA DE BUSCA - CLICÁVEL */}
          <div 
            className="search-bar" 
            style={{ 
              pointerEvents: 'auto' // ✅ BARRA É CLICÁVEL
            }}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Buscar local, sala ou serviço..." />
            <div className="view-toggle">
              <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D</button>
              <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D</button>
            </div>
          </div>

          {/* ✅ INDICADOR DE ORIGEM - CLICÁVEL */}
          {originId && !path && (
            <div 
              className="origin-indicator" 
              style={{
                padding: '12px',
                background: 'rgba(10, 132, 255, 0.95)',
                borderRadius: '12px',
                marginTop: '8px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'auto', // ✅ INDICADOR É CLICÁVEL
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flex: 1,
                minWidth: 0 
              }}>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '20px', flexShrink: 0 }}></i>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Você está em:</div>
                  <div style={{ 
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {originLabel || 'Local selecionado'}
                  </div>
                </div>
              </div>
              <button
                onClick={clearOrigin}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                  pointerEvents: 'auto' // ✅ BOTÃO É CLICÁVEL
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          {/* ✅ BOTÃO PARA LIMPAR ROTA - CLICÁVEL */}
          {path && (
            <div 
              className="route-controls" 
              style={{
                padding: '12px',
                background: 'rgba(20,22,26,0.95)',
                borderRadius: '12px',
                marginTop: '8px',
                pointerEvents: 'auto', // ✅ CONTROLE É CLICÁVEL
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
              }}
            >
              <button
                onClick={clearRoute}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #FF3B30',
                  background: '#FF3B30',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                  pointerEvents: 'auto' // ✅ BOTÃO É CLICÁVEL
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FF2D20'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FF3B30'}
              >
                <i className="fa-solid fa-xmark"></i> Limpar Rota
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ✅ FOOTER - CLICÁVEL */}
      <footer className="bottom-nav" style={{ pointerEvents: 'auto' }}>
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