// src/hooks/usePathfinding.ts
import { useMemo } from 'react';
import type { MapData, MapNode } from './useMapData';

type Adj = Record<string, Array<{ id: string; cost: number }>>;

function dist(a: MapNode, b: MapNode) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function buildAdj(nodes: MapNode[], edges: [string, string][]): { 
  byId: Record<string, MapNode>; 
  adj: Adj 
} {
  const byId: Record<string, MapNode> = {};
  nodes.forEach(n => { byId[n.id] = n; });
  
  const adj: Adj = {};
  let edgesOk = 0;
  let edgesMissing = 0;
  
  edges.forEach(([a, b]) => {
    const A = byId[a];
    const B = byId[b];
    if (!A || !B) {
      console.warn(`⚠️ Aresta com nó faltando: ${a} -> ${b} (A: ${!!A}, B: ${!!B})`);
      edgesMissing++;
      return;
    }
    const cost = dist(A, B);
    (adj[a] ||= []).push({ id: b, cost });
    (adj[b] ||= []).push({ id: a, cost });
    edgesOk++;
  });
  
  console.log(`📊 buildAdj: ${nodes.length} nós, ${edgesOk} arestas OK, ${edgesMissing} faltando`);
  
  return { byId, adj };
}

function aStar(
  byId: Record<string, MapNode>, 
  adj: Adj, 
  startId: string, 
  goalId: string
): string[] | null {
  console.log(`🔍 A*: ${startId} → ${goalId}`);
  
  if (!byId[startId]) {
    console.error(`❌ A*: Nó inicial "${startId}" não existe`);
    return null;
  }
  
  if (!byId[goalId]) {
    console.error(`❌ A*: Nó final "${goalId}" não existe`);
    return null;
  }

  // ✅ CASO ESPECIAL: Se origem = destino
  if (startId === goalId) {
    console.warn('⚠️ A*: Origem e destino são iguais');
    return [startId];
  }

  const open = new Set([startId]);
  const came: Record<string, string | undefined> = {};
  const g: Record<string, number> = { [startId]: 0 };
  const f: Record<string, number> = { [startId]: dist(byId[startId], byId[goalId]) };

  let iterations = 0;
  const maxIterations = 10000;

  while (open.size && iterations < maxIterations) {
    iterations++;
    
    let current: string | null = null;
    let best = Infinity;
    
    for (const id of open) {
      const fi = f[id] ?? Infinity;
      if (fi < best) {
        best = fi;
        current = id;
      }
    }
    
    if (!current) {
      console.warn('⚠️ A*: Nenhum nó atual (open set vazio)');
      break;
    }
    
    if (current === goalId) {
      const path = [current];
      while (came[current]) {
        current = came[current]!;
        path.unshift(current);
      }
      
      // ✅ VALIDAÇÃO DO CAMINHO
      if (path.length < 2) {
        console.warn(`⚠️ A*: Caminho muito curto (${path.length} nós)`);
      }
      
      console.log(`✅ A*: Caminho encontrado em ${iterations} iterações, ${path.length} nós`);
      console.log('Caminho:', path.join(' → '));
      return path;
    }
    
    open.delete(current);
    
    const neighbors = adj[current] || [];
    
    for (const nb of neighbors) {
      const tentative = (g[current] ?? Infinity) + nb.cost;
      if (tentative < (g[nb.id] ?? Infinity)) {
        came[nb.id] = current;
        g[nb.id] = tentative;
        f[nb.id] = tentative + dist(byId[nb.id], byId[goalId]);
        open.add(nb.id);
      }
    }
  }
  
  console.error(`❌ A*: Nenhum caminho encontrado (${iterations} iterações)`);
  return null;
}
  

export function usePathfinding(mapData: MapData | null) {
  const pathfinder = useMemo(() => {
    console.log('🔄 usePathfinding: Inicializando...');
    
    if (!mapData) {
      console.warn('⚠️ usePathfinding: mapData é null');
      return null;
    }

    console.log('📊 usePathfinding: MapData recebido:', {
      nodes: mapData.nodes.length,
      edges: mapData.edges.length,
      pois: mapData.pois?.length || 0,
      hasPathGraph: !!mapData.pathGraph
    });

    // Grafo principal
    console.log('🔨 Construindo grafo principal...');
    const { byId: allNodesById, adj: allAdj } = buildAdj(mapData.nodes, mapData.edges);
    
    // Grafo de caminho (pathGraph)
    const pathGraph = mapData.pathGraph;
    let pathNodesById: Record<string, MapNode> = {};
    let pathAdj: Adj = {};
    
    if (pathGraph && pathGraph.nodes.length > 0) {
      console.log('🔨 Construindo path graph...');
      const result = buildAdj(pathGraph.nodes, pathGraph.edges);
      pathNodesById = result.byId;
      pathAdj = result.adj;
    } else {
      console.warn('⚠️ Sem path graph, usando grafo principal');
    }

    const findNearestPathNode = (node: MapNode): MapNode | null => {
      if (!pathGraph || !pathGraph.nodes.length) return null;
      
      let nearest: MapNode | null = null;
      let minDistance = Infinity;
      
      for (const pathNode of pathGraph.nodes) {
        const d = dist(node, pathNode);
        if (d < minDistance) {
          minDistance = d;
          nearest = pathNode;
        }
      }
      
      if (nearest) {
        console.log(`🎯 Conector mais próximo de "${node.id}": "${nearest.id}" (${minDistance.toFixed(1)}px)`);
      }
      
      return nearest;
    };

    return {
      findPath: (fromId: string, toId: string): MapNode[] | null => {
        console.log('\n🚀 ========== CALCULANDO ROTA ==========');
        console.log(`📍 De: ${fromId}`);
        console.log(`🎯 Para: ${toId}`);
        
        const fromNode = allNodesById[fromId];
        const toNode = allNodesById[toId];

        if (!fromNode) {
          console.error(`❌ Nó de origem "${fromId}" não encontrado`);
          console.log('Nós disponíveis:', Object.keys(allNodesById).join(', '));
          return null;
        }
        
        if (!toNode) {
          console.error(`❌ Nó de destino "${toId}" não encontrado`);
          return null;
        }

        console.log('✅ Nós de origem e destino encontrados');

        // Estratégia 1: Se não houver pathGraph, usar grafo principal
        if (!pathGraph || !pathGraph.nodes.length) {
          console.log('📌 Estratégia: Usar grafo principal direto');
          const ids = aStar(allNodesById, allAdj, fromId, toId);
          if (!ids) {
            console.error('❌ Nenhum caminho encontrado no grafo principal');
            return null;
          }
          const result = ids.map(id => allNodesById[id]).filter(Boolean);
          console.log('✅ Caminho:', result.map(n => n.id).join(' → '));
          return result;
        }

        // Estratégia 2: Usar pathGraph (conectores)
        console.log('📌 Estratégia: Usar path graph (conectores)');
        
        const startPathNode = findNearestPathNode(fromNode);
        const endPathNode = findNearestPathNode(toNode);

        if (!startPathNode) {
          console.error('❌ Não encontrou conector próximo da origem');
          return null;
        }
        
        if (!endPathNode) {
          console.error('❌ Não encontrou conector próximo do destino');
          return null;
        }

        console.log(`🔗 Origem → Conector: ${fromNode.id} → ${startPathNode.id}`);
        console.log(`🔗 Conector → Destino: ${endPathNode.id} → ${toNode.id}`);

        // Se mesmos conectores
        if (startPathNode.id === endPathNode.id) {
          console.log('ℹ️ Mesmo conector, caminho direto');
          const result = [fromNode, startPathNode, toNode];
          console.log('✅ Caminho:', result.map(n => n.id).join(' → '));
          return result;
        }

        // Calcular caminho entre conectores
        console.log(`🔍 Calculando caminho: ${startPathNode.id} → ${endPathNode.id}`);
        const ids = aStar(pathNodesById, pathAdj, startPathNode.id, endPathNode.id);
        
        if (!ids) {
          console.error('❌ Nenhum caminho encontrado entre conectores');
          console.log('Conectores:', {
            inicio: startPathNode.id,
            fim: endPathNode.id,
            vizinhosInicio: pathAdj[startPathNode.id]?.map(n => n.id) || [],
            vizinhosFim: pathAdj[endPathNode.id]?.map(n => n.id) || []
          });
          return null;
        }
        
        const pathViaConnectors = ids.map(id => pathNodesById[id]).filter(Boolean);
        const finalPath: MapNode[] = [fromNode, ...pathViaConnectors, toNode];
        
        console.log('✅ CAMINHO COMPLETO:', finalPath.map(n => n.id).join(' → '));
        console.log(`📏 ${finalPath.length} pontos`);
        console.log('========================================\n');
        
        return finalPath;
      },
      
      nearestNodeId: (x: number, y: number, maxDist = 24): string | null => {
        let bestId: string | null = null;
        let best = Infinity;
        
        for (const n of mapData.nodes) {
          const d = Math.hypot(n.x - x, n.y - y);
          if (d < best && d <= maxDist) {
            best = d;
            bestId = n.id;
          }
        }
        
        return bestId;
      },
    };
  }, [mapData]);

  if (pathfinder) {
    console.log('✅ usePathfinding: Pathfinder inicializado');
  }

  return pathfinder;
}