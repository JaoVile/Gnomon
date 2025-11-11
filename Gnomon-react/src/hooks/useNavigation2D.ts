import { useEffect, useMemo, useState } from 'react';

export type Node2D = { id: string; x: number; y: number };
export type Edge2D = [string, string, number?];
export type POI = {
  id: string;
  label: string;
  nodeId: string;
  type?: string; // 'entrance' | 'reference' | etc
  photoUrl?: string; // opcional
  description?: string; // opcional
};

// Adicione o tipo Graph2D que estava faltando
export type Graph2D = {
  nodes: Node2D[];
  edges: Edge2D[];
  pois?: POI[];
};

type Adj = Record<string, Array<{ id: string; cost: number }>>;

function dist(a: Node2D, b: Node2D) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function buildAdj(nodes: Node2D[], edges: Edge2D[]): { byId: Record<string, Node2D>; adj: Adj } {
  const byId: Record<string, Node2D> = {};
  nodes.forEach(n => { byId[n.id] = n; });
  const adj: Adj = {};
  edges.forEach(([a, b, w]) => {
    const A = byId[a], B = byId[b];
    if (!A || !B) return;
    const cost = w ?? dist(A, B);
    (adj[a] ||= []).push({ id: b, cost });
    (adj[b] ||= []).push({ id: a, cost });
  });
  return { byId, adj };
}

function aStar(byId: Record<string, Node2D>, adj: Adj, startId: string, goalId: string): string[] | null {
  if (!byId[startId] || !byId[goalId]) return null;
  const open = new Set([startId]);
  const came: Record<string, string | undefined> = {};
  const g: Record<string, number> = { [startId]: 0 };
  const f: Record<string, number> = { [startId]: dist(byId[startId], byId[goalId]) };

  while (open.size) {
    let current: string | null = null, best = Infinity;
    for (const id of open) { const fi = f[id] ?? Infinity; if (fi < best) { best = fi; current = id; } }
    if (!current) break;
    if (current === goalId) {
      const path = [current];
      while (came[current]) { current = came[current]!; path.unshift(current); }
      return path;
    }
    open.delete(current);
    for (const nb of adj[current] || []) {
      const tentative = (g[current] ?? Infinity) + nb.cost;
      if (tentative < (g[nb.id] ?? Infinity)) {
        came[nb.id] = current;
        g[nb.id] = tentative;
        f[nb.id] = tentative + dist(byId[nb.id], byId[goalId]);
        open.add(nb.id);
      }
    }
  }
  return null;
}

export function useNavigation2D(graphUrl = '/maps/nodes-2d.json') {
  const [graph, setGraph] = useState<Graph2D | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(graphUrl)
      .then(r => r.json())
      .then((data: Graph2D) => { if (alive) { setGraph(data); setLoading(false); } })
      .catch(err => { console.error(err); if (alive) { setError('Falha ao carregar grafo'); setLoading(false); } });
    return () => { alive = false; };
  }, [graphUrl]);

  const { byId, adj } = useMemo(() => {
    if (!graph) return { byId: {}, adj: {} as Adj };
    return buildAdj(graph.nodes, graph.edges);
  }, [graph]);

  function nearestNodeId(x: number, y: number, maxDist = 24): string | null {
    if (!graph) return null;
    let bestId: string | null = null, best = Infinity;
    for (const n of graph.nodes) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < best && d <= maxDist) { best = d; bestId = n.id; }
    }
    return bestId;
  }

  function findPath(fromId: string, toId: string) {
    const ids = aStar(byId, adj, fromId, toId);
    if (!ids || !graph) return null;
    return ids.map(id => byId[id]).filter(Boolean);
  }

  return { graph, loading, error, nearestNodeId, findPath };
}