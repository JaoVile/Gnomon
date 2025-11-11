import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { useNavigation2D, type Node2D, type POI } from '../hooks/useNavigation2D';
import { useThemeVars } from '../libs/useThemeVars';

export type MarkKind = 'ENTRY' | 'REF' | 'CONNECTION';
export type Mark2D = { id: string; x: number; y: number; kind: MarkKind; label?: string };

export type TurnInstruction = {
  instruction: string;
  nodeId: string;
  distance: number; // Distância até o próximo ponto ou o final do segmento
};

// Editor de Conexões (corredores)
type ConnNode = { id: string; x: number; y: number; kind: 'INTERSECTION' | 'WAYPOINT' };
type ConnEdge = { id: string; a: string; b: string; kind: 'CORRIDOR' | 'DOOR'; bidirectional?: boolean; accessible?: boolean };

type Props = {
  mapImageUrl?: string;
  graphUrl?: string;
  corridorsUrl?: string; // Nova prop para o JSON de corredores
  strokeColor?: string;

  // Admin (marcação simples)
  markMode?: boolean;
  markKind?: MarkKind;
  showCoords?: boolean;
  showPoiLabels?: boolean;
  marks?: Mark2D[];
  onMark?: (p: { x: number; y: number; kind: MarkKind }) => void;
  onMarksChange?: (marks: Mark2D[]) => void;

  // Admin (Editor de conexões)
  editGraph?: boolean;
  editTool?: 'node' | 'edge' | 'delete';
  editorNodeKind?: string;
  editorEdgeKind?: string;
  editorBidirectional?: boolean;
  editorAccessible?: boolean;
  onEditorChange?: (d: { nodes: ConnNode[]; edges: ConnEdge[] }) => void;

  // Controles extras
  showCorridorsOverlay?: boolean; // exibir conexões mesmo fora do editor (default false)
  doorSnapPx?: number;            // raio para “colar” origem/dest ao corredor (default 28)

  // Callbacks para troca de imagem/rota
  onSelectOrigin?: (nodeId: string) => void;
  onRequestRoute?: (payload: { fromId: string; toId: string; fromPoiId?: string; toPoiId?: string }) => void;
  onRouteCalculated?: (path: Node2D[], instructions: TurnInstruction[]) => void;
};

type Transform = { x: number; y: number; scale: number };

export default function Map2D({
  mapImageUrl = '/maps/Campus_2D_DETALHE.png',
  graphUrl = '/maps/nodes-2d.json',
  corridorsUrl, // Adicionado
  strokeColor = '#00AEF0',

  markMode = false,
  markKind = 'REF',
  showCoords = false,
  showPoiLabels = false,
  marks,
  onMark,
  onMarksChange,

  // Props do editor
  editGraph = false,
  editTool = 'node',
  editorNodeKind = 'INTERSECTION',
  editorEdgeKind = 'CORRIDOR',
  editorBidirectional = true,
  editorAccessible = true,
  onEditorChange,

  // Extras
  showCorridorsOverlay = !!corridorsUrl, // Alterado para ser true se corridorsUrl for fornecido
  doorSnapPx = 28,

  // Callbacks
  onSelectOrigin,
  onRequestRoute,
  onRouteCalculated,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  // Estado da transformação (pan & zoom)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  const [originId, setOriginId] = useState<string | null>(null);
  const [destId, setDestId] = useState<string | null>(null);

  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const [popup, setPopup] = useState<{ poiId: string; label: string; x: number; y: number; photoUrl?: string } | null>(null);

  // posição calculada do popup (abre para baixo; se não couber, abre para cima)
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; orientation: 'down' | 'up' } | null>(null);

  // Editor de conexões
  const [connNodes, setConnNodes] = useState<ConnNode[]>([]);
  const [connEdges, setConnEdges] = useState<ConnEdge[]>([]);
  const [edgeFromId, setEdgeFromId] = useState<string | null>(null);

  // Hints de interação e tema
  const [showHints, setShowHints] = useState(true);
  const { bg3d } = useThemeVars();

  // Esconde as dicas após um tempo
  useEffect(() => {
    const timer = setTimeout(() => setShowHints(false), 3500);
    return () => clearTimeout(timer);
  }, []);


  // integra com a página
  useEffect(() => {
    onEditorChange?.({ nodes: connNodes, edges: connEdges });
  }, [connNodes, connEdges, onEditorChange]);

  // Carrega o JSON de corredores
  useEffect(() => {
    if (!corridorsUrl) return;
    fetch(corridorsUrl)
      .then(res => res.json())
      .then(data => {
        if (data.nodes) setConnNodes(data.nodes);
        if (data.edges) setConnEdges(data.edges);
      })
      .catch(err => console.error('Erro ao carregar corredores:', err));
  }, [corridorsUrl]);

  const { graph, loading, error, nearestNodeId, findPath } = useNavigation2D(graphUrl);

  // animação de rota
  const routeAnimRef = useRef<{ pts: Node2D[]; total: number; progress: number; raf: number | null } | null>(null);

  function resizeCanvas() {
    const c = canvasRef.current;
    const wrap = containerRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
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

      // Zoom inicial para preencher a largura e centralizar, com um pouco mais de zoom
      const initialScale = cw / iw;
      const zoomFactor = 1.2; // Ajuste este valor para mais ou menos zoom
      const scale = initialScale * zoomFactor;

      // Recalcula x e y para centralizar a imagem com o novo zoom
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

  // fit-contain helpers
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

  // rota animada
  function startRouteAnimation(pts: Node2D[]) {
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
  function drawRouteProgress(ctx: CanvasRenderingContext2D, pts: Node2D[], color = strokeColor) {
    if (!pts.length) return;
    const anim = routeAnimRef.current;
    const invScale = 1 / transform.scale;

    if (!anim || anim.pts !== pts) {
      ctx.lineWidth = 6 * invScale; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach((p: Node2D, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      return;
    }

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
  }

  // --- Grafo de corredores (respeita paredes) ---
  function nearestConnNodeId(x: number, y: number, maxDist = 18) {
    let best: { id: string; d: number } | null = null;
    for (const n of connNodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (!best || d < best.d) best = { id: n.id, d };
    }
    return best && best.d <= maxDist ? best.id : null;
  }

  function buildAdjFromCorridor(
    corrNodes: ConnNode[],
    corrEdges: ConnEdge[],
    poiNodes: Node2D[],
    snapIds: string[],
    snapPx: number
  ) {
    const all: Record<string, { id: string; x: number; y: number }> = {};
    for (const n of corrNodes) all[n.id] = { id: n.id, x: n.x, y: n.y };
    for (const p of poiNodes) all[p.id] = { id: p.id, x: p.x, y: p.y };

    const adj: Record<string, Array<{ id: string; cost: number }>> = {};

    for (const e of corrEdges) {
      const A = all[e.a], B = all[e.b];
      if (!A || !B) continue;
      const w = Math.hypot(A.x - B.x, A.y - B.y);
      (adj[A.id] ||= []).push({ id: B.id, cost: w });
      if (e.bidirectional !== false) (adj[B.id] ||= []).push({ id: A.id, cost: w });
    }

    if (snapIds.length) {
      const corridorOnly = corrNodes.map(n => all[n.id]);
      for (const pid of snapIds) {
        const P = all[pid];
        if (!P) continue;
        let best: { id: string; d: number } | null = null;
        for (const C of corridorOnly) {
          const d = Math.hypot(P.x - C.x, P.y - C.y);
          if (!best || d < best.d) best = { id: C.id, d };
        }
        if (best && best.d <= snapPx) {
          const Cid = best.id;
          const w = best.d;
          (adj[P.id] ||= []).push({ id: Cid, cost: w });
          (adj[Cid] ||= []).push({ id: P.id, cost: w });
        }
      }
    }

    return { all, adj };
  }

  function aStarLocal(
    all: Record<string, { id: string; x: number; y: number }>,
    adj: Record<string, Array<{ id: string; cost: number }>>,
    startId: string,
    goalId: string
  ) {
    if (!all[startId] || !all[goalId]) return null;
    const open = new Set([startId]);
    const came: Record<string, string | undefined> = {};
    const g: Record<string, number> = { [startId]: 0 };
    const f: Record<string, number> = { [startId]: Math.hypot(all[startId].x - all[goalId].x, all[startId].y - all[goalId].y) };

    while (open.size) {
      let current: string | null = null, best = Infinity;
      for (const id of open) { const fi = f[id] ?? Infinity; if (fi < best) { best = fi; current = id; } }
      if (!current) break;
      if (current === goalId) {
        const path = [current];
        while (came[current]) { current = came[current]!; path.unshift(current); }
        return path.map(id => all[id]);
      }
      open.delete(current);
      for (const nb of adj[current] || []) {
        const tentative = (g[current] ?? Infinity) + nb.cost;
        if (tentative < (g[nb.id] ?? Infinity)) {
          came[nb.id] = current;
          g[nb.id] = tentative;
          f[nb.id] = tentative + Math.hypot(all[nb.id].x - all[goalId].x, all[nb.id].y - all[goalId].y);
          open.add(nb.id);
        }
      }
    }
    return null;
  }

  function findPathCorridorRespectingWalls(graph: { nodes: Node2D[]; pois?: POI[] }, fromId: string, toId: string, snapPx = doorSnapPx): { path: Node2D[]; instructions: TurnInstruction[] } | null {
    if (!graph) return null;
    if (!connNodes.length || !connEdges.length) {
      // fallback: usa o grafo do JSON (até você terminar de mapear os corredores)
      const path = findPath(fromId, toId);
      if (!path) return null;
      // Para o fallback, geramos instruções básicas
      const instructions: TurnInstruction[] = [];
      for (let i = 0; i < path.length; i++) {
        const node = path[i];
        const poi = graph.pois?.find(p => p.nodeId === node.id);
        let instruction = `Vá para ${poi?.label || `Ponto ${node.id}`}`;
        let distance = 0;
        if (i < path.length - 1) {
          const nextNode = path[i + 1];
          distance = Math.hypot(nextNode.x - node.x, nextNode.y - node.y);
        }
        instructions.push({ instruction, nodeId: node.id, distance });
      }
      return { path, instructions };
    }
    const poiNodes: Node2D[] = graph.nodes.map((n: Node2D) => ({ id: n.id, x: n.x, y: n.y }));
    const snapIds = [fromId, toId].filter(id => !connNodes.find(n => n.id === id));
    const { all, adj } = buildAdjFromCorridor(connNodes, connEdges, poiNodes, snapIds, snapPx);
    const rawPath = aStarLocal(all, adj, fromId, toId);
    if (!rawPath) return null;

    const path: Node2D[] = rawPath;
    const instructions: TurnInstruction[] = [];

    // Lógica para gerar instruções turn-by-turn
    if (path.length > 0) {
      const startPoi = graph.pois?.find(p => p.nodeId === path[0].id);
      instructions.push({
        instruction: `Comece em ${startPoi?.label || 'ponto de partida'}.`,
        nodeId: path[0].id,
        distance: 0,
      });
    }

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = (angle2 - angle1) * 180 / Math.PI;

      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const poi = graph.pois?.find(p => p.nodeId === curr.id);
      const poiName = poi ? ` em ${poi.label}` : '';

      let instructionText = '';
      if (angleDiff > 45) {
        instructionText = `Vire à direita${poiName}`;
      } else if (angleDiff < -45) {
        instructionText = `Vire à esquerda${poiName}`;
      } else if (Math.abs(angleDiff) <= 45) {
        // Só adiciona "Siga em frente" se for um POI nomeado, para não poluir
        if (poi) {
          instructionText = `Siga em frente, passando por ${poi.label}`;
        }
      }

      if (instructionText) {
        instructions.push({ instruction: instructionText, nodeId: curr.id, distance });
      }
    }

    if (path.length > 1) {
      const lastNode = path[path.length - 1];
      const prevNode = path[path.length - 2];
      const endPoi = graph.pois?.find(p => p.nodeId === lastNode.id);
      const distance = Math.hypot(lastNode.x - prevNode.x, lastNode.y - prevNode.y);
      instructions.push({
        instruction: `Chegou ao seu destino: ${endPoi?.label || 'ponto final'}.`,
        nodeId: lastNode.id,
        distance,
      });
    }

    return { path, instructions };
  }
  // --- fim grafo corredores ---

  // aviso de POIs inválidos
  useEffect(() => {
    if (!graph) return;
    const missing = (graph.pois || []).filter((p: POI) => !graph.nodes.find((n: Node2D) => n.id === p.nodeId));
    if (missing.length) console.warn('POIs com nodeId sem nó correspondente:', missing);
  }, [graph]);

  // calcular posição do popup
  useEffect(() => {
    if (!popup) { setPopupPos(null); return; }
    const wrap = containerRef.current;
    if (!wrap) return;

    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const pad = 8;
    const W = 280;                              // largura estimada
    const H = popup.photoUrl ? 300 : 210;       // altura estimada

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

    // Aplica a transformação de pan & zoom
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Inverso da escala para manter o tamanho dos elementos
    const invScale = 1 / transform.scale;

    // mapa
    if (img) {
      ctx.filter = 'brightness(0.8)'; // Escurece a imagem
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      ctx.filter = 'none'; // Reseta o filtro
    }

    // arestas criadas no editor (mostrar somente no editor OU se overlay habilitado)
    if ((editGraph || showCorridorsOverlay) && connEdges.length) {
      const byId: Record<string, ConnNode> = {};
      for (const n of connNodes) byId[n.id] = n;
      for (const e of connEdges) {
        const A = byId[e.a], B = byId[e.b];
        if (!A || !B) continue;
        const isDoor = e.kind === 'DOOR';
        ctx.beginPath();
        ctx.lineWidth = (isDoor ? 3 : 4) * invScale;
        ctx.strokeStyle = isDoor ? 'rgba(255,149,0,.95)' : 'rgba(0, 174, 240, .55)';
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
    }

    // nós do editor (só no editor)
    if (editGraph && connNodes.length) {
      ctx.font = `${12 * invScale}px Inter, system-ui, sans-serif`;
      connNodes.forEach((n, i) => {
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#00c78c';
        ctx.lineWidth = 3 * invScale;
        ctx.arc(n.x, n.y, 6 * invScale, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        const label = `C${i + 1}`;
        const txt = `x:${n.x.toFixed(1)} y:${n.y.toFixed(1)}`;
        ctx.strokeStyle = 'rgba(0,0,0,.7)';
        ctx.lineWidth = 3 * invScale;
        ctx.fillStyle = '#fff';
        ctx.strokeText(label, n.x + 10 * invScale, n.y - 10 * invScale);
        ctx.fillText(label, n.x + 10 * invScale, n.y - 10 * invScale);
        ctx.strokeText(txt, n.x + 10 * invScale, n.y + 6 * invScale);
        ctx.fillText(txt, n.x + 10 * invScale, n.y + 6 * invScale);
      });
    }

    // indicar origem da aresta (no editor)
    if (editGraph && edgeFromId) {
      const n = connNodes.find(n => n.id === edgeFromId);
      if (n) {
        ctx.beginPath();
        ctx.setLineDash([6 * invScale, 4 * invScale]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 * invScale;
        ctx.arc(n.x, n.y, 12 * invScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (!graph) {
      ctx.restore();
      return;
    };

    // POIs (sem anel extra nas entradas; apenas círculo + miolo branco)
    if (graph?.pois?.length) {
      ctx.font = `${12 * invScale}px Inter, system-ui, sans-serif`;
      for (const poi of graph.pois) {
        const node = graph.nodes.find((n: Node2D) => n.id === poi.nodeId);
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
          const label = poi.label || 'Local';
          ctx.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx.lineWidth = 3 * invScale;
          ctx.fillStyle = '#fff';
          ctx.strokeText(label, node.x + (radius + 6) * invScale, node.y - 8 * invScale);
          ctx.fillText(label, node.x + (radius + 6) * invScale, node.y - 8 * invScale);
        }
      }
    }

    // rota (respeita o grafo de conexões)
    if (originId && destId) {
      const path = findPathCorridorRespectingWalls(graph, originId, destId, doorSnapPx);
      if (path && path.length > 1) {
        drawRouteProgress(ctx, path.path, strokeColor);
      }
    }
    ctx.restore();
  }

  useEffect(draw, [
    img, graph, originId, destId, showPoiLabels, strokeColor,
    connNodes, connEdges, edgeFromId, showCoords, editGraph, showCorridorsOverlay, doorSnapPx,
    transform // Redesenha quando o pan/zoom muda
  ]);

  const getPointerPos = (e: ReactMouseEvent<HTMLDivElement> | WheelEvent | ReactTouchEvent<HTMLDivElement> | ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 1) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      // Para pinch-zoom, calcula o ponto médio
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

    if (!showCoords) return;
    const { x, y } = getPointerPos(e);
    const worldPos = screenToWorld(x, y);
    setCursor(worldPos);
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning.current = false; // Desativa o pan para evitar conflito
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Previne o scroll da página
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



  function onClick(e: ReactMouseEvent<HTMLCanvasElement>) {
    if (isPanning.current && (Math.abs(e.clientX - lastPos.current.x) > 2 || Math.abs(e.clientY - lastPos.current.y) > 2)) {
      return; // Foi um gesto de arrastar, não um clique
    }
    const { x: sx, y: sy } = getPointerPos(e);
    const { x, y } = screenToWorld(sx, sy);

    // EDITOR DE CONEXÕES
    if (editGraph) {
      if (editTool === 'node') {
        const id = 'C' + (connNodes.length + 1);
        const kind = (editorNodeKind === 'WAYPOINT' ? 'WAYPOINT' : 'INTERSECTION') as 'INTERSECTION' | 'WAYPOINT';
        setConnNodes(prev => [...prev, { id, x, y, kind }]);
        return;
      }
      if (editTool === 'edge') {
        const nearId = nearestConnNodeId(x, y, 18);
        if (!nearId) return;
        if (!edgeFromId) { setEdgeFromId(nearId); return; }
        if (edgeFromId === nearId) { setEdgeFromId(null); return; }
        const id = 'E' + (connEdges.length + 1);
        const kind = (editorEdgeKind === 'DOOR' ? 'DOOR' : 'CORRIDOR') as 'CORRIDOR' | 'DOOR';
        setConnEdges(prev => [...prev, {
          id, a: edgeFromId, b: nearId, kind,
          bidirectional: editorBidirectional, accessible: editorAccessible
        }]);
        setEdgeFromId(null);
        return;
      }
      if (editTool === 'delete') {
        const nearId = nearestConnNodeId(x, y, 16);
        if (nearId) {
          setConnEdges(prev => prev.filter(e => e.a !== nearId && e.b !== nearId));
          setConnNodes(prev => prev.filter(n => n.id !== nearId));
        }
        return;
      }
    }

    // MARCAR ponto simples
    if (markMode) {
      const m: Mark2D = { id: 'm' + Date.now(), x, y, kind: markKind };
      if (marks) onMarksChange?.([...(marks || []), m]);

      onMark?.({ x, y, kind: markKind });
      return;
    }

    if (!graph) return;

    // clique em POI → popup
    const poi = pickPoiNear(x, y, 20);
    if (poi) {
      const node = graph.nodes.find((n: Node2D) => n.id === poi.nodeId)!;
      const pos = worldToScreen(node.x, node.y);
      setPopup({ poiId: poi.id, label: poi.label, x: pos.sx, y: pos.sy, photoUrl: poi.photoUrl });
      return;
    }

    // selecionar origem/dest (por nó do grafo)
    let pickId: string | null = nearestNodeId(x, y, 32);
    if (!pickId) return;

    if (!originId) {
      setOriginId(pickId);
      onSelectOrigin?.(pickId);
      stopAnim();
    } else if (!destId) {
      if (!graph) return;
      setDestId(pickId);
      const result = findPathCorridorRespectingWalls(graph, originId, pickId, doorSnapPx);
      if (result && result.path.length > 1) {
        startRouteAnimation(result.path);
        onRouteCalculated?.(result.path, result.instructions);
      }
    } else {
      setOriginId(pickId);
      setDestId(null);
      stopAnim();
    }
  }

  function pickPoiNear(x: number, y: number, maxDist = 24) {
    if (!graph?.pois) return null;
    let best: (POI & { d: number }) | null = null;
    for (const poi of graph.pois) {
      const node = graph.nodes.find((n: Node2D) => n.id === poi.nodeId);
      if (!node) continue;
      const d = Math.hypot(node.x - x, node.y - y);
      if (!best || d < best.d) best = { ...poi, d };
    }
    return best && best.d <= maxDist ? best : null;
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    if (editGraph) { setEdgeFromId(null); return; }
    setPopup(null);
    setPopupPos(null);
    setOriginId(null);
    setDestId(null);
    stopAnim();
  }

  // ações do popup
  function setAsOrigin() {
    if (!popup || !graph) return;
    const poi = graph.pois!.find((p: POI) => p.id === popup.poiId)!;
    const nodeId = poi.nodeId;
    setOriginId(nodeId);
    setDestId(null);
    setPopup(null);
    setPopupPos(null);
    onSelectOrigin?.(nodeId); // callback para MapaPage trocar imagem se quiser
    stopAnim();
  }
  function goHere() {
    if (!popup || !graph) return;
    const poi = graph.pois!.find((p: POI) => p.id === popup.poiId)!;
    const nodeId = poi.nodeId;

    // Dispara troca externa (ex.: para imagem detalhada) ANTES do cálculo da rota
    onRequestRoute?.({
      fromId: originId || nodeId,
      toId: nodeId,
      fromPoiId: undefined,
      toPoiId: popup.poiId
    });

    if (!originId) {
      setOriginId(nodeId);
      setPopup(null);
      setPopupPos(null);
      stopAnim();
      return;
    }

    if (!graph) return;
    setDestId(nodeId);
    setPopup(null);
    setPopupPos(null);
    const result = findPathCorridorRespectingWalls(graph, originId, nodeId, doorSnapPx);
    if (result && result.path.length > 1) {
      startRouteAnimation(result.path as Node2D[]);
      onRouteCalculated?.(result.path, result.instructions);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', touchAction: 'none', cursor: isPanning.current ? 'grabbing' : 'grab', background: bg3d }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Cancela o pan se o mouse sair
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


      {loading && <div style={{ padding: 12, color: '#999' }}>Carregando mapa…</div>}
      {error && <div style={{ padding: 12, color: '#f66' }}>{error}</div>}

      {/* HUD coords */}
      {showCoords && cursor && (
        <div style={{
          position: 'absolute', top: 8, left: 8, padding: '6px 10px',
          background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 8,
          fontSize: 12, pointerEvents: 'none', zIndex: 5
        }}>
          x: {cursor.x.toFixed(1)} · y: {cursor.y.toFixed(1)}
        </div>
      )}

      {/* POPUP POI (posicionado para baixo; se não couber, abre para cima) */}
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
            pointerEvents: 'auto' // Permite cliques no popup
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* setinha */}
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
