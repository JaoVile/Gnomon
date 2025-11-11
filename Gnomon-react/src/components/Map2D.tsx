import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useThemeVars } from '../libs/useThemeVars';
import { useMapData, type MapData, type MapNode, type Poi } from '../hooks/useMapData'; // Updated import
import { usePathfinding } from '../hooks/usePathfinding'; // Added

export type { MapNode, Poi };

export type MarkKind = 'ENTRY' | 'REF' | 'CONNECTION';
export type Mark2D = { id: string; x: number; y: number; kind: MarkKind };
export type TurnInstruction = { text: string; distance: number; icon: string };

type Props = {
  mapData?: MapData | null; // Make optional as it might be loaded internally
  mapImageUrl: string;
  strokeColor?: string;

  // Roteamento (controlado pelo pai)
  path?: MapNode[] | null;
  originId?: string | null;
  destId?: string | null;
  onSelectOrigin: (nodeId: string) => void;
  onRouteCalculated: (path: MapNode[], instructions: TurnInstruction[]) => void;

  // Admin Mode
  markMode: boolean;
  markKind: MarkKind;
  showCoords: boolean;
  showPoiLabels: boolean;
  marks: Mark2D[];
  onMark: (p: { x: number; y: number; kind: MarkKind }) => void;
  editGraph: boolean;
  editTool: 'node' | 'edge' | 'delete';
  editorNodeKind: 'INTERSECTION' | 'WAYPOINT';
  onEditorChange: (data: { nodes: any[]; edges: any[] }) => void;
};

type Transform = { x: number; y: number; scale: number };

export default function Map2D({
  mapData: mapDataProp,
  mapImageUrl,
  strokeColor = '#00AEF0',
  path,
  originId,
  onSelectOrigin,
  onRouteCalculated,

  // Admin Mode
  markMode,
  markKind,
  showCoords,
  showPoiLabels,
  marks,
  onMark,
  editGraph,
  editTool,
  editorNodeKind,
  onEditorChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  const { data: mapDataInternal } = useMapData();
  const currentMapData = mapDataProp || mapDataInternal;

  const pathfinder = usePathfinding(currentMapData);

  // Estado da transformação (pan & zoom)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' } | null>(null);

  // Hints de interação e tema
  const [showHints, setShowHints] = useState(true);
  const { bg3d } = useThemeVars();

  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // animação de rota
  const routeAnimRef = useRef<{ pts: MapNode[]; total: number; progress: number; raf: number | null } | null>(null);

  useEffect(() => {
    if (path && path.length > 1) {
      startRouteAnimation(path);
      // Assuming pathfinder can provide instructions, or we generate them here
      // For now, we'll just pass an empty array for instructions
      onRouteCalculated(path, []);
    } else {
      stopAnim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, onRouteCalculated]);


  function resizeCanvas() {
    const c = canvasRef.current;
    const wrap = containerRef.current;
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
      const zoomFactor = 1.2;
      const scale = initialScale * zoomFactor;

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
    const sx = transform.x + x * transform.scale;
    const sy = transform.y + y * transform.scale;
    return { sx, sy };
  }
  function screenToWorld(sx: number, sy: number) {
    const x = (sx - transform.x) / transform.scale;
    const y = (sy - transform.y) / transform.scale;
    return { x, y };
  }

  function normalizePoiType(t: string | undefined) {
    return String(t ?? '').trim().toLowerCase();
  }
  function getPoiVisual(poiType: string | undefined) {
    const t = normalizePoiType(poiType);
    const isEntrance = t.includes('entr');
    return {
      isEntrance,
      color: isEntrance ? '#0A84FF' : '#FFCC00',
      radius: isEntrance ? 10 : 6,
    };
  }

  function startRouteAnimation(pts: MapNode[]) {
    stopAnim();
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    routeAnimRef.current = { pts, total, progress: 0, raf: null };
    const t0 = performance.now();
    const dur = Math.min(1800, Math.max(900, total * 2));
    const step = (t: number) => {
      if (!routeAnimRef.current) return;
      const k = Math.min(1, (t - t0) / dur);
      const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      routeAnimRef.current.progress = ease;
      draw();
      if (k < 1) routeAnimRef.current.raf = requestAnimationFrame(step);
    };
    routeAnimRef.current.raf = requestAnimationFrame(step);
  }
  function stopAnim() {
    if (routeAnimRef.current?.raf) cancelAnimationFrame(routeAnimRef.current.raf);
    routeAnimRef.current = null;
  }
  function drawRoute(ctx: CanvasRenderingContext2D, pts: MapNode[], color = strokeColor) {
    if (!pts || pts.length < 2) return;
    
    const invScale = 1 / transform.scale;
    const anim = routeAnimRef.current;

    if (anim && anim.pts === pts) {
      const target = anim.total * anim.progress;
      ctx.lineWidth = 6 * invScale; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      let acc = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (acc + seg <= target) {
          if (i === 0) ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          acc += seg;
        } else {
          const remain = target - acc;
          const t = Math.max(0, Math.min(1, remain / seg));
          const px = a.x + (b.x - a.x) * t;
          const py = a.y + (b.y - a.y) * t;
          if (i === 0) ctx.moveTo(a.x, a.y);
          ctx.lineTo(px, py);
          break;
        }
      }
      ctx.stroke();
    } else {
      ctx.lineWidth = 6 * invScale; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach((p: MapNode, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }
  }

  useEffect(() => {
    if (!currentMapData) return;
    const missing = (currentMapData.pois || []).filter((p: Poi) => !currentMapData.nodes.find((n: MapNode) => n.id === p.nodeId));
    if (missing.length) console.warn('POIs com nodeId sem nó correspondente:', missing);
  }, [currentMapData]);

  useEffect(() => {
    if (!popup) { setPopupPos(null); return; }
    const wrap = containerRef.current;
    if (!wrap) return;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const pad = 8;
    const W = 280;
    const H = popup.photoUrl ? 300 : 210;

    const downTop = popup.y + 12;
    const canOpenDown = downTop + H + pad <= ch;

    const top = canOpenDown ? downTop : Math.max(pad, popup.y - H - 12);
    const left = Math.min(Math.max(popup.x - W / 2, pad), cw - W - pad);

    setPopupPos({
      left,
      top,
      orientation: canOpenDown ? 'down' : 'up'
    });
  }, [popup]);

  function draw() {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const invScale = 1 / transform.scale;

    if (img) {
      ctx.filter = 'brightness(0.8)';
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      ctx.filter = 'none';
    }

    if (!currentMapData) {
      ctx.restore();
      return;
    };

    // Draw edges
    ctx.lineWidth = 2 * invScale;
    ctx.strokeStyle = '#888';
    ctx.beginPath();
    for (const [a, b] of currentMapData.edges) {
      const nodeA = currentMapData.nodes.find(n => n.id === a);
      const nodeB = currentMapData.nodes.find(n => n.id === b);
      if (nodeA && nodeB) {
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
      }
    }
    ctx.stroke();

    // Draw nodes
    for (const node of currentMapData.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4 * invScale, 0, Math.PI * 2);
      ctx.fillStyle = '#00F';
      ctx.fill();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1 * invScale;
      ctx.stroke();

      if (showCoords) {
        ctx.font = `${10 * invScale}px Arial`;
        ctx.fillStyle = '#FFF';
        ctx.fillText(`(${node.x.toFixed(0)}, ${node.y.toFixed(0)})`, node.x + 6 * invScale, node.y + 4 * invScale);
      }
    }

    // Draw POIs
    if (currentMapData?.pois?.length) {
      ctx.font = `${12 * invScale}px Inter, system-ui, sans-serif`;
      for (const poi of currentMapData.pois) {
        const node = currentMapData.nodes.find((n: MapNode) => n.id === poi.nodeId);
        if (!node) continue;
        const { color, radius, isEntrance } = getPoiVisual(poi.type);

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 6 * invScale;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 * invScale;
        ctx.arc(node.x, node.y, radius * invScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isEntrance) {
          ctx.beginPath();
          ctx.fillStyle = '#ffffff';
          ctx.arc(node.x, node.y, Math.max(2 * invScale, (radius * 0.35) * invScale), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (showPoiLabels) {
          ctx.font = `${12 * invScale}px Inter, system-ui, sans-serif`;
          ctx.fillStyle = '#FFF';
          ctx.fillText(poi.label, node.x + (radius + 4) * invScale, node.y + 4 * invScale);
        }
      }
    }

    // Draw marks
    if (markMode && marks.length) {
      for (const mark of marks) {
        ctx.beginPath();
        ctx.arc(mark.x, mark.y, 8 * invScale, 0, Math.PI * 2);
        ctx.fillStyle = mark.kind === 'ENTRY' ? 'green' : mark.kind === 'REF' ? 'orange' : 'purple';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2 * invScale;
        ctx.stroke();

        if (showCoords) {
          ctx.font = `${10 * invScale}px Arial`;
          ctx.fillStyle = '#FFF';
          ctx.fillText(`(${mark.x.toFixed(0)}, ${mark.y.toFixed(0)})`, mark.x + 10 * invScale, mark.y + 4 * invScale);
        }
      }
    }

    if (path) {
      drawRoute(ctx, path, strokeColor);
    }
    
    ctx.restore();
  }

  useEffect(draw, [
    img, currentMapData, path, strokeColor, transform, markMode, marks, showCoords, showPoiLabels
  ]);

  const getPointerPos = (e: ReactMouseEvent<HTMLDivElement> | WheelEvent | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 1) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      return { x: (t1.clientX + t2.clientX) / 2 - rect.left, y: (t1.clientY + t2.clientY) / 2 - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

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
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - lastPos.current.x;
      const dy = e.touches[0].clientY - lastPos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scaleAmount = dist / lastTouchDist.current;
      lastTouchDist.current = dist;

      const { x, y } = getPointerPos(e);
      const newScale = Math.max(0.1, Math.min(transform.scale * scaleAmount, 10));

      setTransform(prev => {
        const newX = x - (x - prev.x) * (newScale / prev.scale);
        const newY = y - (y - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    }
  };

  const handleTouchEnd = () => {
    isPanning.current = false;
    lastTouchDist.current = 0;
  };

  function nearestNodeId(x: number, y: number, maxDist = 24): string | null {
    if (!currentMapData) return null;
    let bestId: string | null = null, best = Infinity;
    for (const n of currentMapData.nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < best && d <= maxDist) { best = d; bestId = n.id; }
    }
    return bestId;
  }

  function onClick(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (isPanning.current && (Math.abs(e.clientX - lastPos.current.x) > 2 || Math.abs(e.clientY - lastPos.current.y) > 2)) {
      return;
    }
    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    if (!currentMapData) return;

    if (markMode) {
      onMark({ x, y, kind: markKind });
      return;
    }

    if (editGraph) {
      if (editTool === 'node') {
        const newNode = { id: `node_${Date.now()}`, x, y, kind: editorNodeKind };
        onEditorChange({ nodes: [...currentMapData.nodes, newNode], edges: currentMapData.edges });
      } else if (editTool === 'edge') {
        // Logic for connecting nodes
        // This would require selecting two nodes
      } else if (editTool === 'delete') {
        // Logic for deleting nodes/edges
      }
      return;
    }

    const poi = pickPoiNear(x, y, 20);
    if (poi) {
      const node = currentMapData.nodes.find((n: MapNode) => n.id === poi.nodeId)!;
      const pos = worldToScreen(node.x, node.y);
      setPopup({ poiId: poi.id, label: poi.label, x: pos.sx, y: pos.sy, photoUrl: poi.photoUrl });
      return;
    }

    let pickId: string | null = nearestNodeId(x, y, 32);
    if (!pickId) return;

    if (!originId) {
      onSelectOrigin(pickId);
    } else {
      // Calculate path using pathfinder
      if (pathfinder && currentMapData) {
        const foundPath = pathfinder.findPath(originId, pickId);
        if (foundPath) {
          // Assuming instructions can be generated from the path
          const instructions: TurnInstruction[] = []; // Placeholder for actual instructions
          onRouteCalculated(foundPath, instructions);
        }
      }
      // We don't call onRequestRoute here anymore, as Map2D is now responsible for calculating the route
    }
  }

  function pickPoiNear(x: number, y: number, maxDist = 24) {
    if (!currentMapData?.pois) return null;
    let best: (Poi & { d: number }) | null = null;
    for (const poi of currentMapData.pois) {
      const node = currentMapData.nodes.find((n: MapNode) => n.id === poi.nodeId);
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
    // onClearRoute(); // Removed as it's no longer a prop
  }

  function setAsOrigin() {
    if (!popup || !currentMapData) return;
    const poi = currentMapData.pois!.find((p: Poi) => p.id === popup.poiId)!;
    onSelectOrigin(poi.nodeId);
    setPopup(null);
    setPopupPos(null);
  }
  function goHere() {
    if (!popup || !currentMapData || !originId) return;
    const poi = currentMapData.pois!.find((p: Poi) => p.id === popup.poiId)!;
    if (pathfinder && currentMapData) {
      const foundPath = pathfinder.findPath(originId, poi.nodeId);
      if (foundPath) {
        const instructions: TurnInstruction[] = [];
        onRouteCalculated(foundPath, instructions);
      }
    }
    setPopup(null);
    setPopupPos(null);
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none', cursor: isPanning.current ? 'grabbing' : 'grab', background: bg3d }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showHints && (
        <div className="interaction-hints">
          <div className="hint-item">
            <i className="fa-solid fa-hand hint-icon pan-icon"></i>
            <span className="hint-text">Arraste para mover</span>
          </div>
          <div className="hint-item">
            <i className="fa-solid fa-magnifying-glass-plus hint-icon zoom-icon"></i>
            <span className="hint-text">Use a roda ou pinça para zoom</span>
          </div>
        </div>
      )}

      {currentMapData === null && <div style={{ padding: 12, color: '#999' }}>Carregando mapa…</div>}

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
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {popupPos.orientation === 'down' ? (
            <div style={{
              position: 'absolute',
              left: '50%',
              top: -6,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid rgba(20,22,26,0.95)'
            }} />
          ) : (
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: -6,
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(20,22,26,0.95)'
            }} />
          )}

          {popup.photoUrl && (
            <img
              src={popup.photoUrl}
              alt={popup.label}
              style={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12
              }}
            />
          )}
          <div style={{ padding: '10px 12px', display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>{popup.label}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={setAsOrigin}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #2c2c2e', background: '#2c2c2e', color: '#fff'
                }}
              >
                Estou aqui
              </button>
              <button
                onClick={goHere}
                style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid #0A84FF', background: '#0A84FF', color: '#fff'
                }}
              >
                Ir para cá
              </button>
            </div>
            <button
              onClick={() => { setPopup(null); setPopupPos(null); }}
              style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: '#9aa3af', cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{ display: 'block', width: '100%', height: '100%', position: 'relative', zIndex: 1, borderRadius: '16px' }}
      />
    </div>
  );
}
