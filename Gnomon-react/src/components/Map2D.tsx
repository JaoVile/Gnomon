import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useMapData, type MapData, type MapNode, type Poi } from '../hooks/useMapData';
import { usePathfinding } from '../hooks/usePathfinding';
import './Map2D.css';

export type { MapNode, Poi };
export type Node2D = MapNode;

export type TurnInstruction = { text: string; distance: number; icon: string };

type AnimationOptions = {
  routeAnimationDuration?: number;
  showHintAnimations?: boolean;
};

type Props = {
  mapData?: MapData | null;
  mapImageUrl: string;
  strokeColor?: string;
  path?: MapNode[] | null;
  originId?: string | null;
  onSelectOrigin?: (nodeId: string, label?: string) => void;
  onRouteCalculated?: (path: MapNode[], instructions: TurnInstruction[], destinationPoi: Poi) => void;
  showPoiLabels?: boolean;
  initialZoomMultiplier?: number;
  animationOptions?: AnimationOptions;
  destinationToRoute?: string | null;
  onDestinationRouted?: () => void;
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
  showPoiLabels = false,
  initialZoomMultiplier = 1.2,
  animationOptions,
  destinationToRoute,
  onDestinationRouted = () => {},
}: Props) {
  // DEBUG: Log the received zoom multiplier
  console.log('[Map2D] initialZoomMultiplier:', initialZoomMultiplier);

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
  const animationRef = useRef({ startTime: 0, duration: 0, pathLength: 0 });

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' } | null>(null);

  const [showHints, setShowHints] = useState(true);

  const routeAnimDuration = animationOptions?.routeAnimationDuration ?? 1000;
  const showHintsAnim = animationOptions?.showHintAnimations ?? true;

  // Efeito para calcular rota programaticamente
  useEffect(() => {
    if (destinationToRoute && originId && pathfinder && currentMapData) {
        const destinationPoi = currentMapData.pois.find(p => p.nodeId === destinationToRoute);
        if (!destinationPoi) {
            console.error(`[Map2D] Rota histórica: POI de destino com nodeId "${destinationToRoute}" não encontrado.`);
            onDestinationRouted();
            return;
        }

        try {
            const rawPath = pathfinder.findPath(originId, destinationToRoute);
            const foundPath = normalizePathToNodes(rawPath);

            if (foundPath && foundPath.length > 1) {
                onRouteCalculated(foundPath, [], destinationPoi);
            } else {
                alert('❌ Não foi possível recalcular a rota do histórico.');
            }
        } catch (err) {
            console.error('💥 Erro ao recalcular rota do histórico:', err);
            alert('❌ Ocorreu um erro ao recalcular a rota do histórico.');
        }
        
        onDestinationRouted(); // Reseta o gatilho no pai
    }
  }, [destinationToRoute, originId, pathfinder, currentMapData]);

  useEffect(() => {
    if (path && path.length > 0) {
      const pathLength = path.reduce((acc, point, i) => {
        if (i === 0) return 0;
        const prev = path[i - 1];
        return acc + Math.hypot(point.x - prev.x, point.y - prev.y);
      }, 0);

      animationRef.current = {
        startTime: performance.now(),
        duration: routeAnimDuration,
        pathLength,
      };
    } else {
      animationRef.current = { startTime: 0, duration: 0, pathLength: 0 };
    }
  }, [path, routeAnimDuration]);


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
      const scale = initialScale * initialZoomMultiplier;
      const x = (cw - iw * scale) / 2;
      const y = (ch - ih * scale) / 2;
      setTransform({ x, y, scale });
    };
    im.src = mapImageUrl;
  }, [mapImageUrl, initialZoomMultiplier]);

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

    const { startTime, duration, pathLength } = animationRef.current;
    const elapsed = performance.now() - startTime;
    const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 5 * inv;
    ctx.lineWidth = 6 * inv;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (progress < 1 && pathLength > 0) {
      const drawLength = pathLength * progress;
      ctx.setLineDash([drawLength, pathLength]);
    }

    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.setLineDash([]); // Reset dash

    if (progress >= 1) {
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
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;

    // 1. Limpa o canvas no espaço da tela (sem transformação)
    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();

    // 2. Aplica a transformação global (pan/zoom) para todo o desenho
    ctx.save();
    try {
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const inv = 1 / transform.scale;

      // 3. Desenha a imagem do mapa no espaço do mundo
      if (img) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      }

      if (!currentMapData) {
        return; // Retorna cedo se não houver dados, o `finally` vai restaurar o contexto
      }

      // 4. Desenha todos os outros elementos (POIs, rotas, etc.) no espaço do mundo
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

    } catch (err) {
      console.error('❌ ERRO no draw():', err);
    } finally {
      // 5. Garante que a transformação seja restaurada no final
      ctx.restore();
    }
  }

  useEffect(() => {
    let rafId: number;
    const renderLoop = () => {
      draw();
      // Continua o loop se a animação da rota estiver em andamento
      const isAnimatingPath = animationRef.current.startTime > 0 && (performance.now() - animationRef.current.startTime) < animationRef.current.duration;
      // Continua o loop se o marcador de GPS estiver pulsando
      const isGpsPulsing = !!originId;

      if (isAnimatingPath || isGpsPulsing) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };

    renderLoop(); // Inicia o loop

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    img, currentMapData, pathToDraw, strokeColor, transform,
    showPoiLabels, originId
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

  function onClick(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (isPanning.current && (Math.abs(e.clientX - lastPos.current.x) > 2 || Math.abs(e.clientY - lastPos.current.y) > 2)) return;

    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    if (!currentMapData) { console.warn('⚠️ Dados do mapa não carregados'); return; }

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
      onRouteCalculated(foundPath, [], poi);
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
        background: 'transparent', // ✅ Fundo transparente para ver as partículas
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
          <div className="hint-item">
            <i className={`fa-solid fa-hand hint-icon ${showHintsAnim ? 'pan-icon-animation' : ''}`}></i>
            <span className="hint-text">Arraste para mover</span>
          </div>
          <div className="hint-item">
            <i className={`fa-solid fa-magnifying-glass-plus hint-icon ${showHintsAnim ? 'zoom-icon-animation' : ''}`}></i>
            <span className="hint-text">Use a roda ou pinça para zoom</span>
          </div>
        </div>
      )}

      {currentMapData === null && (<div style={{ padding: 12, color: '#999' }}>Carregando mapa…</div>)}

      {popup && popupPos && (
        <div
          className={`popup ${popup ? 'show' : ''}`}
          style={{ 
            left: popupPos.left, 
            top: popupPos.top, 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {popupPos.orientation === 'down'
            ? <div className="popup-arrow-down" />
            : <div className="popup-arrow-up" />
          }

          {popup.photoUrl && (
            <img src={popup.photoUrl} alt={popup.label} className="popup-photo" />
          )}
          <div className="popup-content">
            <div className="popup-title">{popup.label}</div>

            {originId && (
              <div className="popup-ready-badge">
                <i className="fa-solid fa-check-circle"></i> Pronto para navegar
              </div>
            )}

            <div className="popup-buttons">
              <button onClick={setAsOrigin} className="popup-button">
                <i className="fa-solid fa-location-dot"></i> Estou aqui
              </button>
              <button onClick={goHere} disabled={!originId} className="popup-button primary">
                <i className="fa-solid fa-route"></i> Ir para cá
              </button>
            </div>

            <button onClick={() => { setPopup(null); setPopupPos(null); }} className="popup-close-button">
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
          /* Adiciona uma sombra sutil que segue o contorno do mapa (funciona melhor com PNG transparente) */
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
          /* O borderRadius não é mais necessário se a imagem não for retangular */
          // borderRadius: '16px', 
          touchAction: 'none', // ✅ PREVINE EVENTOS DE TOQUE PADRÃO
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
    </div>
  );
}
