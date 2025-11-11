import { useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../assets/Gnomon Logo _ SEM NOME.png';
import Campus3D from '../../components/Campus3d';
import Map2D, { type MarkKind, type Mark2D, type TurnInstruction } from '../../components/Map2D';
import type { Node2D } from '../../hooks/useNavigation2D';
import RouteInstructions from '../../components/RouteInstructions';
import PointsHistory from '../../components/PointsHistory';
import { useThemeVars } from '../../libs/useThemeVars';
import './MapaPage.css';

export default function MapaPage() {
  const [activeNav, setActiveNav] = useState('Mapa');
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [topDown] = useState(false);

  // Detecção de mobile em modo retrato para girar o mapa
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

  // Mapas e grafos
  const DETAIL_MAP = '/maps/Campus_2D_DETALHE.png';
  const DETAIL_GRAPH = '/maps/nodes-2d-detalhe.json';
  const CORRIDORS_GRAPH = '/maps/corridors-floor0.json';

  // Admin - marcação de Entrada/Referência
  const [adminMode, setAdminMode] = useState(false);
  const [markKind, setMarkKind] = useState<MarkKind>('ENTRY');
  const [marks, setMarks] = useState<Mark2D[]>([]);
  const [lastMark, setLastMark] = useState<{ x: number; y: number; kind: MarkKind } | null>(null);
  const [capturedPoints, setCapturedPoints] = useState<{ x: number; y: number; kind: MarkKind }[]>([]);

  // Admin - Editor de Conexões
  const [editGraph, setEditGraph] = useState(false);
  const [editTool, setEditTool] = useState<'node' | 'edge' | 'delete'>('node');
  const [editorNodeKind, setEditorNodeKind] = useState<'INTERSECTION' | 'WAYPOINT'>('INTERSECTION');
  const [editorBidirectional, setEditorBidirectional] = useState(true);

  const [editorAccessible, setEditorAccessible] = useState(true);
  const [editorData, setEditorData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  // Encaixe origem/dest no corredor (px)
  const [doorSnapPx, setDoorSnapPx] = useState(28);

  // Origem/destino selecionados (para lógica de troca)
  const [originNodeId, setOriginNodeId] = useState<string | null>(null);
  const [destNodeId, setDestNodeId] = useState<string | null>(null);
  const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]); // Novo estado para as instruções de rota


  const { routePrimary } = useThemeVars();

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { }
  };

  // JSON para Local (sala/serviço/entrada)
  const copyLocalJSON = () => {
    if (!lastMark) return;
    const isEntry = lastMark.kind === 'ENTRY';
    const obj = {
      name: isEntry ? 'Entrada Principal' : 'Nome do Local',
      description: null,
      code: isEntry ? null : 'COD-000',
      type: isEntry ? 'ENTRANCE' : 'OTHER',
      x: Number(lastMark.x.toFixed(2)),
      y: Number(lastMark.y.toFixed(2)),
      z: 0,
      floor: 0,
      building: 'A',
      iconUrl: null,
      imageUrl: null,
      accessible: true,
      mapId: 1
    };
    copy(JSON.stringify(obj, null, 2));
  };

  // JSON para GraphNode
  const copyGraphNodeJSON = () => {
    if (!lastMark) return;
    const obj = {
      name: lastMark.kind === 'ENTRY' ? 'Entrada' : 'Ponto de Referência',
      x: Number(lastMark.x.toFixed(2)),
      y: Number(lastMark.y.toFixed(2)),
      z: 0,
      floor: 0,
      building: 'A',
      type: lastMark.kind === 'ENTRY' ? 'ENTRANCE' : 'DESTINATION'
    };
    copy(JSON.stringify(obj, null, 2));
  };

  const clearMarks = () => {
    setMarks([]);
    setLastMark(null);
    setCapturedPoints([]);
  };

  // Copiar JSON das conexões




  const handleSelectOrigin = (nodeId: string) => {
    setOriginNodeId(nodeId);
  };

  const handleRequestRoute = (payload: { fromId: string; toId: string; fromPoiId?: string; toPoiId?: string }) => {
    setOriginNodeId(payload.fromId);
    setDestNodeId(payload.toId);
  };

  const handleRouteCalculated = (path: Node2D[], instructions: TurnInstruction[]) => {
    setTurnInstructions(instructions);
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
        {/* Painel de Instruções de Rota */}
        {turnInstructions.length > 0 && (
          <RouteInstructions
            instructions={turnInstructions}
            onClose={() => setTurnInstructions([])}
          />
        )}
        <div id="map-container">
          {mode === '3d' ? (
            <Campus3D url="/models/Campus.glb" topDown={topDown} />
          ) : (
            <div
              className={isMobilePortrait ? 'rotate-map' : ''}
              style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
            >
              <Map2D
                mapImageUrl={DETAIL_MAP}
                graphUrl={DETAIL_GRAPH}
                corridorsUrl={CORRIDORS_GRAPH}
                strokeColor={routePrimary}
                markMode={adminMode}
                markKind={markKind}
                showCoords={adminMode}
                showPoiLabels={adminMode}
                marks={marks}

                onMark={(p: { x: number; y: number; kind: MarkKind }) => {
                  setLastMark(p);
                  setCapturedPoints(prev => [...prev, p]);
                  setMarks((prev: Mark2D[]) => [...prev, { id: 'm' + Date.now(), ...p }]);
                }}
                onMarksChange={setMarks}
                editGraph={adminMode && editGraph}
                editTool={editTool}
                editorNodeKind={editorNodeKind}
                editorEdgeKind="CORRIDOR"
                editorBidirectional={editorBidirectional}
                editorAccessible={editorAccessible}
                onEditorChange={setEditorData}
                doorSnapPx={doorSnapPx}
                showCorridorsOverlay={true} // Always true now
                // callbacks (precisam do patch no Map2D – ver guia abaixo)
                // quando o usuário clicar “Estou aqui”
                // @ts-ignore
                onSelectOrigin={(nodeId: string) => handleSelectOrigin(nodeId)}
                // quando o usuário clicar “Ir para cá”
                // @ts-ignore
                onRequestRoute={(payload: { fromId: string; toId: string; fromPoiId?: string; toPoiId?: string }) => handleRequestRoute(payload)}
                onRouteCalculated={handleRouteCalculated}
              />

              {adminMode && <PointsHistory points={capturedPoints} onClear={clearMarks} />}
            </div>
          )}
        </div>

        {/* OVERLAY DE CONTROLES SOBRE O MAPA */}
        <div className="map-controls-overlay">
          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="search" placeholder="Buscar local, sala ou serviço..." />
            <div className="view-toggle">
              <button className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D</button>
              <button className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D</button>
            </div>

            {/* Botão Admin */}
            <button
              onClick={() => setAdminMode(v => !v)}
              className={`admin-toggle-main ${adminMode ? 'active' : ''}`}
              title="Modo Admin: marcar locais e conexões no mapa"
            >
              {adminMode ? 'Admin ON' : 'Admin OFF'}
            </button>
          </div>

          {/* Painel Admin - Entrada/Referência */}
          {mode === '2d' && adminMode && (
            <div className="admin-panel">
              <div className="admin-buttons">
                <button
                  onClick={() => setMarkKind('ENTRY')}
                  className={markKind === 'ENTRY' ? 'active' : ''}
                  title="Marcar PONTO DE ENTRADA"
                >
                  Entrada
                </button>
                <button
                  onClick={() => setMarkKind('REF')}
                  className={markKind === 'REF' ? 'active' : ''}
                  title="Marcar PONTO DE REFERÊNCIA"
                >
                  Referência
                </button>
                <button
                  onClick={() => setMarkKind('CONNECTION')}
                  className={markKind === 'CONNECTION' ? 'active' : ''}
                  title="Marcar PONTO DE CONEXÃO"
                >
                  Conexão
                </button>
              </div>

              {lastMark && (
                <span className="admin-info">
                  {lastMark.kind === 'ENTRY' ? 'Entrada' : lastMark.kind === 'REF' ? 'Referência' : 'Conexão'} · x: {lastMark.x.toFixed(1)} · y: {lastMark.y.toFixed(1)}
                </span>
              )}
              <div className="admin-actions">
                <button onClick={copyLocalJSON}>Copiar Local</button>
                <button onClick={copyGraphNodeJSON}>Copiar Nó</button>
                <button onClick={clearMarks}>Limpar</button>
              </div>
            </div>
          )}

          {/* Painel Admin - Conexões */}
          {mode === '2d' && adminMode && (
            <div className="admin-panel">
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                <strong>Conexões</strong>
                <button
                  onClick={() => setEditGraph(v => !v)}
                  className={`admin-toggle ${editGraph ? 'active' : ''}`}
                  title="Habilitar edição de conexões"
                >
                  {editGraph ? 'Editor ON' : 'Editor OFF'}
                </button>
              </div>

              <div className="admin-buttons">
                <button
                  onClick={() => setEditTool('node')}
                  className={editTool === 'node' ? 'active' : ''}
                  title="Adicionar ponto de conexão"
                >
                  Ponto
                </button>
                <button
                  onClick={() => setEditTool('edge')}
                  className={editTool === 'edge' ? 'active' : ''}
                  title="Conectar nós"
                >
                  Conectar
                </button>
                <button
                  onClick={() => setEditTool('delete')}
                  className={`delete ${editTool === 'delete' ? 'active' : ''}`}
                  title="Apagar nó"
                >
                  Apagar
                </button>
              </div>

              <div className="admin-options">
                <select
                  value={editorNodeKind}
                  onChange={(e) => setEditorNodeKind(e.target.value as 'INTERSECTION' | 'WAYPOINT')}
                >
                  <option value="INTERSECTION">INTERSECTION</option>
                  <option value="WAYPOINT">WAYPOINT</option>
                </select>
                <label>
                  <input type="checkbox" checked={editorBidirectional} onChange={(e) => setEditorBidirectional(e.target.checked)} />
                  bidirecional
                </label>
              </div>
            </div>
          )}
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