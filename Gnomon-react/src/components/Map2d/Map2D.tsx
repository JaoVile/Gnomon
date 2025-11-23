import { useEffect, useRef, useState, useMemo, useLayoutEffect, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useMapData, type MapData, type MapNode, type Poi } from '../../hooks/useMapData';
import { usePathfinding } from '../../hooks/usePathfinding';
import MapLegend, { type LegendItem } from '../MapLegend/MapLegend';

const initialLegendItems: LegendItem[] = [
  { type: 'icon', value: 'fa-location-dot', label: 'Ponto de Entrada' },
  { type: 'icon', value: 'fa-map-pin', label: 'Ponto de Referência' },
];

const poiCategoryColorMap: { pattern: RegExp, label: string, color: string }[] = [
  { pattern: /auditório/i, label: 'Auditório', color: '#FFB3BA' },
  { pattern: /cantina/i, label: 'Cantina', color: '#4655b4ff' },
  { pattern: /laboratório|lab/i, label: 'Laboratórios', color: '#00FFFF' },
  { pattern: /biblioteca/i, label: 'Biblioteca', color: '#FFFF00' },
  { pattern: /banheiro/i, label: 'Banheiros', color: '#DDA0DD' },
  { pattern: /sala/i, label: 'Salas', color: '#f0e68dff' },
  { pattern: /direção|coordenação|adm/i, label: 'Administração', color: '#D9ED92' },
  // Add more patterns as needed
];

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
  // Props para o BottomSheet
  isBottomSheetOpen = false,
  bottomSheetPeekHeight = 0,
  // Props do modo de edição
  isEditMode = false,
  editTool = 'none',
  onMapClick = () => {},
  onNodeClick = () => {},
  onCursorMove = () => {},
  tempNodes = [],
  tempPois = [],
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
  const transformAnimRef = useRef<number | null>(null);
  const minScaleRef = useRef(1);

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' | 'left' | 'right' } | null>(null);

  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [hasLegendBeenInteracted, setHasLegendBeenInteracted] = useState(false);
  const [showHints, setShowHints] = useState(true);

  const routeAnimDuration = animationOptions?.routeAnimationDuration ?? 1000;
  const showHintsAnim = animationOptions?.showHintAnimations ?? true;

  const handleLegendClick = () => {
    setIsLegendOpen(!isLegendOpen);
    if (!hasLegendBeenInteracted) {
      setHasLegendBeenInteracted(true);
    }
  };

  const locationItems = useMemo(() => {
    if (!currentMapData || !currentMapData.pois) return [];
    
    const addedCategories = new Set<string>(); // To ensure unique categories
    const items: LegendItem[] = [];

    for (const poi of currentMapData.pois) {
      const poiLabel = poi.label;
      let categoryFound: { label: string, color: string } | null = null;

      for (const category of poiCategoryColorMap) {
        if (category.pattern.test(poiLabel)) {
          categoryFound = { label: category.label, color: category.color };
          break;
        }
      }

      if (categoryFound && !addedCategories.has(categoryFound.label)) {
        items.push({ type: 'color', value: categoryFound.color, label: categoryFound.label });
        addedCategories.add(categoryFound.label);
      }
    }
    return items;
  }, [currentMapData]);



  // Função para animar a transformação (pan/zoom)
  const zoomTo = (targetX: number, targetY: number, targetScale: number, duration = 500, onFinish?: (finalTransform: Transform) => void) => {
    if (transformAnimRef.current) {
      cancelAnimationFrame(transformAnimRef.current);
    }

    const startTransform = { ...transform };
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Calcula o X/Y final para centralizar o ponto
    const finalX = cw / 2 - targetX * targetScale;
    const finalY = ch / 2 - targetY * targetScale;

    const animStartTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - animStartTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Ease-in-out

      const nextX = startTransform.x + (finalX - startTransform.x) * easeProgress;
      const nextY = startTransform.y + (finalY - startTransform.y) * easeProgress;
      const nextScale = startTransform.scale + (targetScale - startTransform.scale) * easeProgress;

      const nextTransform = { x: nextX, y: nextY, scale: nextScale };
      setTransform(nextTransform);

      if (progress < 1) {
        transformAnimRef.current = requestAnimationFrame(animate);
      } else {
        transformAnimRef.current = null;
        if (onFinish) onFinish(nextTransform);
      }
    };

    transformAnimRef.current = requestAnimationFrame(animate);
  };

  // Efeito para focar em um POI
  useEffect(() => {
    if (focusOnPoi && currentMapData) {
      const poi = currentMapData.pois.find(p => p.id === focusOnPoi);
      if (poi) {
        const node = currentMapData.nodes.find(n => n.id === poi.nodeId);
        if (node) {
          zoomTo(node.x, node.y, 2, 500, (finalTransform) => {
            // Adiciona um atraso para garantir que a renderização esteja estável
            setTimeout(() => {
              const sx = finalTransform.x + node.x * finalTransform.scale;
              const sy = finalTransform.y + node.y * finalTransform.scale;
              setPopup({ poiId: poi.id, label: poi.label, x: sx, y: sy, photoUrl: poi.photoUrl });
            }, 500); // Atraso de 0.5 segundo conforme solicitado
          });
        }
      }
      onFocusDone(); // Reseta o gatilho no pai
    }
  }, [focusOnPoi, currentMapData, onFocusDone, zoomTo]);

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
  }, [destinationToRoute, originId, pathfinder, currentMapData, onDestinationRouted, onRouteCalculated, normalizePathToNodes]);

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
      
      const isMobile = isMobileDevice();

      let scale;

      if (isMobile) {
        // On mobile, calculate scale to fit the visible height precisely.
        const visibleHeight = ch - bottomSheetPeekHeight;
        scale = (visibleHeight / ih) * 0.69;
      } else {
        // On desktop, use the existing logic to cover the container and apply a zoom multiplier.
        const scaleX = cw / iw;
        const scaleY = ch / ih;
        const baseScale = Math.max(scaleX, scaleY);
        scale = baseScale * initialZoomMultiplier;
      }
      
      minScaleRef.current = cw / iw; // Minimum scale should always allow seeing the full width.

      let x;
      let y = 0;

      if (isMobile) {
        // Pan map content to the left, showing more of the right side of the map.
        x = -(iw * 0.10) * scale;
      } else {
        // Desktop logic: center horizontally.
        x = (cw - iw * scale) / 2;
        // Specific adjustments for desktop view of this map.
        if (mapImageUrl.includes('Campus_2D_CIMA.png')) {
          y = -(ih * 0.10) * scale;
        }
      }

      setTransform({ x, y, scale });
    };
    im.src = mapImageUrl;
  }, [mapImageUrl, initialZoomMultiplier, bottomSheetPeekHeight]);

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

          const calculateAndSetPosition = () => {
            if (!popupRef.current || !containerRef.current) return;
    
            const popupEl = popupRef.current;
            const containerEl = containerRef.current;
            
            const W = popupEl.offsetWidth;
            const H = popupEl.offsetHeight;
    
            if (W === 0 || H === 0) {
              requestAnimationFrame(calculateAndSetPosition);
              return;
            }
    
            const cw = containerEl.clientWidth;
            const ch = containerEl.clientHeight;
            const pad = 16;
            const pinGap = 24;
            
            // Ajusta a altura disponível se o BottomSheet estiver fechado/peeked
            let effectiveBottomPadding = pad;
            if (!isBottomSheetOpen && bottomSheetPeekHeight > 0) {
              effectiveBottomPadding = Math.max(pad, bottomSheetPeekHeight + 10); // 10px de margem acima do peek
            }
    
            const { x: pinX, y: pinY } = popup;
    
            const positions = {
              bottom: { top: pinY + pinGap, left: pinX - W / 2, orientation: 'down' as const },
              top: { top: pinY - H - pinGap, left: pinX - W / 2, orientation: 'up' as const },
              right: { top: pinY - H / 2, left: pinX + pinGap, orientation: 'right' as const },
              left: { top: pinY - H / 2, left: pinX - W - pinGap, orientation: 'left' as const },
            };
    
            const isFullyVisible = (pos: {top: number, left: number}) => {
              return pos.left >= pad && pos.left + W <= cw - pad && pos.top >= pad && pos.top + H <= ch - effectiveBottomPadding;
            };
    
            let chosenKey: string | null = null;
            const preferredOrder = ['top', 'bottom', 'right', 'left'];
    
            for (const key of preferredOrder) {
              if (isFullyVisible(positions[key as keyof typeof positions])) {
                chosenKey = key;
                break;
              }
            }
    
            let finalLeft, finalTop, finalOrientation;
    
            if (chosenKey) {
              const pos = positions[chosenKey as keyof typeof positions];
              finalLeft = pos.left;
              finalTop = pos.top;
              finalOrientation = pos.orientation;
            } else {
              // Fallback to original logic if no position is perfect
              let bestPosition = { score: -1, finalLeft: 0, finalTop: 0, finalOrientation: 'down' as 'down' | 'up' | 'left' | 'right' };
    
              for (const key in positions) {
                const pos = positions[key as keyof typeof positions];
                
                const left = Math.min(Math.max(pos.left, pad), cw - W - pad);
                const top = Math.min(Math.max(pos.top, pad), ch - H - effectiveBottomPadding); // Ajustado aqui
    
                const visibleWidth = Math.max(0, Math.min(left + W, cw - pad) - Math.max(left, pad));
                const visibleHeight = Math.max(0, Math.min(top + H, ch - effectiveBottomPadding) - Math.max(top, pad)); // Ajustado aqui
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
            const img = new Image();
            img.src = popup.photoUrl;
            img.onload = calculateAndSetPosition;
            img.onerror = calculateAndSetPosition;
          } else {
            requestAnimationFrame(calculateAndSetPosition);
          }
        }, [popup, isBottomSheetOpen, bottomSheetPeekHeight]);
  function worldToScreen(x: number, y: number) {
    return { sx: transform.x + x * transform.scale, sy: transform.y + y * transform.scale };
  }
  function screenToWorld(sx: number, sy: number) {
    return { x: (sx - transform.x) / transform.scale, y: (sy - transform.y) / transform.scale };
  }

  function normalizePoiType(t?: string) { return String(t ?? '').trim().toLowerCase(); }
  function getPoiVisual(poiType?: string) {
    const isEntrance = normalizePoiType(poiType).includes('entr');
    return { isEntrance, color: isEntrance ? '#FF3B30' : '#FFCC00', radius: isEntrance ? 10 : 8 };
  }

  function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
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

    ctx.setLineDash([]);
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

      // Desenha a rota primeiro para que fique por baixo dos pins
      if (pathToDraw && pathToDraw.length > 0) {
        drawRoute(ctx, pathToDraw, strokeColor);
      }

      // Desenha os POIs existentes
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
          drawPin(ctx, node.x, node.y, size, pinColor);

          if (showPoiLabels) {
            ctx.fillStyle = '#FFF';
            ctx.fillText(poi.label, node.x + (size + 4) * inv, node.y + 4 * inv);
          }
        }
      }
      
      // Apenas no modo de edição, desenha todos os nós de conexão existentes
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

      // Desenha os nós e POIs temporários do modo de edição
      if (isEditMode) {
        // Desenha POIs temporários
        for (const poi of tempPois) {
          const node = tempNodes.find(n => n.id === poi.nodeId);
          if (!node) continue;
          const visual = getPoiVisual(poi.type);
          drawPin(ctx, node.x, node.y, visual.radius * inv, '#A020F0'); // Roxo para temporários
          ctx.fillStyle = '#FFF';
          ctx.fillText(`[NOVO] ${poi.label}`, node.x + (visual.radius + 4) * inv, node.y + 4 * inv);
        }
        // Desenha nós de conexão temporários
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
    drawRoute, getPoiVisual
  ]);

  useEffect(() => {
    let rafId: number;
    const renderLoop = () => {
      draw();
      rafId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [draw]);

  const getPointerPos = (e: ReactMouseEvent<HTMLDivElement> | WheelEvent | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 1) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      const t1 = e.touches[0], t2 = e.touches[1];
      return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
    }
    return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (popup) setPopup(null);
      const { x, y } = getPointerPos(e);
      const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => {
        const newScale = Math.max(minScaleRef.current, Math.min(prev.scale * scaleAmount, 4));
        const newX = x - (x - prev.x) * (newScale / prev.scale);
        const newY = y - (y - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    };
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [popup]);

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
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

  function pickTempNodeNear(x: number, y: number, maxDist: number) {
    if (!tempNodes) return null;
    let best: (Node2D & { d: number }) | null = null;
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
    const poi = currentMapData.pois!.find(p => p.id === popup.poiId)!;
    onSelectOrigin(poi.nodeId, poi.label);
    setPopup(null);
  }

  function normalizePathToNodes(raw: string[] | MapNode[] | null): MapNode[] {
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
          isPanning.current = false;
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
            onPanStart();
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
              const newScale = Math.max(minScaleRef.current, Math.min(prev.scale * scaleAmount, 4));
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
                                <div className="interaction-hints">          <div className="hint-item">
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

      <MapLegend
        initialItems={initialLegendItems}
        locationItems={locationItems}
        isOpen={isLegendOpen}
        onToggle={handleLegendClick}
      />

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
