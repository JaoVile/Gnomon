const connections = [
  { x: 486.35, y: 182.67 },
  { x: 517.04, y: 215.41 },
  { x: 595.75, y: 185.58 },
  { x: 558.44, y: 200.93 },
  { x: 547.34, y: 253.96 },
  { x: 559.06, y: 250.26 },
  { x: 617.64, y: 327.35 },
  { x: 586.81, y: 291.58 },
  { x: 645.15, y: 363.96 },
  { x: 676.53, y: 402.54 },
  { x: 707.04, y: 444.28 },
  { x: 634.33, y: 474.3 },
  { x: 580.77, y: 500.78 },
  { x: 731.24, y: 474.3 },
  { x: 740.87, y: 471.89 },
  { x: 765.54, y: 508 },
  { x: 752.9, y: 508.6 },
  { x: 756.52, y: 436.38 },
  { x: 798.65, y: 424.94 },
  { x: 837.17, y: 416.51 },
  { x: 863.05, y: 405.68 },
  { x: 882.91, y: 399.06 },
  { x: 911.8, y: 424.34 },
  { x: 921.43, y: 387.62 },
  { x: 964.77, y: 374.98 },
  { x: 1000.88, y: 362.34 },
  { x: 1041.21, y: 346.09 },
  { x: 1071.91, y: 362.95 },
  { x: 1050.24, y: 378.59 },
  { x: 1136.31, y: 413.5 },
  { x: 1102.6, y: 399.06 },
  { x: 1177.24, y: 445.4 },
  { x: 1218.77, y: 477.3 },
  { x: 1251.87, y: 508 }
];

// Gerar nodes com IDs
const nodes = connections.map((conn, i) => ({
  id: `conn_${i}`,
  x: conn.x,
  y: conn.y
}));

// Gerar edges conectando pontos próximos (máximo 80px de distância)
const edges = [];
const MAX_DISTANCE = 80;

for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const dx = nodes[i].x - nodes[j].x;
    const dy = nodes[i].y - nodes[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist <= MAX_DISTANCE) {
      edges.push([nodes[i].id, nodes[j].id]);
    }
  }
}

const pathGraph = { nodes, edges };

console.log(JSON.stringify(pathGraph, null, 2));