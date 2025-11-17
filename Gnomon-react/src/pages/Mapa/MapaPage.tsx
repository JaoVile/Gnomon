import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Para IDs únicos
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import Campus3D from '../../components/Campus3d';
import Map2D, { 
  type TurnInstruction,
  type Node2D,
  type Poi
} from '../../components/Map2D';
import RouteInstructions from '../../components/RouteInstructions';
import ParticlesBackground from '../../components/ParticlesBackground';
import Toast from '../../components/Toast';
import { useTheme } from '../../components/ThemeContext';
import { useThemeVars } from '../../libs/useThemeVars';
import { useMapData } from '../../hooks/useMapData';
import { HistoricoPopup, type HistoryEntry } from '../../components/Historico/HistoricoPopup';
import { FavoritosPopup, type FavoriteEntry } from '../../components/Favoritos/FavoritosPopup';
import './MapaPage.css';

// Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

const HISTORY_STORAGE_KEY = 'gnomon_route_history';
const FAVORITES_STORAGE_KEY = 'gnomon_favorite_routes';

export function MapaPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFavoritosOpen, setIsFavoritosOpen] = useState(false);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [topDown] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { } = useTheme();

  const DETAIL_MAP = '/maps/Campus_2D_DETALHE.png';
  const { data: mapData } = useMapData();

  const [originId, setOriginId] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [path, setPath] = useState<Node2D[] | null>(null);
  const [destinationPoi, setDestinationPoi] = useState<Poi | null>(null);
  const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [routeHistory, setRouteHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [destinationTrigger, setDestinationTrigger] = useState<string | null>(null);

  const { routePrimary } = useThemeVars();

  // Carregar histórico e favoritos do localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) setRouteHistory(JSON.parse(savedHistory));

      const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch (error) {
      console.error("Falha ao carregar dados do localStorage:", error);
    }
  }, []);

  // Efeito para fechar popups com a tecla 'Esc'
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsHistoryOpen(false);
        setIsFavoritosOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- LÓGICA DE HISTÓRICO ---
  const addRouteToHistory = (entry: Omit<HistoryEntry, 'timestamp'>) => {
    setRouteHistory(prev => {
      const newHistory = [...prev, { ...entry, timestamp: new Date().toISOString() }];
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      } catch (e) { console.error("Falha ao salvar histórico:", e); }
      return newHistory;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de rotas?')) {
      setRouteHistory([]);
      try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        setToast({ message: 'Histórico de rotas limpo!', type: 'success' });
      } catch (e) {
        console.error("Falha ao limpar histórico:", e);
        setToast({ message: 'Erro ao limpar histórico.', type: 'error' });
      }
    }
  };

  // --- LÓGICA DE FAVORITOS ---
  const addRouteToFavorites = () => {
    if (!originId || !originLabel || !destinationPoi) {
        setToast({ message: 'Não há uma rota completa para favoritar.', type: 'error' });
        return;
    }

    const isAlreadyFavorited = favorites.some(
        fav => fav.originId === originId && fav.destinationId === destinationPoi.nodeId
    );

    if (isAlreadyFavorited) {
        setToast({ message: 'Esta rota já está nos seus favoritos.', type: 'info' });
        return;
    }

    const newFavorite: FavoriteEntry = {
        id: uuidv4(),
        originId,
        originLabel,
        destinationId: destinationPoi.nodeId,
        destinationLabel: destinationPoi.label,
        timestamp: new Date().toISOString(),
    };

    setFavorites(prev => {
        const newFavorites = [...prev, newFavorite];
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
            setToast({ message: 'Rota adicionada aos favoritos!', type: 'success' });
        } catch (e) {
            console.error("Falha ao salvar favorito:", e);
            setToast({ message: 'Erro ao salvar favorito.', type: 'error' });
        }
        return newFavorites;
    });
  };

  const handleClearFavorites = () => {
    if (window.confirm('Tem certeza que deseja limpar todas as rotas favoritas?')) {
      setFavorites([]);
      try {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);
        setToast({ message: 'Favoritos limpos!', type: 'success' });
      } catch (e) {
        console.error("Falha ao limpar favoritos:", e);
        setToast({ message: 'Erro ao limpar favoritos.', type: 'error' });
      }
    }
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites(prev => {
        const updated = prev.filter(fav => fav.id !== id);
        try {
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
            setToast({ message: 'Favorito removido.', type: 'info' });
        } catch (e) { console.error("Falha ao remover favorito:", e); }
        return updated;
    });
  };

  // --- LÓGICA DE NAVEGAÇÃO ---
  const handleSelectOrigin = (nodeId: string, label?: string) => {
    setOriginId(nodeId);
    setOriginLabel(label || null);
    setPath(null);
    setDestinationPoi(null);
    setToast({ message: `📍 Ponto de partida: ${label || 'Local marcado'}`, type: 'success' });
  };

  const handleRouteCalculated = (newPath: Node2D[], instructions: TurnInstruction[], destPoi: Poi) => {
    setPath(newPath);
    setTurnInstructions(instructions);
    setDestinationPoi(destPoi);
    setToast({ message: '🗺️ Rota calculada com sucesso!', type: 'success' });
    if (originId && originLabel) {
        addRouteToHistory({
          originId,
          originLabel,
          destinationId: destPoi.nodeId,
          destinationLabel: destPoi.label,
        });
    }
  };

  const handleSelectHistoricRoute = (entry: HistoryEntry) => {
    setIsHistoryOpen(false);
    handleSelectOrigin(entry.originId, entry.originLabel);
    setDestinationTrigger(entry.destinationId);
  };

  const handleSelectFavorite = (entry: FavoriteEntry) => {
    setIsFavoritosOpen(false);
    handleSelectOrigin(entry.originId, entry.originLabel);
    setDestinationTrigger(entry.destinationId);
  };

  const clearRoute = () => {
    setPath(null);
    setDestinationPoi(null);
    setTurnInstructions([]);
    setToast({ message: 'Rota removida', type: 'info' });
  };

  const clearOrigin = () => {
    setOriginId(null);
    setOriginLabel(null);
    setPath(null);
    setDestinationPoi(null);
    setTurnInstructions([]);
    setToast({ message: 'Ponto de partida removido', type: 'info' });
  };

  const menuItems = [
    { icon: 'fa-star', label: 'Favoritos', action: () => { setIsFavoritosOpen(true); setIsMenuOpen(false); } },
    { icon: 'fa-clock-rotate-left', label: 'Histórico de rotas', action: () => { setIsHistoryOpen(true); setIsMenuOpen(false); }},
    { icon: 'fa-circle-question', label: 'Ajuda', action: () => navigate('/ajuda') },
    { icon: 'fa-sliders', label: 'Configuração', action: () => navigate('/configuracoes') },
  ];

  return (
    <div id="map-app-container">
      {isMenuOpen && <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)}></div>}
      
      <header className="top-bar">
        <i className="fa-solid fa-bars menu-icon" onClick={() => setIsMenuOpen(true)}></i>
        <Link to="/" className="logo-container">
          <img src={logoIcon} alt="Ícone Gnomon" />
          <span>GNOMON</span>
        </Link>
        <Link to="/perfil">
          <i className="fa-solid fa-user profile-icon"></i>
        </Link>
      </header>

      {isMenuOpen && (
        <div className="header-menu-popup">
          <div className="popup-header">
            <h3>Menu</h3>
            <button onClick={() => setIsMenuOpen(false)} className="close-menu-btn">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <nav className="popup-nav">
            {menuItems.map(item => (
              <button key={item.label} onClick={item.action} className="popup-nav-item">
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      <HistoricoPopup
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={routeHistory}
        onSelectRoute={handleSelectHistoricRoute}
        onClearHistory={handleClearHistory}
      />

      <FavoritosPopup
        isOpen={isFavoritosOpen}
        onClose={() => setIsFavoritosOpen(false)}
        favorites={favorites}
        onSelectFavorite={handleSelectFavorite}
        onClearFavorites={handleClearFavorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <main className="content-area">
        <div className="map-background-logo"></div>

        <div className="search-bar-container">
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Buscar local, sala ou serviço..." />
            <div className="view-toggle">
              <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D</button>
              <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D</button>
            </div>
          </div>
        </div>

        <ParticlesBackground color="#3498db" />

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
              initialZoomMultiplier={isMobile ? 4.0 : 1.2}
              animationOptions={isMobile 
                ? { routeAnimationDuration: 500, showHintAnimations: true } 
                : {}}
              destinationToRoute={destinationTrigger}
              onDestinationRouted={() => setDestinationTrigger(null)}
            />
          )}
        </div>

        <div className="bottom-controls-overlay">
          {originId && !path && (
            <div className="origin-indicator">
              <span>
                Você está em: <strong>{originLabel || 'Local selecionado'}</strong>
              </span>
              <button onClick={clearOrigin} title="Remover ponto de partida">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          {path && (
            <div className="route-controls">
              <button onClick={clearRoute} className="clear-route-btn">
                <i className="fa-solid fa-xmark"></i> Limpar Rota
              </button>
              <button onClick={addRouteToFavorites} className="favorite-btn" title="Adicionar rota aos favoritos">
                <i className="fa-regular fa-star"></i>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}