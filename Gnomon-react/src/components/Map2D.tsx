import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useThemeVars } from '../libs/useThemeVars';
import { useMapData, type MapData, type MapNode, type Poi } from '../hooks/useMapData';
import { usePathfinding } from '../hooks/usePathfinding';

export type { MapNode, Poi };
export type Node2D = MapNode;

export type MarkKind = 'ENTRY' | 'REF' | 'CONNECTION';
export type Mark2D = { id: string; x: number; y: number; kind: MarkKind };
export type TurnInstruction = { text: string; distance: number; icon: string };

type Props = {
  mapData?: MapData | null;
  mapImageUrl: string;
  strokeColor?: string;
  path?: MapNode[] | null;
  originId?: string | null;
  onSelectOrigin?: (nodeId: string, label?: string) => void;
  onRouteCalculated?: (path: MapNode[], instructions: TurnInstruction[]) => void;
  markMode?: boolean;
  markKind?: MarkKind;
  showCoords?: boolean;
  showPoiLabels?: boolean;
  marks?: Mark2D[];
  onMark?: (p: { x: number; y: number; kind: MarkKind }) => void;
  editGraph?: boolean;
  editTool?: 'node' | 'edge' | 'delete';
  editorNodeKind?: 'INTERSECTION' | 'WAYPOINT';
  editorBidirectional?: boolean;
  editorAccessible?: boolean;
  onEditorChange?: (data: { nodes: any[]; edges: any[] }) => void;
  doorSnapPx?: number;
  showCorridorsOverlay?: boolean;
};

type Transform = { x: number; y: number; scale: number };

export default function Map2D({
  mapData: mapDataProp,
  mapImageUrl,
  strokeColor = '#00AEF0',
  path,
  originId,
  onSelectOrigin = () => {},
  onRouteCalculated = () => {},
  markMode = false,
  markKind = 'ENTRY',
  showCoords = false,
  showPoiLabels = false,
  marks = [],
  onMark = () => {},
  editGraph = false,
  editTool = 'node',
  editorNodeKind: _editorNodeKind = 'INTERSECTION',
  editorBidirectional = true,
  editorAccessible: _editorAccessible = true,
  onEditorChange = () => {},
  doorSnapPx: _doorSnapPx = 24,
  showCorridorsOverlay = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const { data: mapDataInternal } = useMapData();
  const currentMapData = mapDataProp || mapDataInternal;

  const pathfinder = usePathfinding(currentMapData);
  const pathToDraw = path ?? null;

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' } | null>(null);

  const [showHints, setShowHints] = useState(true);
  const { bg3d } = useThemeVars();

  const [selectedNodeForEdge, setSelectedNodeForEdge] = useState<string | null>(null);

  // ✅ NOVO ESTADO PARA CONTROLAR ANIMAÇÃO
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Ativa/desativa a animação baseada na presença de originId
    setIsAnimating(!!originId);
  }, [originId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  function resizeCanvas() {
    const c = canvasRef.current, wrap = containerRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    c.width = Math.max(1, Math.floor(w * dpr));
    c.height = Math.max(1, Math.floor(h * dpr));
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    const ctx = c.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      setImg(im);
      const c = canvasRef.current;
      if (!c) return;
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const cw = c.clientWidth, ch = c.clientHeight;
      const initialScale = cw / iw;
      const scale = initialScale * 1.2;
      const x = (cw - iw * scale) / 2;
      const y = (ch - ih * scale) / 2;
      setTransform({ x, y, scale });
    };
    im.src = mapImageUrl;
  }, [mapImageUrl]);

  useEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function worldToScreen(x: number, y: number) {
    return { sx: transform.x + x * transform.scale, sy: transform.y + y * transform.scale };
  }
  function screenToWorld(sx: number, sy: number) {
    return { x: (sx - transform.x) / transform.scale, y: (sy - transform.y) / transform.scale };
  }

  function normalizePoiType(t?: string) { return String(t ?? '').trim().toLowerCase(); }
  function getPoiVisual(poiType?: string) {
    const isEntrance = normalizePoiType(poiType).includes('entr');
    return { isEntrance, color: isEntrance ? '#0A84FF' : '#FFCC00', radius: isEntrance ? 10 : 6 };
  }

  function drawRoute(ctx: CanvasRenderingContext2D, pts: MapNode[], color = strokeColor) {
    if (!pts || pts.length < 2) return;
    const inv = 1 / transform.scale;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 5 * inv;
    ctx.lineWidth = 6 * inv;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0 || i === pts.length - 1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 * inv, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? '#34C759' : '#FF3B30';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2 * inv;
        ctx.stroke();
      }
    }
  }

  function drawGpsMarker(ctx: CanvasRenderingContext2D, x: number, y: number, inv: number) {
    const t = Date.now() * 0.001;
    const pulse = Math.sin(t * 2) * 0.5 + 0.5;
    const size = 12 * inv;
    const ring = (12 + pulse * 8) * inv;

    ctx.beginPath();
    ctx.arc(x, y, ring, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(10,132,255,${0.3 * (1 - pulse)})`;
    ctx.lineWidth = 2 * inv;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,132,255,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#0A84FF';
    ctx.lineWidth = 1.5 * inv;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#0A84FF';
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2 * inv;
    ctx.stroke();
  }

  useEffect(() => {
    if (!currentMapData) return;
    const missing = (currentMapData.pois || []).filter(p => !currentMapData.nodes.find(n => n.id === p.nodeId));
    if (missing.length) console.warn('POIs com nodeId sem nó correspondente:', missing);
  }, [currentMapData]);

  useEffect(() => {
    if (!popup) { setPopupPos(null); return; }
    const wrap = containerRef.current; if (!wrap) return;
    const cw = wrap.clientWidth, ch = wrap.clientHeight, pad = 8, W = 280, H = popup.photoUrl ? 300 : 210;
    const downTop = popup.y + 12;
    const canDown = downTop + H + pad <= ch;
    const top = canDown ? downTop : Math.max(pad, popup.y - H - 12);
    const left = Math.min(Math.max(popup.x - W / 2, pad), cw - W - pad);
    setPopupPos({ left, top, orientation: canDown ? 'down' : 'up' });
  }, [popup]);

  function draw() {
    try {
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext('2d'); if (!ctx) return;
      const w = c.clientWidth, h = c.clientHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const inv = 1 / transform.scale;

      if (img) {
        ctx.filter = 'brightness(0.8)';
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        ctx.filter = 'none';
      }

      if (!currentMapData) { ctx.restore(); return; }

      if (showCorridorsOverlay || editGraph) {
        ctx.lineWidth = 2 * inv;
        ctx.strokeStyle = editGraph ? '#00F' : '#888';
        ctx.beginPath();
        for (const [a, b] of currentMapData.edges) {
          const A = currentMapData.nodes.find(n => n.id === a);
          const B = currentMapData.nodes.find(n => n.id === b);
          if (A && B) { ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); }
        }
        ctx.stroke();
      }

      if (editGraph) {
        for (const n of currentMapData.nodes) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 * inv, 0, Math.PI * 2);
          ctx.fillStyle = '#00F'; ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1 * inv;
          ctx.fill(); ctx.stroke();
          if (showCoords) {
            ctx.font = `${10 * inv}px Arial`; ctx.fillStyle = '#FFF';
            ctx.fillText(`(${n.x.toFixed(0)}, ${n.y.toFixed(0)})`, n.x + 6 * inv, n.y + 4 * inv);
          }
        }
      }

      if (currentMapData?.pois?.length) {
        ctx.font = `${12 * inv}px Inter, system-ui, sans-serif`;
        for (const poi of currentMapData.pois) {
          const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
          if (!node) continue;
          const { color, radius, isEntrance } = getPoiVisual(poi.type);

          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.45)';
          ctx.shadowBlur = 6 * inv;

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2 * inv;
          ctx.arc(node.x, node.y, radius * inv, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (isEntrance) {
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(node.x, node.y, Math.max(2 * inv, radius * 0.35 * inv), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          if (showPoiLabels) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(poi.label, node.x + (radius + 4) * inv, node.y + 4 * inv);
          }
        }
      }

      if (pathToDraw && pathToDraw.length > 0) {
        drawRoute(ctx, pathToDraw, strokeColor);
      }

      if (originId && currentMapData) {
        const originNode = currentMapData.nodes.find(n => n.id === originId);
        if (originNode) drawGpsMarker(ctx, originNode.x, originNode.y, inv);
      }

      ctx.restore();
    } catch (err) {
      console.error('❌ ERRO no draw():', err);
    }
  }

  useEffect(() => {
    let rafId: number;

    const renderLoop = () => {
      draw();
      // Se a animação estiver ativa (por causa do originId), continue o loop
      if (isAnimating) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    // Inicia o loop de renderização. Ele vai rodar uma vez se não estiver animando,
    // ou continuamente se estiver.
    renderLoop();

    // Função de limpeza para cancelar o loop de animação quando o componente
    // for desmontado ou as dependências do useEffect mudarem.
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    isAnimating, // A dependência principal para o loop
    // Outras dependências que causam um redesenho único quando alteradas
    img, currentMapData, pathToDraw, strokeColor, transform,
    markMode, marks, showCoords, showPoiLabels,
    editGraph, showCorridorsOverlay, originId
  ]);

  const getPointerPos = (e: ReactMouseEvent<HTMLDivElement> | WheelEvent | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 1) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      const t1 = e.touches[0], t2 = e.touches[1];
      return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
    }
    return { x: (e as any).clientX - rect.left, y: (e as any).clientY - rect.top };
  };

  // ✅ Zoom com roda do mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x, y } = getPointerPos(e);
      const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => {
        const newScale = Math.max(0.1, Math.min(prev.scale * scaleAmount, 10));
        const newX = x - (x - prev.x) * (newScale / prev.scale);
        const newY = y - (y - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    };
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, []);

  function nearestNodeId(x: number, y: number, maxDist = 24): string | null {
    if (!currentMapData) return null;
    let best: string | null = null, bestD = Infinity;
    for (const n of currentMapData.nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD && d <= maxDist) { bestD = d; best = n.id; }
    }
    return best;
  }

  function onClick(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (isPanning.current && (Math.abs(e.clientX - lastPos.current.x) > 2 || Math.abs(e.clientY - lastPos.current.y) > 2)) return;

    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    if (!currentMapData) { console.warn('⚠️ Dados do mapa não carregados'); return; }

    if (markMode) { onMark({ x, y, kind: markKind }); return; }

    if (editGraph) {
      const nearNode = nearestNodeId(x, y, 32);
      if (editTool === 'node') {
        const newNode: MapNode = { id: `node_${Date.now()}`, x: Math.round(x), y: Math.round(y), floor: 0 };
        onEditorChange({ nodes: [...currentMapData.nodes, newNode], edges: currentMapData.edges });
      } else if (editTool === 'edge') {
        if (!nearNode) return;
        if (!selectedNodeForEdge) setSelectedNodeForEdge(nearNode);
        else {
          if (nearNode !== selectedNodeForEdge) {
            const newEdges = [...currentMapData.edges];
            newEdges.push([selectedNodeForEdge, nearNode]);
            if (editorBidirectional) newEdges.push([nearNode, selectedNodeForEdge]);
            onEditorChange({ nodes: currentMapData.nodes, edges: newEdges });
          }
          setSelectedNodeForEdge(null);
        }
      } else if (editTool === 'delete') {
        if (nearNode) {
          const newNodes = currentMapData.nodes.filter(n => n.id !== nearNode);
          const newEdges = currentMapData.edges.filter(([a, b]) => a !== nearNode && b !== nearNode);
          onEditorChange({ nodes: newNodes, edges: newEdges });
        }
      }
      return;
    }

    const poi = pickPoiNear(x, y, 40);
    if (poi) {
      const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
      if (!node) { console.error('❌ Nó do POI não encontrado:', poi.nodeId); return; }
      const pos = worldToScreen(node.x, node.y);
      setPopup({ poiId: poi.id, label: poi.label, x: pos.sx, y: pos.sy, photoUrl: poi.photoUrl });
      return;
    }

    console.log('ℹ️ Clique em um local (ícone amarelo/azul) para interagir');
  }

  function pickPoiNear(x: number, y: number, maxDist = 40) {
    if (!currentMapData?.pois) return null;
    let best: (Poi & { d: number }) | null = null;
    for (const poi of currentMapData.pois) {
      const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
      if (!node) continue;
      const d = Math.hypot(node.x - x, node.y - y);
      if (!best || d < best.d) best = { ...poi, d };
    }
    return best && best.d <= maxDist ? best : null;
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setPopup(null);
    setPopupPos(null);
  }

  function setAsOrigin() {
    if (!popup || !currentMapData) return;
    const poi = currentMapData.pois!.find(p => p.id === popup.poiId)!;
    onSelectOrigin(poi.nodeId, poi.label);
    // O pai (MapaPage) é responsável por limpar a rota antiga
    setPopup(null);
    setPopupPos(null);
  }

  function normalizePathToNodes(raw: any): MapNode[] {
    if (!raw) return [];
    if (!currentMapData) return [];
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      const nodes = (raw as string[])
        .map(id => currentMapData.nodes.find(n => n.id === id))
        .filter(Boolean) as MapNode[];
      return nodes;
    }
    return raw as MapNode[];
  }

function goHere() {
  if (!popup || !currentMapData || !pathfinder) {
    console.warn('⚠️ Pré-condições para `goHere` não atendidas');
    return;
  }

  if (!originId) {
    alert('⚠️ Primeiro, defina um local de partida clicando em "Estou aqui".');
    return;
  }

  const poi = currentMapData.pois.find(p => p.id === popup.poiId);
  if (!poi) {
    console.error('❌ POI de destino não encontrado:', popup.poiId);
    return;
  }

  // Fecha o popup imediatamente para o usuário ver o mapa
  setPopup(null);
  setPopupPos(null);

  try {
    const rawPath = pathfinder.findPath(originId, poi.nodeId);
    const foundPath = normalizePathToNodes(rawPath);

    if (foundPath && foundPath.length > 1) {
      // Notifica o componente pai sobre a nova rota
      onRouteCalculated(foundPath, []); // O segundo argumento são as instruções, que não estamos gerando aqui
    } else {
      alert('❌ Não foi possível calcular uma rota para este local.');
      console.error('❌ Caminho inválido ou muito curto:', foundPath);
    }
  } catch (err) {
    console.error('💥 Erro ao calcular rota:', err);
    alert('❌ Ocorreu um erro ao calcular a rota. Verifique o console para mais detalhes.');
  }
}

  return (
    <div
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        touchAction: 'none', // ✅ PREVINE SCROLL/ZOOM PADRÃO
        cursor: isPanning.current ? 'grabbing' : 'grab', 
        background: bg3d,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onMouseDown={(e) => { isPanning.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; }}
      onMouseMove={(e) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseUp={() => { isPanning.current = false; }}
      onMouseLeave={() => { isPanning.current = false; }}
      
      // ✅ TOUCH EVENTS CORRIGIDOS
      onTouchStart={(e) => {
        if (e.touches.length === 1) { 
          isPanning.current = true; 
          lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
        } else if (e.touches.length === 2) { 
          isPanning.current = false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastTouchDist.current = Math.hypot(dx, dy);
        }
      }}
      
      onTouchMove={(e) => {
        // ✅ NÃO CHAME e.preventDefault() AQUI NO INÍCIO!
        
        if (e.touches.length === 1 && isPanning.current) {
          // Pan com 1 dedo
          const dx = e.touches[0].clientX - lastPos.current.x;
          const dy = e.touches[0].clientY - lastPos.current.y;
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          
        } else if (e.touches.length === 2) {
          // ✅ APENAS PREVINE PARA PINCH ZOOM
          e.preventDefault();
          
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          
          if (lastTouchDist.current > 0) {
            const scaleAmount = dist / lastTouchDist.current;
            const rect = canvasRef.current!.getBoundingClientRect();
            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            
            setTransform(prev => {
              const newScale = Math.max(0.1, Math.min(prev.scale * scaleAmount, 10));
              const newX = cx - (cx - prev.x) * (newScale / prev.scale);
              const newY = cy - (cy - prev.y) * (newScale / prev.scale);
              return { x: newX, y: newY, scale: newScale };
            });
          }
          
          lastTouchDist.current = dist;
        }
      }}
      
      onTouchEnd={() => { isPanning.current = false; lastTouchDist.current = 0; }}
    >
      {showHints && (
        <div className="interaction-hints">
          <div className="hint-item"><i className="fa-solid fa-hand hint-icon pan-icon"></i><span className="hint-text">Arraste para mover</span></div>
          <div className="hint-item"><i className="fa-solid fa-magnifying-glass-plus hint-icon zoom-icon"></i><span className="hint-text">Use a roda ou pinça para zoom</span></div>
        </div>
      )}

      {currentMapData === null && (<div style={{ padding: 12, color: '#999' }}>Carregando mapa…</div>)}

      {popup && popupPos && (
        <div
          style={{ 
            position: 'absolute', 
            left: popupPos.left, 
            top: popupPos.top, 
            background: 'rgba(20,22,26,0.95)', 
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: 12, 
            minWidth: 220, 
            maxWidth: 280, 
            zIndex: 6, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)', 
            pointerEvents: 'auto' // ✅ POPUP É CLICÁVEL
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {popupPos.orientation === 'down'
            ? <div style={{ position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(20,22,26,0.95)' }} />
            : <div style={{ position: 'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(20,22,26,0.95)' }} />
          }

          {popup.photoUrl && (
            <img src={popup.photoUrl} alt={popup.label} style={{ width: '100%', height: 140, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          )}
          <div style={{ padding: '10px 12px', display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>{popup.label}</div>

            {originId && (
              <div style={{ fontSize: '12px', padding: '6px 8px', background: 'rgba(10, 132, 255, 0.2)', borderRadius: '6px', color: '#0A84FF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-check-circle"></i> Pronto para navegar
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={setAsOrigin} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #2c2c2e', background: '#2c2c2e', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <i className="fa-solid fa-location-dot"></i> Estou aqui
              </button>
              <button onClick={goHere} disabled={!originId} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${!originId ? '#444' : '#0A84FF'}`, background: !originId ? '#333' : '#0A84FF', color: !originId ? '#888' : '#fff', cursor: !originId ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: !originId ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}>
                <i className="fa-solid fa-route"></i> Ir para cá
              </button>
            </div>

            <button onClick={() => { setPopup(null); setPopupPos(null); }} style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: '#9aa3af', cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          zIndex: 1, 
          borderRadius: '16px',
          touchAction: 'none', // ✅ PREVINE EVENTOS DE TOQUE PADRÃO
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
    </div>
  );
}