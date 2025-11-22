// src/hooks/useMapData.ts
import { useEffect, useState } from 'react';
import { useMap } from '../contexts/MapContext';

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
const mapConfigs = {
  cima: {
    imageUrl: '/maps/Campus_2D_CIMA.png',
    nodesUrl: '/maps/cima/nodes.json',
    pathGraphUrl: '/maps/cima/path-graph.json',
  },
  staff: {
    imageUrl: '/maps/Campus_2D_CIMA.png', // Using the same image for now
    nodesUrl: '/maps/staff/nodes.json',
    pathGraphUrl: '/maps/staff/path-graph.json',
  },
  detalhe: {
    imageUrl: '/maps/Campus_2D_DETALHE.png',
    nodesUrl: '/maps/detalhe/nodes.json',
    pathGraphUrl: '/maps/detalhe/path-graph.json',
  }
};

export function useMapData() {
  const { mapType } = useMap();
  const [mapInfo, setMapInfo] = useState<MapInfo>({
    data: null,
    imageUrl: mapConfigs[mapType].imageUrl,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mapDetails = mapConfigs[mapType];
    console.log(`🔄 useMapData: Iniciando carregamento para o mapa "${mapType}"...`);
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(mapDetails.nodesUrl)
        .then((res) => {
          console.log(`📡 Fetch ${mapDetails.nodesUrl}:`, res.status);
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${mapDetails.nodesUrl}`);
          return res.json();
        })
        .then((data) => {
          console.log(`✅ ${mapDetails.nodesUrl} carregado:`, {
            nodes: data.nodes?.length || 0,
            edges: data.edges?.length || 0,
            pois: data.pois?.length || 0
          });
          return data;
        }),
      
      fetch(mapDetails.pathGraphUrl)
        .then((res) => {
          console.log(`📡 Fetch ${mapDetails.pathGraphUrl}:`, res.status);
          if (!res.ok) {
            console.warn(`⚠️ ${mapDetails.pathGraphUrl} não encontrado, usando grafo principal`);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            console.log(`✅ ${mapDetails.pathGraphUrl} carregado:`, {
              nodes: data.nodes?.length || 0,
              edges: data.edges?.length || 0
            });
          }
          return data;
        })
        .catch((err) => {
          console.warn(`⚠️ Erro ao carregar ${mapDetails.pathGraphUrl}:`, err.message);
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
  }, [mapType]);

  return { ...mapInfo, loading, error };
}