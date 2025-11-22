import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Para IDs únicos
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import Campus3D from '../../components/Map3d/Campus3d';
import Map2D, { 
  type TurnInstruction,
  type Node2D,
  type Poi
} from '../../components/Map2d/Map2D';
import RouteInstructions from '../../components/RoutesInstructions/RouteInstructions';
import Toast from '../../components/Toast/Toast';
import { useThemeVars } from '../../libs/useThemeVars';
import { useMapData } from '../../hooks/useMapData';
import { useMapSettings } from '../../contexts/MapSettingsContext';
import { useMap } from '../../contexts/MapContext';
import { useAuth } from '../../hooks/useAuth'; // Importar o hook
import { HistoricoPopup, type HistoryEntry } from '../../components/Historico/HistoricoPopup';
import { FavoritosPopup, type FavoriteEntry } from '../../components/Favoritos/FavoritosPopup';
import { StagedPointsPanel, type StagedPoint } from '../../components/StagedPoints/StagedPointsPanel';
import { ThemeSwitcher } from '../../components/Theme/ThemeSwitcher';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import './MapaPage.css';

const ParticlesBackground = lazy(() => 
  import('../../components/Particles/ParticlesBackground').then(module => ({
    default: module.ParticlesBackground
  }))
);

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

type EditTool = 'add_poi' | 'add_entrance' | 'add_connection' | 'none';

const HISTORY_STORAGE_KEY = 'gnomon_route_history';
const FAVORITES_STORAGE_KEY = 'gnomon_favorite_routes';

export function MapaPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFavoritosOpen, setIsFavoritosOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false); // Estado para o BottomSheet
  const { mode } = useMapSettings(); // Usando o contexto
  const { setMapType } = useMap();
  const [topDown] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { user, isAuthenticated } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  // Estados para o editor de mapa
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });
  const [editTool, setEditTool] = useState<EditTool>('none');
  const [stagedPoints, setStagedPoints] = useState<StagedPoint[]>([]);


  const { data: mapData, imageUrl, loading: mapLoading, error: mapError } = useMapData();

  const [originId, setOriginId] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState<string | null>(null);
  const [path, setPath] = useState<Node2D[] | null>(null);
  const [destinationPoi, setDestinationPoi] = useState<Poi | null>(null);
  const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [routeHistory, setRouteHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [destinationTrigger, setDestinationTrigger] = useState<string | null>(null);
  const [focusOnPoi, setFocusOnPoi] = useState<string | null>(null);
  const [sheetPeekHeight, setSheetPeekHeight] = useState(0); // Novo estado para a altura do peek

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Poi[]>([]);

  const { routePrimary } = useThemeVars();

  // Efeito para definir o mapa com base na autenticação
  useEffect(() => {
    if (isAuthenticated) {
      setMapType('staff');
    } else {
      setMapType('cima');
    }
  }, [isAuthenticated, setMapType]);

  // Efeito para ler a altura do peek do BottomSheet do CSS
  useEffect(() => {
    const root = document.documentElement;
    const peekHeight = parseInt(getComputedStyle(root).getPropertyValue('--sheet-peek-height')) || 0;
    setSheetPeekHeight(peekHeight);
  }, []);

  // Efeito para filtrar POIs com base no termo de busca
  useEffect(() => {
    if (!searchTerm || !mapData?.pois) {
      setSearchResults([]);
      return;
    }
    const filtered = mapData.pois.filter(poi =>
      poi.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchTerm, mapData]);

  // Função para lidar com a seleção de um resultado de busca
  const handleSelectSearchResult = (poi: Poi) => {
    setSearchTerm(''); // Limpa o termo de busca
    setSearchResults([]); // Limpa os resultados

    if (!originId) {
      // Se não há origem, foca no POI e abre o popup
      setFocusOnPoi(poi.id);
      setIsSheetOpen(false); // Fecha o bottom sheet para focar no mapa
    } else {
      // Se há origem, calcula a rota
      setDestinationTrigger(poi.nodeId);
      setDestinationPoi(poi); // Define o POI de destino
      setIsSheetOpen(false); // Fecha o bottom sheet após calcular a rota
    }
  };

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
        setIsHistoryOpen(false);
        setIsFavoritosOpen(false);
        setIsSheetOpen(false); // Fecha o bottom sheet também
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- LÓGICA DO EDITOR DE MAPA ---
  const handleMapClick = (coords: { x: number; y: number }) => {
    if (!isEditMode || editTool === 'none') {
      if (editTool === 'none' && isEditMode) {
        setToast({ message: 'Selecione uma ferramenta de edição primeiro.', type: 'info' });
      }
      return;
    }
    
    setStagedPoints(prev => [...prev, { ...coords, type: editTool }]);
    setToast({ message: `Ponto adicionado: ${editTool}.`, type: 'success' });
  };

  const handleDeleteStagedPoint = (index: number) => {
    setStagedPoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllStagedPoints = () => {
    if (window.confirm('Tem certeza que deseja apagar todos os pontos marcados?')) {
      setStagedPoints([]);
      setToast({ message: 'Todos os pontos marcados foram removidos.', type: 'info' });
    }
  };

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
    if (isEditMode) return;
    setOriginId(nodeId);
    setOriginLabel(label || null);
    setPath(null);
    setDestinationPoi(null);
    // setToast({ message: `📍 Ponto de partida: ${label || 'Local marcado'}`, type: 'success' });
  };

  const handleRouteCalculated = (newPath: Node2D[], instructions: TurnInstruction[], destPoi: Poi) => {
    setPath(newPath);
    setTurnInstructions(instructions);
    setDestinationPoi(destPoi);
    // setToast({ message: '🗺️ Rota calculada com sucesso!', type: 'success' });
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

  const handleSelectFeaturedPlace = (place: { nodeId: string; poiId: string }) => {
    setIsSheetOpen(false);
    if (originId) {
      // Se já tem uma origem, calcula a rota
      setDestinationTrigger(place.nodeId);
    } else {
      // Se não, apenas foca no POI
      setFocusOnPoi(place.poiId);
    }
  };

  const clearOrigin = () => {
    setOriginId(null);
    setOriginLabel(null);
    setPath(null);
    setDestinationPoi(null);
    setTurnInstructions([]);
  };

  const featuredPlaces = [
    { label: 'CRA', poiId: 'ref_cra', nodeId: 'R1_CRA', photoUrl: '/places/cra.jpg' },
    { label: 'Auditório', poiId: 'ref_auditorio', nodeId: 'R6_AUDITORIO', photoUrl: '/places/auditorio.jpg' },
    { label: 'Cantina', poiId: 'ref_cantina', nodeId: 'R9_CANTINA', photoUrl: '/places/cantina.png' },
  ];

  const menuItems = [
    { icon: 'fa-star', label: 'Favoritos', action: () => { setIsFavoritosOpen(true); setIsSheetOpen(false); } },
    { icon: 'fa-clock-rotate-left', label: 'Histórico de rotas', action: () => { setIsHistoryOpen(true); setIsSheetOpen(false); }},
    { icon: 'fa-circle-question', label: 'Ajuda', action: () => { navigate('/ajuda'); setIsSheetOpen(false); } },
    { icon: 'fa-sliders', label: 'Configuração', action: () => { navigate('/configuracoes'); setIsSheetOpen(false); } },
  ];

  return (
    <div id="map-app-container">
      <header className="top-bar">
        <div className="container">
          <Link to="/" className="logo-container">
            <img src={logoIcon} alt="Ícone Gnomon" />
            <span>GNOMON</span>
          </Link>
          <nav className="header-nav">
            <ThemeSwitcher />
            <Link to={isAuthenticated ? '/perfil' : '/login'} className="profile-link">
              <i className="fa-solid fa-user profile-icon"></i>
            </Link>
          </nav>
        </div>
      </header>

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

      <StagedPointsPanel
        isVisible={isEditMode}
        points={stagedPoints}
        onDeletePoint={handleDeleteStagedPoint}
        onClearAll={handleClearAllStagedPoints}
        onClose={() => setIsEditMode(false)}
      />

      <main className={`content-area ${isEditMode ? 'edit-mode-active' : ''}`}>
        <div className="top-left-ui-container">
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          <div className="compact-route-display">
            <div className="route-step">
              <div className={`route-step-marker ${originId ? 'complete' : 'pending'}`}>
                <i className={`fa-solid ${originId ? 'fa-check' : 'fa-location-dot'}`}></i>
              </div>
              <div className="route-step-info">
                <span className="route-step-label">Origem</span>
                <span className="route-step-value">
                  {originLabel || 'Selecione seu local'}
                </span>
              </div>
            </div>

            {path && destinationPoi && (
              <>
                <div className="route-step-connector"></div>
                <div className="route-step">
                  <div className="route-step-marker complete">
                    <i className="fa-solid fa-map-pin"></i>
                  </div>
                  <div className="route-step-info">
                    <span className="route-step-label">Destino</span>
                    <span className="route-step-value">{destinationPoi.label}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {path && destinationPoi && (
            <div className="floating-button-wrapper">
              <button onClick={addRouteToFavorites} className="floating-action-button favorite-route-btn" title="Adicionar rota aos favoritos">
                <i className="fa-regular fa-star"></i>
              </button>
              <button onClick={clearOrigin} className="floating-action-button clear-route-main-btn" title="Limpar Rota">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
        </div>

        <div className="floating-buttons-container">
        </div>

        <div className="admin-buttons-container">
            {isAuthenticated && user?.role === 'ADMIN' && (
                <>
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`admin-edit-button ${isEditMode ? 'active' : ''}`}>
                        <i className={`fa-solid ${isEditMode ? 'fa-times' : 'fa-pencil'}`}></i>
                        <span>{isEditMode ? 'Sair' : 'Editar'}</span>
                    </button>
                </>
            )}
        </div>

        {isEditMode && (
            <div className="map-editor-ui">
                <div className="editor-toolbar">
                    <button onClick={() => setEditTool('add_entrance')} className={editTool === 'add_entrance' ? 'active' : ''} title="Adicionar Entrada">
                        <i className="fa-solid fa-door-open"></i>
                    </button>
                    <button onClick={() => setEditTool('add_poi')} className={editTool === 'add_poi' ? 'active' : ''} title="Adicionar Ponto de Referência">
                        <i className="fa-solid fa-map-pin"></i>
                    </button>
                    <button onClick={() => setEditTool('add_connection')} className={editTool === 'add_connection' ? 'active' : ''} title="Adicionar Nó de Conexão">
                        <i className="fa-solid fa-circle-plus"></i>
                    </button>
                </div>
                <div className="coords-display">
                    X: {cursorCoords.x}, Y: {cursorCoords.y}
                </div>
            </div>
        )}

        <div className="map-background-logo"></div>

        <Suspense fallback={null}>
          <ParticlesBackground color="#3498db" />
        </Suspense>

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
          {mapLoading && <div className="map-loading-overlay">Carregando mapa...</div>}
          {mapError && <div className="map-loading-overlay error">Erro ao carregar o mapa: {mapError}</div>}
          {!mapLoading && !mapError && mode === '3d' ? (
            <Campus3D url="/models/Campus.glb" topDown={topDown} />
          ) : (
            <Map2D
              mapData={mapData}
              mapImageUrl={imageUrl}
              strokeColor={routePrimary}
              path={path}
              originId={originId}
              destinationPoi={destinationPoi}
              onSelectOrigin={handleSelectOrigin}
              onRouteCalculated={handleRouteCalculated}
              initialZoomMultiplier={isMobile ? 1.5 : 1.2}
              animationOptions={isMobile 
                ? { routeAnimationDuration: 500, showHintAnimations: true } 
                : {}}
              destinationToRoute={destinationTrigger}
              onDestinationRouted={() => setDestinationTrigger(null)}
              focusOnPoi={focusOnPoi}
              onFocusDone={() => setFocusOnPoi(null)}
              onPanStart={() => setIsSheetOpen(false)}
              isEditMode={isEditMode}
              editTool={editTool}
              onMapClick={handleMapClick}
              onCursorMove={setCursorCoords}
              isBottomSheetOpen={isSheetOpen} // Passa o estado do BottomSheet
              bottomSheetPeekHeight={sheetPeekHeight} // Passa a altura do peek
            />
          )}
        </div>
      </main>

      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        onOpen={() => setIsSheetOpen(true)}
      >
        <div className="route-finder">
          <div className="search-input-container">
            <div className="input-wrapper">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Para onde vamos?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSheetOpen(true)} // Abre o sheet ao focar
              />
            </div>
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {searchTerm && searchResults.length > 0 && (
            <div className="search-results-list">
              {searchResults.map(poi => (
                <button 
                  key={poi.id} 
                  className="search-result-item" 
                  onClick={() => handleSelectSearchResult(poi)}
                >
                  <span>{poi.label}</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sheet-divider"></div>

        <div className="featured-places">
          <h2>Lugares mais acessados</h2>
          <div className="featured-places-list">
            {featuredPlaces.map(place => (
              <button key={place.poiId} className="featured-place-button" onClick={() => handleSelectFeaturedPlace(place)}>
                <img src={place.photoUrl} alt={place.label} className="featured-place-photo" />
                <span className="featured-place-label">{place.label}</span>
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            ))}
          </div>
        </div>
        <nav className="popup-nav">
          {menuItems.map(item => (
            <button key={item.label} onClick={item.action} className="popup-nav-item">
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </BottomSheet>
    </div>
  );
}

