import { useEffect, useRef, useState, useMemo, useLayoutEffect, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
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

type Coords = { x: number; y: number };

type Props = {
  mapData?: MapData | null;
  mapImageUrl: string;
  strokeColor?: string;
  path?: MapNode[] | null;
  originId?: string | null;
  destinationPoi?: Poi | null; // Pass destination POI as a prop
  onSelectOrigin?: (nodeId: string, label?: string) => void;
  onRouteCalculated?: (path: MapNode[], instructions: TurnInstruction[], destinationPoi: Poi) => void;
  showPoiLabels?: boolean;
  initialZoomMultiplier?: number;
  animationOptions?: AnimationOptions;
  destinationToRoute?: string | null;
  onDestinationRouted?: () => void;
  // Props do modo de edição
  isEditMode?: boolean;
  onMapClick?: (coords: Coords) => void;
  onCursorMove?: (coords: Coords) => void;
  tempNodes?: { id: string; x: number; y: number }[];
};

type Transform = { x: number; y: number; scale: number };

export default function Map2D({
  mapData: mapDataProp,
  mapImageUrl,
  strokeColor = '#00AEF0',
  path,
  originId,
  destinationPoi,
  onSelectOrigin = () => {},
  onRouteCalculated = () => {},
  showPoiLabels = false,
  initialZoomMultiplier = 1.2,
  animationOptions,
  destinationToRoute,
  onDestinationRouted = () => {},
  // Props do modo de edição
  isEditMode = false,
  onMapClick = () => {},
  onCursorMove = () => {},
  tempNodes = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const { data: mapDataInternal } = useMapData();
  const currentMapData = mapDataProp || mapDataInternal;

  const pathfinder = usePathfinding(currentMapData);
  const pathToDraw = path ?? null;

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);
  const animationRef = useRef({ startTime: 0, duration: 0, pathLength: 0 });

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' | 'left' | 'right' } | null>(null);

  const [showHints, setShowHints] = useState(true);

  const routeAnimDuration = animationOptions?.routeAnimationDuration ?? 1000;
  const showHintsAnim = animationOptions?.showHintAnimations ?? true;

  // Efeito para calcular rota programaticamente
  useEffect(() => {
    if (destinationToRoute && originId && pathfinder && currentMapData) {
        const destPoi = currentMapData.pois.find(p => p.nodeId === destinationToRoute);
        if (!destPoi) {
            console.error(`[Map2D] Rota histórica: POI de destino com nodeId "${destinationToRoute}" não encontrado.`);
            onDestinationRouted();
            return;
        }

        try {
            const rawPath = pathfinder.findPath(originId, destinationToRoute);
            const foundPath = normalizePathToNodes(rawPath);

            if (foundPath && foundPath.length > 1) {
                onRouteCalculated(foundPath, [], destPoi);
            } else {
                alert('❌ Não foi possível recalcular a rota do histórico.');
            }
        } catch (err) {
            console.error('💥 Erro ao recalcular rota do histórico:', err);
            alert('❌ Ocorreu um erro ao recalcular a rota do histórico.');
        }
        
        onDestinationRouted(); // Reseta o gatilho no pai
    }
  }, [destinationToRoute, originId, pathfinder, currentMapData, onDestinationRouted, onRouteCalculated]);

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

  // Posiciona o popup de forma inteligente na tela
  useLayoutEffect(() => {
    if (!popup) {
      setPopupPos(null);
      return;
    }

    // Função que calcula e define a posição final do popup
    const calculateAndSetPosition = () => {
      if (!popupRef.current || !containerRef.current) {
        // Se as referências do DOM não estiverem prontas, tenta novamente no próximo frame
        requestAnimationFrame(calculateAndSetPosition);
        return;
      }

      const popupEl = popupRef.current;
      const containerEl = containerRef.current;

      const W = popupEl.offsetWidth;
      const H = popupEl.offsetHeight;

      // Se as dimensões ainda forem 0, o layout não ocorreu. Espera o próximo frame.
      if (W === 0 || H === 0) {
        requestAnimationFrame(calculateAndSetPosition);
        return;
      }

      const cw = containerEl.clientWidth;
      const ch = containerEl.clientHeight;
      const pad = 16;
      const pinGap = 24;
      const { x: pinX, y: pinY } = popup;

      let finalLeft, finalTop, finalOrientation;

      // 1. Tenta 'abaixo'
      const belowTop = pinY + pinGap;
      if (belowTop + H <= ch - pad) {
        finalTop = belowTop;
        finalOrientation = 'down';
        finalLeft = Math.min(Math.max(pinX - W / 2, pad), cw - W - pad);
        setPopupPos({ left: finalLeft, top: finalTop, orientation: finalOrientation });
        return;
      }

      // 2. Tenta 'acima'
      const aboveTop = pinY - H - pinGap;
      if (aboveTop >= pad) {
        finalTop = aboveTop;
        finalOrientation = 'up';
        finalLeft = Math.min(Math.max(pinX - W / 2, pad), cw - W - pad);
        setPopupPos({ left: finalLeft, top: finalTop, orientation: finalOrientation });
        return;
      }

      // 3. Tenta à 'direita'
      const rightLeft = pinX + pinGap;
      if (rightLeft + W <= cw - pad) {
        finalLeft = rightLeft;
        finalOrientation = 'right';
        finalTop = Math.min(Math.max(pinY - H / 2, pad), ch - H - pad);
        setPopupPos({ left: finalLeft, top: finalTop, orientation: finalOrientation });
        return;
      }

      // 4. Tenta à 'esquerda'
      const leftLeft = pinX - W - pinGap;
      if (leftLeft >= pad) {
        finalLeft = leftLeft;
        finalOrientation = 'left';
        finalTop = Math.min(Math.max(pinY - H / 2, pad), ch - H - pad);
        setPopupPos({ left: finalLeft, top: finalTop, orientation: finalOrientation });
        return;
      }

      // 5. Fallback: Se nenhuma posição for ideal, posiciona no lado com mais espaço vertical.
      finalOrientation = (pinY > ch / 2) ? 'up' : 'down';
      finalTop = (finalOrientation === 'up') ? pad : ch - H - pad;
      finalLeft = Math.min(Math.max(pinX - W / 2, pad), cw - W - pad);
      setPopupPos({ left: finalLeft, top: finalTop, orientation: finalOrientation });
    };

    // Pré-carrega a imagem antes de calcular a posição para garantir que a altura esteja correta
    if (popup.photoUrl) {
      const img = new Image();
      img.src = popup.photoUrl;
      // Roda o cálculo após o carregamento (ou erro) da imagem
      img.onload = calculateAndSetPosition;
      img.onerror = calculateAndSetPosition;
    } else {
      // Se não houver imagem, calcula no próximo frame de animação para garantir que o DOM esteja pronto
      requestAnimationFrame(calculateAndSetPosition);
    }
  }, [popup]);

  function worldToScreen(x: number, y: number) {
    return { sx: transform.x + x * transform.scale, sy: transform.y + y * transform.scale };
  }
  function screenToWorld(sx: number, sy: number) {
    return { x: (sx - transform.x) / transform.scale, y: (sy - transform.y) / transform.scale };
  }

  function normalizePoiType(t?: string) { return String(t ?? '').trim().toLowerCase(); }
  function getPoiVisual(poiType?: string) {
    const isEntrance = normalizePoiType(poiType).includes('entr');
    // Vermelho para entrada, Amarelo para outros POIs
    return { isEntrance, color: isEntrance ? '#FF3B30' : '#FFCC00', radius: isEntrance ? 10 : 8 };
  }

  // Função de fallback para desenhar círculos estilizados e garantir a visibilidade
  function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    const r = size; // O raio agora é o próprio 'size'
    const h = size * 2.5; // Altura total

    ctx.save();
    ctx.beginPath();

    // Desenha a forma de gota invertida
    ctx.moveTo(x, y); // Ponta inferior
    ctx.arc(x, y - h + r, r, Math.PI * 0.85, Math.PI * 0.15, false);
    
    ctx.closePath();

    // Preenchimento e Sombra
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    // Círculo branco interno para dar o efeito de "pin do Google Maps"
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(x, y - h + r, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.restore();
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

  const draw = useMemo(() => () => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;

    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();

    ctx.save();
    try {
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);

      const inv = 1 / transform.scale;

      if (img) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      }

      if (!currentMapData) {
        return;
      }

      // Desenha os POIs com a nova lógica de cor e estilo
      if (currentMapData?.pois?.length) {
        ctx.font = `${12 * inv}px Inter, system-ui, sans-serif`;
        for (const poi of currentMapData.pois) {
          const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
          if (!node) continue;

          const defaultVisuals = getPoiVisual(poi.type);
          let pinColor = defaultVisuals.color;

          // Lógica de cor baseada no estado
          if (originId === poi.nodeId) {
            pinColor = '#0A84FF'; // Azul para Origem
          } else if (destinationPoi?.nodeId === poi.nodeId) {
            pinColor = '#34C759'; // Verde para Destino
          }

          const size = defaultVisuals.radius * inv;
          drawPin(ctx, node.x, node.y, size, pinColor);

          if (showPoiLabels) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(poi.label, node.x + (size + 4) * inv, node.y + 4 * inv);
          }
        }
      }
      
      // Apenas no modo de edição, desenha todos os nós de conexão
      if (isEditMode) {
        const connNodes = currentMapData.nodes.filter(n => n.id.startsWith('conn_'));
        for (const node of connNodes) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(128, 128, 128, 0.7)';
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 1 * inv;
          ctx.arc(node.x, node.y, 3 * inv, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Desenha os nós temporários do modo de edição
      if (isEditMode && tempNodes.length > 0) {
        for (const node of tempNodes) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 100, 0, 0.8)'; // Cor laranja para nós temporários
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 1.5 * inv;
          ctx.arc(node.x, node.y, 5 * inv, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      if (pathToDraw && pathToDraw.length > 0) {
        drawRoute(ctx, pathToDraw, strokeColor);
      }

      if (originId && currentMapData) {
        const originNode = currentMapData.nodes.find(n => n.id === originId);
        const isOriginPoi = currentMapData.pois.some(p => p.nodeId === originId);
        if (originNode && !isOriginPoi) {
           drawGpsMarker(ctx, originNode.x, originNode.y, inv);
        }
      }

    } catch (err) {
      console.error('❌ ERRO no draw():', err);
    } finally {
      ctx.restore();
    }
  }, [
    img, currentMapData, pathToDraw, strokeColor, transform,
    showPoiLabels, originId, isEditMode, tempNodes, destinationPoi
  ]);

  useEffect(() => {
    let rafId: number;
    const renderLoop = () => {
      draw();
      rafId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [draw]);

  const getPointerPos = (e: ReactMouseEvent<HTMLDivElement> | WheelEvent | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 1) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      const t1 = e.touches[0], t2 = e.touches[1];
      return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
    }
    return { x: (e as any).clientX - rect.left, y: (e as any).clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (popup) setPopup(null); // Fecha o popup ao dar zoom
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
  }, [popup]); // Adiciona popup como dependência para recriar o listener

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      return;
    }
    
    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    if (isEditMode) {
        onMapClick({ x: Math.round(x), y: Math.round(y) });
        return;
    }

    if (!currentMapData) {
        console.warn('⚠️ Dados do mapa não carregados');
        setPopup(null);
        return;
    }

    const poi = pickPoiNear(x, y, 40 / transform.scale);
    
    if (poi) {
        const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
        if (!node) {
            console.error('❌ Nó do POI não encontrado:', poi.nodeId);
            setPopup(null);
            return;
        }
        const pos = worldToScreen(node.x, node.y);
        
        if (popup?.poiId === poi.id) {
            setPopup(null);
        } else {
            setPopup({ poiId: poi.id, label: poi.label, x: pos.sx, y: pos.sy, photoUrl: poi.photoUrl });
        }
    } else {
        setPopup(null);
    }
  }

  function pickPoiNear(x: number, y: number, maxDist: number) {
    if (!currentMapData?.pois) return null;
    let best: (Poi & { d: number }) | null = null;
    for (const poi of currentMapData.pois) {
      const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
      if (!node) continue;
      const d = Math.hypot(node.x - x, node.y - y);
      if ((!best || d < best.d) && d <= maxDist) {
        best = { ...poi, d };
      }
    }
    return best;
  }

  function setAsOrigin() {
    if (!popup || !currentMapData) return;
    const poi = currentMapData.pois!.find(p => p.id === popup.poiId)!;
    onSelectOrigin(poi.nodeId, poi.label);
    setPopup(null);
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

    setPopup(null);

    try {
      const rawPath = pathfinder.findPath(originId, poi.nodeId);
      const foundPath = normalizePathToNodes(rawPath);

      if (foundPath && foundPath.length > 1) {
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
        touchAction: 'none',
        cursor: isEditMode ? 'crosshair' : (isPanning.current ? 'grabbing' : 'grab'), 
        background: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onMouseDown={(e) => { 
        isDragging.current = false;
        isPanning.current = true; 
        lastPos.current = { x: e.clientX, y: e.clientY }; 
      }}
      onMouseMove={(e) => {
        if (!isPanning.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;

        if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          isDragging.current = true;
        }
        
        if (isDragging.current) {
          if (popup) setPopup(null);
          setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
          lastPos.current = { x: e.clientX, y: e.clientY };
        }

        const { x: sx, y: sy } = getPointerPos(e);
        const { x, y } = screenToWorld(sx, sy);
        if (isEditMode) {
          onCursorMove({ x: Math.round(x), y: Math.round(y) });
        }
      }}
      onMouseUp={() => {
        isPanning.current = false;
      }}
      onMouseLeave={() => { 
        isPanning.current = false;
        isDragging.current = false;
      }}
      
      onTouchStart={(e) => {
        isDragging.current = false;
        if (e.touches.length === 1) { 
          isPanning.current = true; 
          lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
        } else if (e.touches.length === 2) { 
          isPanning.current = false; // É um zoom
          if (popup) setPopup(null);
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastTouchDist.current = Math.hypot(dx, dy);
        }
      }}
      
      onTouchMove={(e) => {
        if (e.touches.length === 1 && isPanning.current) {
          const dx = e.touches[0].clientX - lastPos.current.x;
          const dy = e.touches[0].clientY - lastPos.current.y;

          if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDragging.current = true;
          }

          if (isDragging.current) {
            if (popup) setPopup(null);
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        } else if (e.touches.length === 2) {
          e.preventDefault();
          if (popup) setPopup(null);
          
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
        
        const { x: sx, y: sy } = getPointerPos(e);
        const { x, y } = screenToWorld(sx, sy);
        if (isEditMode) {
          onCursorMove({ x: Math.round(x), y: Math.round(y) });
        }
      }}
      
      onTouchEnd={() => {
        isPanning.current = false;
        lastTouchDist.current = 0;
      }}
    >
      {showHints && !isEditMode && (
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

      {popup && !isEditMode && (
        <div
          ref={popupRef}
          className={`popup ${popupPos ? 'show' : ''}`}
          style={popupPos ? { 
            left: popupPos.left, 
            top: popupPos.top, 
          } : {
            opacity: 0, // Começa invisível para medição
          }}
          onClick={(e) => e.stopPropagation()} // Impede que cliques dentro do popup o fechem
        >
          {popupPos && (
            <>
              {popupPos.orientation === 'down' && <div className="popup-arrow-down" />}
              {popupPos.orientation === 'up' && <div className="popup-arrow-up" />}
              {popupPos.orientation === 'left' && <div className="popup-arrow-left" />}
              {popupPos.orientation === 'right' && <div className="popup-arrow-right" />}
            </>
          )}

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

            <button onClick={() => setPopup(null)} className="popup-close-button">
              Fechar
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ 
          display: 'block', 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          zIndex: 1, 
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
    </div>
  );
}
