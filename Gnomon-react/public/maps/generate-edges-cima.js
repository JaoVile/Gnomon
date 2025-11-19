const connections = [
    { "id": "conn_0","x": 470, "y": 43},
    { "id": "conn_1", "x": 470, "y": 82},
    { "id": "conn_2", "x": 523, "y": 81 },
    { "id": "conn_3", "x": 523, "y": 75},
    { "id": "conn_4", "x": 471, "y": 202 },
    { "id": "conn_5", "x": 495, "y": 202 },
    { "id": "conn_6", "x": 472, "y": 263 },
    { "id": "conn_7", "x": 443, "y": 263},
    { "id": "conn_8", "x": 472, "y": 297 },
    { "id": "conn_9", "x": 322, "y": 293 },  
    { "id": "conn_10", "x": 322, "y": 281 },
    { "id": "conn_11", "x": 473, "y": 343 },
    { "id": "conn_12", "x": 478, "y": 343 },
    { "id": "conn_13", "x": 478, "y": 393},
    { "id": "conn_14", "x": 450, "y": 394 },
    { "id": "conn_15", "x": 542, "y": 344 },
    { "id": "conn_16", "x": 542, "y": 317 },
    { "id": "conn_17", "x": 581, "y": 342},
    { "id": "conn_18", "x": 580, "y": 317 },
    { "id": "conn_19", "x": 699, "y": 343 },
    { "id": "conn_20", "x": 735, "y": 344 },
    { "id": "conn_21", "x": 737, "y": 366 },
    { "id": "conn_22", "x": 704, "y": 362},
    { "id": "conn_23", "x": 751, "y": 557 },
    { "id": "conn_24", "x": 550, "y": 344 },
    { "id": "conn_25", "x": 552, "y": 444 },
    { "id": "conn_26", "x": 609, "y": 465 },
    { "id": "conn_27", "x": 611, "y": 496 },
    { "id": "conn_28", "x": 556, "y": 500 },
    { "id": "conn_29", "x": 505, "y": 518 },
    { "id": "conn_30", "x": 508, "y": 678},
    { "id": "conn_31", "x": 401, "y": 682 },
    { "id": "conn_32", "x": 462, "y": 724 },
    { "id": "conn_33", "x": 464, "y": 782 },
    { "id": "conn_34", "x": 431, "y": 792 },
    { "id": "conn_35", "x": 508, "y": 597 },
    { "id": "conn_36", "x": 562, "y": 676},
    { "id": "conn_37", "x": 660, "y": 593 },
    { "id": "conn_38", "x": 684, "y": 547},
    { "id": "conn_39", "x": 684, "y": 481 },
    { "id": "conn_40", "x": 708, "y": 481 },
    { "id": "conn_41", "x": 715, "y": 516},
    { "id": "conn_42", "x": 746, "y": 525},
    { "id": "conn_43", "x": 492, "y": 517 },
    { "id": "conn_44", "x": 493, "y": 447 },
    { "id": "conn_45", "x": 471, "y": 448 },
    { "id": "conn_46", "x": 470, "y": 393 }
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