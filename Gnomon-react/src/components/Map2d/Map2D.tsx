// @ts-nocheck
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import { useMapData } from '../../hooks/useMapData';
import { usePathfinding } from '../../hooks/usePathfinding';
import './Map2D.css';

// Tipos auxiliares (mantidos para documentação, mesmo com o nocheck)
export type MapNode = any;
export type Poi = any;
export type Node2D = MapNode;
export type TurnInstruction = { text: string; distance: number; icon: string };

type AnimationOptions = {
  routeAnimationDuration?: number;
  showHintAnimations?: boolean;
};

type Coords = { x: number; y: number };
type EditTool = 'add_poi' | 'add_entrance' | 'add_connection' | 'link_nodes' | 'delete_node' | 'none';

type Props = {
  mapData?: any;
  mapImageUrl: string;
  strokeColor?: string;
  path?: any[];
  originId?: string | null;
  destinationPoi?: any;
  onSelectOrigin?: (nodeId: string, label?: string) => void;
  onRouteCalculated?: (path: any[], instructions: TurnInstruction[], destinationPoi: any) => void;
  showPoiLabels?: boolean;
  initialZoomMultiplier?: number;
  animationOptions?: AnimationOptions;
  destinationToRoute?: string | null;
  onDestinationRouted?: () => void;
  focusOnPoi?: string | null;
  onFocusDone?: () => void;
  onPanStart?: () => void;
  isBottomSheetOpen?: boolean;
  bottomSheetPeekHeight?: number;
  isEditMode?: boolean;
  editTool?: EditTool;
  onMapClick?: (coords: Coords) => void;
  onNodeClick?: (nodeId: string) => void;
  onCursorMove?: (coords: Coords) => void;
  tempNodes?: any[];
  tempPois?: any[];
  onShowTutorial?: () => void;
  tutorialJustClosed?: boolean; // Nova propriedade
};

type Transform = { x: number; y: number; scale: number; rotation: number };

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

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
  focusOnPoi,
  onFocusDone = () => {},
  onPanStart = () => {},
  isBottomSheetOpen = false,
  bottomSheetPeekHeight = 0,
  isEditMode = false,
  editTool = 'none',
  onMapClick = () => {},
  onNodeClick = () => {},
  onCursorMove = () => {},
  tempNodes = [],
  tempPois = [],
  onShowTutorial,
  tutorialJustClosed = false, // Valor padrão
}: Props) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const [img, setImg] = useState(null);

  const { data: mapDataInternal } = useMapData();
  // ✅ Memoize currentMapData para evitar que o objeto mude a cada renderização
  const currentMapData = useMemo(() => mapDataProp || mapDataInternal, [mapDataProp, mapDataInternal]);

  // ✅ O pathfinder agora é memoizado e só será recriado se o mapData mudar.
  const pathfinder = usePathfinding(currentMapData);
  const pathToDraw = path ?? null; // pathToDraw já é estável se 'path' for estável
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
  const isPanning = useRef(false);
  const isDragging = useRef(false);
  const isPinching = useRef(false); // Ref para controlar o gesto de pinça/rotação
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);
  const animationRef = useRef({ startTime: 0, duration: 0, pathLength: 0 });
  const transformAnimRef = useRef(null);
  const minScaleRef = useRef(1);

  const [popup, setPopup] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  const lastTouchAngle = useRef(0); // Ref para armazenar o ângulo do toque
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [hasLegendBeenInteracted, setHasLegendBeenInteracted] = useState(false);
  const [showHints, setShowHints] = useState(true);
  
  // Lógica robusta para o pop-up de onboarding
  const [showInitialLocationHint, setShowInitialLocationHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('gnomon_onboarding_question_dismissed');
  });

  const routeAnimDuration = animationOptions?.routeAnimationDuration ?? 1000;
  const showHintsAnim = animationOptions?.showHintAnimations ?? true;

  const handleLegendClick = () => {
    setIsLegendOpen(!isLegendOpen);
    if (!hasLegendBeenInteracted) {
      setHasLegendBeenInteracted(true);
    }
  };

  const legendItems = [
    { label: 'Entradas', type: 'icon', icon: 'pin', color: '#EA4335' },
    { label: 'Referências', type: 'icon', icon: 'pin', color: '#FFD700' },
    { label: 'Coord.', type: 'color', color: '#D9ED92' },
    { label: 'Auditório', type: 'color', color: '#FFB3BA' },
    { label: 'Cantina', type: 'color', color: '#4655b4' },
    { label: 'Labs', type: 'color', color: '#00FFFF' },
    { label: 'Biblioteca', type: 'color', color: '#FFFF00' },
    { label: 'Banheiros', type: 'color', color: '#DDA0DD' },
    { label: 'Salas', type: 'color', color: '#f0e68d' },
   
  ];

  // ✅ Envolver zoomTo em useMemo para estabilizar a função
  const zoomTo = useMemo(() => (targetX, targetY, targetScale, duration = 500, onFinish) => {
    if (transformAnimRef.current && typeof window !== 'undefined') {
      window.cancelAnimationFrame(transformAnimRef.current);
    }

    const startTransform = { ...transform };
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight; 

    const finalX = cw / 2 - targetX * targetScale;
    const finalY = ch / 2 - targetY * targetScale;

    const animStartTime = performance.now();

    const animate = (time) => {
      const elapsed = time - animStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);

      const nextX = startTransform.x + (finalX - startTransform.x) * easeProgress;
      const nextY = startTransform.y + (finalY - startTransform.y) * easeProgress;
      const nextScale = startTransform.scale + (targetScale - startTransform.scale) * easeProgress;

      const nextTransform = { ...startTransform, x: nextX, y: nextY, scale: nextScale };
      setTransform(nextTransform);

      if (progress < 1 && typeof window !== 'undefined') {
        transformAnimRef.current = window.requestAnimationFrame(animate);
      } else {
        transformAnimRef.current = null;
        if (onFinish) onFinish(nextTransform);
      }
    };

    if (typeof window !== 'undefined') {
      transformAnimRef.current = window.requestAnimationFrame(animate);
    }
  }, [transform]);

  useEffect(() => {
    if (focusOnPoi && currentMapData) {
      const poi = currentMapData.pois.find(p => p.id === focusOnPoi);
      if (poi) {
        const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
        if (node) {
          zoomTo(node.x, node.y, 2, 500, (finalTransform) => {
            setTimeout(() => {
              const sx = finalTransform.x + node.x * finalTransform.scale;
              const sy = finalTransform.y + node.y * finalTransform.scale;
              setPopup({ poiId: poi.id, label: poi.label, x: sx, y: sy, photoUrl: poi.photoUrl });
            }, 500);
          });
        }
      }
      onFocusDone();
    }
  }, [focusOnPoi, currentMapData, onFocusDone, zoomTo]);

  useEffect(() => {
    if (destinationToRoute && originId && pathfinder && currentMapData) {
        const destPoi = currentMapData.pois.find(p => p.nodeId === destinationToRoute);
        if (!destPoi) {
            onDestinationRouted();
            return;
        }

        try {
            const rawPath = pathfinder.findPath(originId, destinationToRoute);
            const foundPath = normalizePathToNodes(rawPath);

            if (foundPath && foundPath.length > 1) {
                onRouteCalculated(foundPath, [], destPoi);
            } else {
                if (typeof window !== 'undefined') window.alert('❌ Não foi possível recalcular a rota do histórico.');
            }
        } catch (err) {
            console.error('💥 Erro ao recalcular rota do histórico:', err);
            if (typeof window !== 'undefined') window.alert('❌ Ocorreu um erro ao recalcular a rota do histórico.');
        }
        
        onDestinationRouted();
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
    const timer = setTimeout(() => setShowHints(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Efeito para reiniciar a animação das dicas quando o tutorial é fechado
  useEffect(() => {
    // Esta lógica foi simplificada e movida para o useState inicial do showInitialLocationHint
    // O gatilho `tutorialJustClosed` não é mais necessário para este pop-up.
    // Isso garante que ele apareça independentemente do tutorial.
  }, []);

  // Esconde a dica "Você está aqui" assim que uma origem for definida
  useEffect(() => {
    if (originId) setShowInitialLocationHint(false);
  }, [originId]);

  const handleConfirmEntrance = () => {
    // Define a origem na Entrada 1 e fecha o popup
    onSelectOrigin('E1', 'Entrada 1');
    setShowInitialLocationHint(false);
  };

  const handleDismissQuestionPermanently = () => {
    // Salva no navegador que o usuário não quer mais ver esta pergunta
    localStorage.setItem('gnomon_onboarding_question_dismissed', 'true');
    setShowInitialLocationHint(false);
  }

  function resizeCanvas() {
    const c = canvasRef.current, wrap = containerRef.current;
    if (!c || !wrap || typeof window === 'undefined') return;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    
    if (w > 0 && h > 0) {
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      
      const ctx = c.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const im = new window.Image();
    im.onload = () => {
      setImg(im);
      const c = canvasRef.current;
      if (!c) return;
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const cw = c.clientWidth, ch = c.clientHeight;
      
      const isMobile = isMobileDevice();

      let scale;

      if (isMobile) {
        const visibleHeight = ch - bottomSheetPeekHeight;
        scale = (visibleHeight / ih) * 0.70;
      } else {
        const scaleX = cw / iw;
        const scaleY = ch / ih;
        const baseScale = Math.max(scaleX, scaleY);
        scale = baseScale * initialZoomMultiplier;
      }
      
      minScaleRef.current = cw / iw;

      let x;
      let y = 0;

      if (isMobile) {
        x = -(iw * 0.65) * scale;
        y = -(ih * 0.25) * scale;
      } else {
        x = (cw - iw * scale) / 2;
        if (mapImageUrl.includes('Campus_2D_CIMA.png')) {
          // Move o mapa para cima para centralizar, e depois 100px para baixo.
          y = -(ih * 0.25)
        }
      }

      setTransform({ x, y, scale, rotation: 180 }); // << A MÁGICA ACONTECE AQUI
    };
    im.src = mapImageUrl;
  }, [mapImageUrl, initialZoomMultiplier, bottomSheetPeekHeight]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    resizeCanvas();
    
    if ('ResizeObserver' in window) {
      const ro = new window.ResizeObserver(resizeCanvas);
      if (containerRef.current) ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, []);

  useLayoutEffect(() => {
    if (!popup || typeof window === 'undefined') {
      setPopupPos(null);
      return;
    }

    const calculateAndSetPosition = () => {
        if (!popupRef.current || !containerRef.current) return;

        const popupEl = popupRef.current;
        const containerEl = containerRef.current;
        
        const W = popupEl.offsetWidth;
        const H = popupEl.offsetHeight;

        if (W === 0 || H === 0) {
          window.requestAnimationFrame(calculateAndSetPosition);
          return;
        }

        const cw = containerEl.clientWidth;
        const ch = containerEl.clientHeight;
        const pad = 16;
        const pinGap = 24;
        
        let effectiveBottomPadding = pad;
        if (!isBottomSheetOpen && bottomSheetPeekHeight > 0) {
          effectiveBottomPadding = Math.max(pad, bottomSheetPeekHeight + 10);
        }

        const { x: pinX, y: pinY } = popup;

        const positions = {
          bottom: { top: pinY + pinGap, left: pinX - W / 2, orientation: 'down' },
          top: { top: pinY - H - pinGap, left: pinX - W / 2, orientation: 'up' },
          right: { top: pinY - H / 2, left: pinX + pinGap, orientation: 'right' },
          left: { top: pinY - H / 2, left: pinX - W - pinGap, orientation: 'left' },
        };

        const isFullyVisible = (pos) => {
          return pos.left >= pad && pos.left + W <= cw - pad && pos.top >= pad && pos.top + H <= ch - effectiveBottomPadding;
        };

        let chosenKey = null;
        const preferredOrder = ['top', 'bottom', 'right', 'left'];

        for (const key of preferredOrder) {
          if (isFullyVisible(positions[key])) {
            chosenKey = key;
            break;
          }
        }

        let finalLeft, finalTop, finalOrientation;

        if (chosenKey) {
          const pos = positions[chosenKey];
          finalLeft = pos.left;
          finalTop = pos.top;
          finalOrientation = pos.orientation;
        } else {
          let bestPosition = { score: -1, finalLeft: 0, finalTop: 0, finalOrientation: 'down' };

          for (const key in positions) {
            const pos = positions[key];
            
            const left = Math.min(Math.max(pos.left, pad), cw - W - pad);
            const top = Math.min(Math.max(pos.top, pad), ch - H - effectiveBottomPadding);

            const visibleWidth = Math.max(0, Math.min(left + W, cw - pad) - Math.max(left, pad));
            const visibleHeight = Math.max(0, Math.min(top + H, ch - effectiveBottomPadding) - Math.max(top, pad));
            const visibleArea = visibleWidth * visibleHeight;
            
            let score = visibleArea;

            if (key === 'bottom') score *= 1.1;

            if (score > bestPosition.score) {
              bestPosition = {
                score,
                finalLeft: left,
                finalTop: top,
                finalOrientation: pos.orientation,
              };
            }
          }
          finalLeft = bestPosition.finalLeft;
          finalTop = bestPosition.finalTop;
          finalOrientation = bestPosition.finalOrientation;
        }
        
        setPopupPos({ 
          left: finalLeft, 
          top: finalTop, 
          orientation: finalOrientation
        });
      };

      if (popup.photoUrl) {
        const img = new window.Image();
        img.src = popup.photoUrl;
        img.onload = calculateAndSetPosition;
        img.onerror = calculateAndSetPosition;
      } else {
        window.requestAnimationFrame(calculateAndSetPosition);
      }
    }, [popup, isBottomSheetOpen, bottomSheetPeekHeight]);

  function worldToScreen(x, y) {
    // Esta função converte uma coordenada do "mundo" do mapa para uma coordenada na tela.
    // A ordem das transformações aqui espelha EXATAMENTE a ordem na função `draw`.
    const centerX = canvasRef.current.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvasRef.current.height / (window.devicePixelRatio || 1) / 2;
    const angleRad = transform.rotation * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // 1. Aplica o arraste (pan) ao ponto
    const pannedX = x + transform.x;
    const pannedY = y + transform.y;

    // 2. Aplica a rotação em torno do centro da tela
    const rotatedX = cos * (pannedX - centerX) - sin * (pannedY - centerY) + centerX;
    const rotatedY = sin * (pannedX - centerX) + cos * (pannedY - centerY) + centerY;

    // 3. Aplica o zoom
    const scaledX = centerX + (rotatedX - centerX) * transform.scale;
    const scaledY = centerY + (rotatedY - centerY) * transform.scale;

    return { sx: scaledX, sy: scaledY };
  }
  function screenToWorld(sx, sy) {
    // Esta é a função inversa de worldToScreen. As operações são aplicadas na ordem reversa.
    const centerX = canvasRef.current.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvasRef.current.height / (window.devicePixelRatio || 1) / 2;
    const angleRad = -transform.rotation * (Math.PI / 180); // Ângulo negativo para "desgirar"
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // 1. Inverte o zoom
    const unscaledX = centerX + (sx - centerX) / transform.scale;
    const unscaledY = centerY + (sy - centerY) / transform.scale;

    // 2. Inverte a rotação
    const unrotatedX = cos * (unscaledX - centerX) - sin * (unscaledY - centerY) + centerX;
    const unrotatedY = sin * (unscaledX - centerX) + cos * (unscaledY - centerY) + centerY;

    // 3. Inverte o arraste (pan)
    return { x: unrotatedX - transform.x, y: unrotatedY - transform.y };
  }

  function normalizePoiType(t) { return String(t ?? '').trim().toLowerCase(); }
  
  const getPoiVisual = useMemo(() => (poiType) => {
    const isEntrance = normalizePoiType(poiType).includes('entr');
    return { isEntrance, color: isEntrance ? '#FF3B30' : '#FFCC00', radius: isEntrance ? 10 : 8 };
  }, []);

  function drawPin(ctx, x, y, size, color) {
    const r = size;
    const h = size * 2.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y - h + r, r, Math.PI * 0.85, Math.PI * 0.15, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(x, y - h + r, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
  }

  const drawRoute = useMemo(() => (ctx, pts, color = strokeColor) => {
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

    ctx.setLineDash([]);
  }, [strokeColor, transform.scale]);

  function drawGpsMarker(ctx, x, y, inv) {
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
    if (typeof window === 'undefined') return;
    
    const ctx = c.getContext('2d'); 
    if (!ctx) return;

    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();

    ctx.save();
    try {
      // A ordem das transformações no canvas é crucial e deve ser espelhada em worldToScreen
      const centerX = c.width / (window.devicePixelRatio || 1) / 2;
      const centerY = c.height / (window.devicePixelRatio || 1) / 2;

      // 1. Aplica o zoom em relação ao centro
      ctx.translate(centerX, centerY);
      ctx.scale(transform.scale, transform.scale);
      ctx.translate(-centerX, -centerY);

      // 2. Aplica a rotação em torno do centro
      ctx.translate(centerX, centerY);
      ctx.rotate(transform.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      // 3. Aplica o arraste (pan)
      ctx.translate(transform.x, transform.y);

      const inv = 1 / transform.scale;

      if (img) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      }

      if (!currentMapData) {
        return;
      }

      if (pathToDraw && pathToDraw.length > 0) {
        drawRoute(ctx, pathToDraw, strokeColor);
      }

      if (currentMapData?.pois?.length) {
        ctx.font = `${12 * inv}px Inter, system-ui, sans-serif`;
        for (const poi of currentMapData.pois) {
          const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
          if (!node) continue;

          const defaultVisuals = getPoiVisual(poi.type);
          let pinColor = defaultVisuals.color;

          if (originId === poi.nodeId) pinColor = '#0A84FF';
          else if (destinationPoi?.nodeId === poi.nodeId) pinColor = '#34C759';

          const size = defaultVisuals.radius * inv;
          
          // Salva o estado do canvas, desenha o pino e restaura para que a rotação não afete outros elementos
          ctx.save();
          ctx.translate(node.x, node.y); // Move para a posição do pino
          ctx.rotate(-transform.rotation * Math.PI / 180); // Aplica a rotação inversa para manter o pino "em pé"
          ctx.translate(-node.x, -node.y); // Move de volta
          drawPin(ctx, node.x, node.y, size, pinColor);
          ctx.restore();


          if (showPoiLabels) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(poi.label, node.x + (size + 4) * inv, node.y + 4 * inv);
          }
        }
      }
      
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

      if (isEditMode) {
        for (const poi of tempPois) {
          const node = tempNodes.find(n => n.id === poi.nodeId);
          if (!node) continue;
          const visual = getPoiVisual(poi.type);
          drawPin(ctx, node.x, node.y, visual.radius * inv, '#A020F0');
          ctx.fillStyle = '#FFF';
          ctx.fillText(`[NOVO] ${poi.label}`, node.x + (visual.radius + 4) * inv, node.y + 4 * inv);
        }
        const tempConnNodes = tempNodes.filter(n => !tempPois.some(p => p.nodeId === n.id));
        for (const node of tempConnNodes) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 1.5 * inv;
          ctx.arc(node.x, node.y, 5 * inv, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
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
    showPoiLabels, originId, isEditMode, tempNodes, tempPois, destinationPoi,
    drawRoute, getPoiVisual, canvasRef
  ]);
  
  useEffect(() => {
    let rafId;
    const renderLoop = () => {
      draw();
      if (typeof window !== 'undefined') {
        rafId = window.requestAnimationFrame(renderLoop);
      }
    };

    renderLoop();

    return () => {
      if (rafId && typeof window !== 'undefined') window.cancelAnimationFrame(rafId);
    };
  }, [draw]);

  const getPointerPos = useMemo(() => (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      if (e.touches.length === 1) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      const t1 = e.touches[0], t2 = e.touches[1];
      return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e) => {
      e.preventDefault();
      if (popup) setPopup(null);
      const { x, y } = getPointerPos(e);
      const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => {
        const newScale = Math.max(minScaleRef.current, Math.min(prev.scale * scaleAmount, 4));
        const newX = x - (x - prev.x) * (newScale / prev.scale);
        const newY = y - (y - prev.y) * (newScale / prev.scale);
        return { ...prev, x: newX, y: newY, scale: newScale };
      });
    };
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [popup, getPointerPos]);

  const handleCanvasClick = (e) => {
    if (isDragging.current) return;
    
    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    if (isEditMode) {
      if (editTool === 'delete_node') {
        const nodeToDelete = pickTempNodeNear(x, y, 30 / transform.scale);
        if (nodeToDelete) {
          onNodeClick(nodeToDelete.id);
        }
        return;
      }
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

  function pickPoiNear(x, y, maxDist) {
    if (!currentMapData?.pois) return null;
    let best = null;
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

  function pickTempNodeNear(x, y, maxDist) {
    if (!tempNodes) return null;
    let best = null;
    for (const node of tempNodes) {
      const d = Math.hypot(node.x - x, node.y - y);
      if ((!best || d < best.d) && d <= maxDist) {
        best = { ...node, d };
      }
    }
    return best;
  }

  function setAsOrigin() {
    if (!popup || !currentMapData) return;
    const poi = currentMapData.pois.find(p => p.id === popup.poiId);
    if (poi) {
        onSelectOrigin(poi.nodeId, poi.label);
    }
    setPopup(null);
  }

  function normalizePathToNodes(raw) {
    if (!raw) return [];
    if (!currentMapData) return [];
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      const nodes = raw
        .map(id => currentMapData.nodes.find(n => n.id === id))
        .filter(Boolean);
      return nodes;
    }
    return raw;
  }

  function goHere() {
    if (!popup || !currentMapData || !pathfinder) {
      console.warn('⚠️ Pré-condições para `goHere` não atendidas');
      return;
    }

    if (!originId) {
      if (typeof window !== 'undefined') window.alert('⚠️ Primeiro, defina um local de partida clicando em "Estou aqui".');
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
        if (typeof window !== 'undefined') window.alert('❌ Não foi possível calcular uma rota para este local.');
        console.error('❌ Caminho inválido ou muito curto:', foundPath);
      }
    } catch (err) {
      console.error('💥 Erro ao calcular rota:', err);
      if (typeof window !== 'undefined') window.alert('❌ Ocorreu um erro ao calcular a rota. Verifique o console para mais detalhes.');
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
        cursor: isEditMode ? (editTool === 'delete_node' ? 'not-allowed' : 'crosshair') : (isPanning.current ? 'grabbing' : 'grab'), 
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
          onPanStart();
        }
        
        if (isDragging.current) {
          if (popup) setPopup(null);
          
          // Corrige o vetor de arraste com base na rotação
          const angleRad = transform.rotation * Math.PI / 180;
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          const rotatedDx = dx * cos + dy * sin;
          const rotatedDy = dy * cos - dx * sin;

          setTransform(prev => ({ 
            ...prev, 
            x: prev.x + rotatedDx, y: prev.y + rotatedDy 
          }));
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
          isPinching.current = true;
          isPanning.current = false;
          if (popup) setPopup(null);
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastTouchDist.current = Math.hypot(dx, dy);
          // Armazena o ângulo inicial
          lastTouchAngle.current = Math.atan2(dy, dx) * 180 / Math.PI;
        }
      }}
      
      onTouchMove={(e) => {
        if (e.touches.length === 1 && isPanning.current) {
          const dx = e.touches[0].clientX - lastPos.current.x;
          const dy = e.touches[0].clientY - lastPos.current.y;

          if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            isDragging.current = true;
            onPanStart();
          }

          if (isDragging.current) {
            if (popup) setPopup(null);
            // Corrige o vetor de arraste com base na rotação
            const angleRad = transform.rotation * Math.PI / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const rotatedDx = dx * cos + dy * sin;
            const rotatedDy = dy * cos - dx * sin;

            setTransform(prev => ({ 
              ...prev, 
              x: prev.x + rotatedDx, y: prev.y + rotatedDy 
            }));
            lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        } else if (e.touches.length === 2 && isPinching.current) {
          e.preventDefault();
          if (popup) setPopup(null);
          
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          
          // Lógica de Zoom
          if (lastTouchDist.current > 0) {
            const scaleAmount = dist / lastTouchDist.current;
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                
                setTransform(prev => {
                  const newScale = Math.max(minScaleRef.current, Math.min(prev.scale * scaleAmount, 4));
                  const newX = cx - (cx - prev.x) * (newScale / prev.scale);
                  const newY = cy - (cy - prev.y) * (newScale / prev.scale);
                  return { ...prev, x: newX, y: newY, scale: newScale };
                });
            }
          }
          
          // Lógica de Rotação
          const angleDiff = angle - lastTouchAngle.current;
          setTransform(prev => ({ ...prev, rotation: prev.rotation + angleDiff }));

          // Atualiza as referências para o próximo frame
          lastTouchDist.current = dist;
          lastTouchAngle.current = angle;
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
        isPinching.current = false;
      }}
    >
      <div 
        className={`map-legend ${isLegendOpen ? 'open' : ''}`}
        // Impede que os eventos "vazem" para o mapa por baixo
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="map-legend-header" onClick={handleLegendClick}>
          <h4>Legenda</h4>
          <i className={`fa-solid ${isLegendOpen ? 'fa-chevron-up' : 'fa-chevron-down'} ${!hasLegendBeenInteracted ? 'needs-attention' : ''}`}></i>
        </div>

        {/* Corpo da legenda com todos os itens */}
        <div className="map-legend-body">
            <div className="legend-separator"></div>
            <div className="legend-items-list">
                {legendItems.map((item, index) => (
                  <div key={index} className="map-legend-item">
                    {item.type === 'icon' ? (
                      <i className="fas fa-map-marker-alt map-legend-icon" style={{ color: item.color }}></i>
                    ) : (
                      <span className="swatch" style={{ backgroundColor: item.color }}></span>
                    )}
                    <span>{item.label}</span>
                  </div>
              ))}
            </div>
        </div>
      </div>

      {onShowTutorial && (
        <button className="floating-help-button" onClick={onShowTutorial} title="Rever Tutorial">
          <i className="fas fa-circle-question"></i>
        </button>
      )}

      {showHints && !isEditMode && (
        <div className="interaction-hints">
          <div className="hint-item">
            <i className={`fa-solid fa-hand hint-icon ${showHintsAnim ? 'pan-icon-animation' : ''}`}></i>
            <span className="hint-text">Arraste para mover</span>
          </div>
          <div className="hint-item">
            <i className={`fa-solid fa-magnifying-glass-plus hint-icon ${showHintsAnim ? 'zoom-icon-animation' : ''}`}></i>
            <span className="hint-text">Use os dedos para dar zoom</span>
          </div>
          <div className="hint-item">
            <i className={`fa-solid fa-rotate hint-icon ${showHintsAnim ? 'rotate-icon-animation' : ''}`}></i>
            <span className="hint-text">Gire para rotacionar</span>
          </div>
        </div>
      )}

      {showInitialLocationHint && currentMapData && (
        (() => {
          const entranceNode = currentMapData.nodes.find(n => n.id === 'E1');
          if (!entranceNode) return null;
          return (
            <div className="onboarding-guide-popup">
              <div className="onboarding-guide-content">
                <span className="onboarding-guide-question">Você está na entrada da Uninassau?</span>
                <div className="onboarding-guide-actions">
                  <button className="onboarding-guide-button yes" onClick={handleConfirmEntrance}>Sim</button>
                  <button className="onboarding-guide-button no" onClick={handleDismissQuestionPermanently}>Não</button>
                </div>
              </div>
            </div>
          );
        })()
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
            opacity: 0,
          }}
          onClick={(e) => e.stopPropagation()}
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
            <button onClick={() => setPopup(null)} className="popup-close-icon-button">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="popup-title">{popup.label}</div>

            {originId && (
              <div className="popup-ready-badge">
                <i className="fa-solid fa-check-circle"></i> Pronto para navegar
              </div>
            )}

            <div className="popup-buttons">
              <button 
                onClick={setAsOrigin} 
                className={`popup-button ${!originId ? 'needs-action' : ''}`}
              >
                <i className="fa-solid fa-location-dot"></i> Estou aqui
              </button>
              <button 
                onClick={goHere} 
                disabled={!originId} 
                className={`popup-button primary ${originId ? 'needs-action' : ''}`}
              >
                <i className="fa-solid fa-route"></i> Ir para cá
              </button>
            </div>
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
          zIndex: 2, 
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5))',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
    </div>
  );
}