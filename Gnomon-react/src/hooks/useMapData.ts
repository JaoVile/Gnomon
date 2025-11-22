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
  detalhe: {
    imageUrl: '/maps/Campus_2D_DETALHE.png',
    nodesUrl: '/maps/detalhe/nodes.json',
    pathGraphUrl: '/maps/detalhe/path-graph.json',
  }
};

export function useMapData() {
  const { mapType } = useMap();
  const [mapInfo, setMapInfo] = useState<MapInfo>(() => {
    // Defensivamente, garanta que mapType seja válido ou use um padrão.
    const initialConfig = mapConfigs[mapType as keyof typeof mapConfigs] || mapConfigs.cima;
    return {
      data: null,
      imageUrl: initialConfig.imageUrl,
    };
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const mapDetails = mapConfigs[mapType as keyof typeof mapConfigs];
      if (!mapDetails) {
        throw new Error(`Configuração de mapa inválida: ${mapType}`);
      }

      console.log(`🔄 useMapData: Iniciando carregamento para o mapa "${mapType}"...`);
      setLoading(true);
      setError(null);

      Promise.all([
        fetch(mapDetails.nodesUrl).then(res => res.json()),
        fetch(mapDetails.pathGraphUrl).then(res => res.ok ? res.json() : null).catch(() => null)
      ])
        .then(([mainData, pathGraphData]) => {
          const combinedData: MapData = {
            nodes: mainData?.nodes || [],
            edges: mainData?.edges || [],
            pois: mainData?.pois || [],
            pathGraph: pathGraphData || undefined,
          };
          
          setMapInfo({
            data: combinedData,
            imageUrl: mapDetails.imageUrl,
          });
        })
        .catch(err => {
          console.error("❌ ERRO CRÍTICO ao carregar mapa:", err);
          setError(err.message || 'Erro ao carregar mapa');
        })
        .finally(() => {
          setLoading(false);
        });

    } catch (error) {
      const err = error as Error;
      console.error("❌ ERRO ao inicializar o carregamento do mapa:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [mapType]);

  return { ...mapInfo, loading, error };
}