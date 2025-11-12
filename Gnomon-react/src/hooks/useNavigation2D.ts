// src/hooks/useNavigation2D.ts
import { useEffect, useState, useMemo } from 'react';
import type { MapNode } from './useMapData';

// ✅ Usa tipos de useMapData para consistência
export type Edge2D = [string, string, number?];

export type Graph2D = {
  nodes: MapNode[];
  edges: Edge2D[];
};

type Adj = Record<string, Array<{ id: string; cost: number }>>;

function dist(a: MapNode, b: MapNode) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildAdj(nodes: MapNode[], edges: Edge2D[]): { 
  byId: Record<string, MapNode>; 
  adj: Adj 
} {
  const byId: Record<string, MapNode> = {};
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

function aStar(
  byId: Record<string, MapNode>, 
  adj: Adj, 
  startId: string, 
  goalId: string
): string[] | null {
  if (!byId[startId] || !byId[goalId]) return null;
  
  const open = new Set([startId]);
  const came: Record<string, string | undefined> = {};
  const g: Record<string, number> = { [startId]: 0 };
  const f: Record<string, number> = { [startId]: dist(byId[startId], byId[goalId]) };

  while (open.size) {
    let current: string | null = null, best = Infinity;
    for (const id of open) {
      const fi = f[id] ?? Infinity;
      if (fi < best) { best = fi; current = id; }
    }
    
    if (!current) break;
    
    if (current === goalId) {
      const path = [current];
      while (came[current]) {
        current = came[current]!;
        path.unshift(current);
      }
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
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Graph2D) => {
        if (alive) {
          setGraph(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('useNavigation2D error:', err);
        if (alive) {
          setError(err.message || 'Falha ao carregar grafo');
          setLoading(false);
        }
      });
    
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
      if (d < best && d <= maxDist) {
        best = d;
        bestId = n.id;
      }
    }
    return bestId;
  }

  function findPath(fromId: string, toId: string): MapNode[] | null {
    const ids = aStar(byId, adj, fromId, toId);
    if (!ids || !graph) return null;
    return ids.map(id => byId[id]).filter(Boolean);
  }

  return { graph, loading, error, nearestNodeId, findPath };
}