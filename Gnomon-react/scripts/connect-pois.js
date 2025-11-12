const fs = require('fs');

// Carrega os dados
const mainGraph = require('../public/maps/nodes-2d-detalhe.json');
const pathGraph = require('../public/maps/path-graph.json');

// Função para calcular distância
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Encontra o conector mais próximo para cada POI
const newEdges = [];

for (const poi of mainGraph.pois) {
  const poiNode = mainGraph.nodes.find(n => n.id === poi.nodeId);
  if (!poiNode) continue;

  let nearest = null;
  let minDist = Infinity;

  for (const connector of pathGraph.nodes) {
    const d = dist(poiNode, connector);
    if (d < minDist) {
      minDist = d;
      nearest = connector;
    }
  }

  if (nearest) {
    newEdges.push([poi.nodeId, nearest.id]);
    console.log(`✅ ${poi.label} → ${nearest.id} (${minDist.toFixed(1)}px)`);
  }
}

console.log('\nAdicione estas edges ao nodes-2d-detalhe.json:');
console.log(JSON.stringify(newEdges, null, 2));