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
  const [adminMode, setAdminMode] = useState(false);
  const [editTool, setEditTool] = useState<'node' | 'delete'>('node');
  const [clickedCoords, setClickedCoords] = useState<{ x: number, y: number } | null>(null);

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

  const handleCopyCoords = () => {
    if (clickedCoords) {
      const coordsString = `"x": ${clickedCoords.x}, "y": ${clickedCoords.y}`;
      navigator.clipboard.writeText(coordsString).then(() => {
        setToast({ message: 'Coordenadas copiadas!', type: 'success' });
      }).catch(err => {
        console.error('Erro ao copiar coordenadas: ', err);
        setToast({ message: 'Erro ao copiar.', type: 'error' });
      });
    }
  };

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
                editGraph={adminMode}
                editTool={editTool}
                showCoords={adminMode}
                onMapClick={setClickedCoords}
                onEditorChange={(data) => {
                  console.clear();
                  console.log('--- DADOS DO EDITOR (JSON) ---');
                  console.log(JSON.stringify(data, null, 2));
                  alert('Dados do mapa atualizados! Verifique o console do navegador (F12).');
                }}
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
          <button onClick={() => setAdminMode(!adminMode)} style={{ position: 'absolute', top: '120px', right: '20px', zIndex: 1001, pointerEvents: 'auto', background: adminMode ? '#FF3B30' : '#34C759', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {adminMode ? 'Sair do Modo Admin' : 'Modo Admin'}
          </button>

          {adminMode && (
            <div className="admin-panel">
              <h3 className="admin-title">Painel de Edição</h3>
              <div className="admin-tools">
                <button className={`admin-tool-btn ${editTool === 'node' ? 'active' : ''}`} onClick={() => setEditTool('node')}>
                  <i className="fa-solid fa-map-marker-alt"></i> Marcar Ponto
                </button>
                <button className={`admin-tool-btn ${editTool === 'delete' ? 'active' : ''}`} onClick={() => setEditTool('delete')}>
                  <i className="fa-solid fa-trash"></i> Deletar Ponto
                </button>
              </div>
              <div className="admin-coords">
                <h4 className="coords-title">Coordenadas</h4>
                <pre className="coords-display">
                  {clickedCoords ? `"x": ${clickedCoords.x},\n"y": ${clickedCoords.y}` : 'Clique no mapa...'}
                </pre>
                <button className="copy-btn" onClick={handleCopyCoords} disabled={!clickedCoords}>
                  <i className="fa-solid fa-copy"></i> Copiar
                </button>
              </div>
            </div>
          )}
          <div 
            className="search-bar" 
            style={{ 
              pointerEvents: 'auto', // ✅ BARRA É CLICÁVEL
              marginTop: '80px'
            }}
          >
            {/* Conteúdo da barra de busca aqui */}
          </div>
        </div>
      </main>
    </div>
  );
}