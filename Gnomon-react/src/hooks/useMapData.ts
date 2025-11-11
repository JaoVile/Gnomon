import { useEffect, useState } from 'react';

export type MapNode = {
  id: string;
  x: number;
  y: number;
};

export type Poi = {
  id: string;
  label: string;
  nodeId: string;
  type: string;
  category: string;
  photoUrl: string;
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

  useEffect(() => {
    Promise.all([
      fetch(mapDetails.nodesUrl).then((res) => res.json()),
      fetch(mapDetails.pathGraphUrl).then((res) => res.json())
    ]).then(([mainData, pathGraphData]: [Omit<MapData, 'pathGraph'>, PathGraph | null]) => {
        const combinedData: MapData = {
            ...mainData,
            pathGraph: pathGraphData ?? undefined,
        };

        setMapInfo({
          data: combinedData,
          imageUrl: mapDetails.imageUrl,
        });
      }).catch(err => {
        console.error("Failed to load map data:", err);
        setMapInfo(prev => ({ ...prev, data: null }));
      });
  }, []);

  return mapInfo;
}