import { useMemo } from 'react';
import type { MapData, MapNode } from './useMapData';

type Adj = Record<string, Array<{ id: string; cost: number }>>;

function dist(a: MapNode, b: MapNode) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function buildAdj(nodes: MapNode[], edges: [string, string][]): { byId: Record<string, MapNode>; adj: Adj } {
  const byId: Record<string, MapNode> = {};
  nodes.forEach(n => { byId[n.id] = n; });
  const adj: Adj = {};
  edges.forEach(([a, b]) => {
    const A = byId[a];
    const B = byId[b];
    if (!A || !B) return;
    const cost = dist(A, B);
    (adj[a] ||= []).push({ id: b, cost });
    (adj[b] ||= []).push({ id: a, cost });
  });
  return { byId, adj };
}

function aStar(byId: Record<string, MapNode>, adj: Adj, startId: string, goalId: string): string[] | null {
  if (!byId[startId] || !byId[goalId]) return null;
  const open = new Set([startId]);
  const came: Record<string, string | undefined> = {};
  const g: Record<string, number> = { [startId]: 0 };
  const f: Record<string, number> = { [startId]: dist(byId[startId], byId[goalId]) };

  while (open.size) {
    let current: string | null = null;
    let best = Infinity;
    for (const id of open) {
      const fi = f[id] ?? Infinity;
      if (fi < best) {
        best = fi;
        current = id;
      }
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

export function usePathfinding(mapData: MapData | null) {
  const pathfinder = useMemo(() => {
    if (!mapData) return null;

    // O grafo principal com todos os nós (POIs, etc.)
    const { byId: allNodesById } = buildAdj(mapData.nodes, mapData.edges);
    
    // O grafo de caminho apenas com os conectores
    const pathGraph = mapData.pathGraph;
    const { byId: pathNodesById, adj: pathAdj } = pathGraph ? buildAdj(pathGraph.nodes, pathGraph.edges) : { byId: {}, adj: {} };

    const findNearestPathNode = (node: MapNode): MapNode | null => {
        if (!pathGraph) return null;
        let nearest: MapNode | null = null;
        let minDistance = Infinity;
        for (const pathNode of pathGraph.nodes) {
            const d = dist(node, pathNode);
            if (d < minDistance) {
                minDistance = d;
                nearest = pathNode;
            }
        }
        return nearest;
    };

    return {
      findPath: (fromId: string, toId: string): MapNode[] | null => {
        const fromNode = allNodesById[fromId];
        const toNode = allNodesById[toId];

        if (!fromNode || !toNode) return null;

        // Se não houver um grafo de caminho definido, retorna uma linha reta.
        if (!pathGraph || !pathGraph.nodes.length) {
            return [fromNode, toNode];
        }

        // Encontra o nó de conexão mais próximo da origem e do destino.
        const startPathNode = findNearestPathNode(fromNode);
        const endPathNode = findNearestPathNode(toNode);

        if (!startPathNode || !endPathNode) return null;

        // Se os pontos de conexão mais próximos forem os mesmos, a rota é do POI de origem -> ponto de conexão -> POI de destino.
        if (startPathNode.id === endPathNode.id) {
            return [fromNode, startPathNode, toNode];
        }

        // Encontra o caminho apenas no grafo de conexões.
        const ids = aStar(pathNodesById, pathAdj, startPathNode.id, endPathNode.id);
        if (!ids) return null;
        
        const pathViaConnectors = ids.map(id => pathNodesById[id]).filter(Boolean);

        // Constrói o caminho final: Nó de Origem -> ...Caminho pelos Conectores... -> Nó de Destino
        const finalPath: MapNode[] = [fromNode, ...pathViaConnectors, toNode];
        
        return finalPath;
      },
    };
  }, [mapData]);

  return pathfinder;
}