// src/hooks/useMapData.ts
import { useEffect, useState } from 'react';

// ✅ TIPOS PRINCIPAIS (ÚNICA FONTE DE VERDADE)
export type MapNode = {
  id: string;
  x: number;
  y: number;
  floor?: number;
};

export type Poi = {
  id: string;
  label: string;
  nodeId: string;
  type?: string;
  category?: string;
  photoUrl?: string;
  description?: string;
};

export type PathGraph = {
  nodes: MapNode[];
  edges: [string, string][];
};

export type MapData = {
  nodes: MapNode[];
  edges: [string, string][];
  pois: Poi[];
  pathGraph?: PathGraph;
};

export type MapInfo = {
  data: MapData | null;
  imageUrl: string;
};

// ✅ ALIASES PARA COMPATIBILIDADE
export type Node2D = MapNode;
export type POI = Poi;

// Configuração dos mapas
const mapDetails = {
  imageUrl: '/maps/Campus_2D_DETALHE.png',
  nodesUrl: '/maps/nodes-2d-detalhe.json',
  pathGraphUrl: '/maps/path-graph.json',
};

export function useMapData() {
  const [mapInfo, setMapInfo] = useState<MapInfo>({
    data: null,
    imageUrl: mapDetails.imageUrl,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useMapData: Iniciando carregamento...');
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(mapDetails.nodesUrl)
        .then((res) => {
          console.log('📡 Fetch nodes-2d-detalhe.json:', res.status);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${mapDetails.nodesUrl}`);
          return res.json();
        })
        .then((data) => {
          console.log('✅ nodes-2d-detalhe.json carregado:', {
            nodes: data.nodes?.length || 0,
            edges: data.edges?.length || 0,
            pois: data.pois?.length || 0
          });
          return data;
        }),
      
      fetch(mapDetails.pathGraphUrl)
        .then((res) => {
          console.log('📡 Fetch path-graph.json:', res.status);
          if (!res.ok) {
            console.warn('⚠️ path-graph.json não encontrado, usando grafo principal');
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            console.log('✅ path-graph.json carregado:', {
              nodes: data.nodes?.length || 0,
              edges: data.edges?.length || 0
            });
          }
          return data;
        })
        .catch((err) => {
          console.warn('⚠️ Erro ao carregar path-graph.json:', err.message);
          return null;
        })
    ])
      .then(([mainData, pathGraphData]: [Omit<MapData, 'pathGraph'>, PathGraph | null]) => {
        console.log('🔄 Combinando dados...');
        
        const combinedData: MapData = {
          nodes: mainData.nodes || [],
          edges: mainData.edges || [],
          pois: mainData.pois || [],
          pathGraph: pathGraphData ?? undefined,
        };

        console.log('✅ Mapa carregado com sucesso:', {
          totalNodes: combinedData.nodes.length,
          totalEdges: combinedData.edges.length,
          totalPois: combinedData.pois.length,
          hasPathGraph: !!combinedData.pathGraph,
          pathGraphNodes: combinedData.pathGraph?.nodes.length || 0,
          pathGraphEdges: combinedData.pathGraph?.edges.length || 0
        });

        // Validações
        if (!combinedData.nodes.length) {
          console.error('❌ ERRO: Nenhum nó carregado!');
        }
        if (!combinedData.pois.length) {
          console.warn('⚠️ AVISO: Nenhum POI carregado!');
        }
        
        // Verificar se todos os POIs têm nós correspondentes
        const poisSemNo = combinedData.pois.filter(
          poi => !combinedData.nodes.find(n => n.id === poi.nodeId)
        );
        if (poisSemNo.length) {
          console.error('❌ POIs sem nó correspondente:', poisSemNo);
        }

        setMapInfo({
          data: combinedData,
          imageUrl: mapDetails.imageUrl,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ ERRO CRÍTICO ao carregar mapa:", err);
        setError(err.message || 'Erro ao carregar mapa');
        setMapInfo(prev => ({ ...prev, data: null }));
        setLoading(false);
      });
  }, []);

  return { ...mapInfo, loading, error };
}