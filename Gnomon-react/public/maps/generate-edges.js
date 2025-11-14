const connections = [
    { "id": "conn_0", "x": 665,"y": 62 },
    { "id": "conn_1", "x": 686, "y": 106 },
    { "id": "conn_2", "x": 727, "y": 94 },
    { "id": "conn_3", "x": 768, "y": 87 },
    { "id": "conn_4", "x": 705, "y": 152 },
    { "id": "conn_5", "x": 722, "y": 152 },
    { "id": "conn_6", "x": 783, "y": 295 },
    { "id": "conn_7", "x": 695, "y": 309 },
    { "id": "conn_8", "x": 616, "y": 319 },
    { "id": "conn_9", "x": 810, "y": 349 },  
    { "id": "conn_10", "x": 823, "y": 376 },
    { "id": "conn_11", "x": 805, "y": 379 },
    { "id": "conn_12", "x": 947, "y": 337 },
    { "id": "conn_13", "x": 939, "y": 323 },
    { "id": "conn_14", "x": 1074, "y": 310 },
    { "id": "conn_15", "x": 1066, "y": 294 },
    { "id": "conn_16", "x": 1164, "y": 299 },
    { "id": "conn_17", "x": 1198, "y": 281 },
    { "id": "conn_18", "x": 1298, "y": 448 },
    { "id": "conn_19", "x": 924, "y": 345 },
    { "id": "conn_20", "x": 970, "y": 445 },
    { "id": "conn_21", "x": 1074, "y": 459 },
    { "id": "conn_22", "x": 1199, "y": 515 },
    { "id": "conn_23", "x": 1217, "y": 556 },
    { "id": "conn_24", "x": 1032, "y": 619 },
    { "id": "conn_25", "x": 977, "y": 629 },
    { "id": "conn_26", "x": 919, "y": 645 },
    { "id": "conn_27", "x": 917, "y": 777 },
    { "id": "conn_28", "x": 1213, "y": 496 },
    { "id": "conn_29", "x": 1210, "y": 453 },
    { "id": "conn_30", "x": 1240, "y": 448 },
    { "id": "conn_31", "x": 1265, "y": 470 }
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