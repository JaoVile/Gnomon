import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
declare const process: {
  exit: (code: number) => void;
};
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // --- SEED DE ADMIN ---
  const ADMIN_EMAIL = 'gnomon.map@gmail.com';
  const ADMIN_PASSWORD = '12345';

  // 1. Verificar se o usuário admin já existe
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingAdmin) {
    console.log('Usuário administrador já existe. Nenhuma ação necessária.');
  } else {
    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // 3. Criar o novo usuário admin
    await prisma.admin.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: 'Admin Gnomon',
        role: 'ADMIN', // Definir como ADMIN
        isActive: true,
      },
    });
    console.log('✅ Usuário administrador criado com sucesso!');
  }
  // --- FIM SEED DE ADMIN ---
// 1) Garante o Map (andar 0)
let map = await prisma.map.findFirst({ where: { name: 'Campus 2D', floor: 0 } });
if (!map) {
map = await prisma.map.create({
data: {
name: 'Campus 2D',
imageUrl: '/maps/Campus_2D_TESTE.png',
floor: 0,
building: 'A',
isActive: true
}
});
}

// 2) Pontos (Locals + GraphNodes)
const points = [
{ key: 'E1', name: 'Entrada 1 (Cima)', localType: 'ENTRANCE', nodeType: 'ENTRANCE', x: 523.62, y: 187.05 },
{ key: 'E2', name: 'Entrada 2 (Baixo)', localType: 'ENTRANCE', nodeType: 'ENTRANCE', x: 728.71, y: 461.34 },
{ key: 'R1_CRA', name: 'CRA', localType: 'OTHER', nodeType: 'DESTINATION', x: 580.45, y: 177.17 },
{ key: 'R2_BANHEIRO', name: 'Banheiro', localType: 'BATHROOM', nodeType: 'DESTINATION', x: 569.33, y: 304.43 },
{ key: 'R3_PATIO', name: 'Pátio', localType: 'OTHER', nodeType: 'DESTINATION', x: 721.30, y: 315.55 },
{ key: 'R4_CANTINA', name: 'Cantina', localType: 'CAFETERIA', nodeType: 'DESTINATION', x: 696.59, y: 429.21 },
{ key: 'R5_SALA_AULA', name: 'Sala de Aula', localType: 'CLASSROOM', nodeType: 'DESTINATION', x: 654.58, y: 216.71 }
] as const;

// Cria Locals e Nodes
const nodeIdByKey: Record<string, number> = {};

for (const p of points) {
// Local
await prisma.local.create({
data: {
name: p.name,
description: null,
code: null, // pode ajustar (ex: 'SALA-102')
type: p.localType as any,
x: p.x, y: p.y, z: 0,
floor: 0, building: 'A',
iconUrl: null, imageUrl: null,
accessible: true,
mapId: map.id
}
}).catch(() => { /* rodou 2x? ignora erro */ });


// GraphNode
const node = await prisma.graphNode.create({
  data: {
    name: p.name,
    x: p.x, y: p.y, z: 0,
    floor: 0, building: 'A',
    type: p.nodeType as any,
    isActive: true,
    mapId: map.id
  }
});
nodeIdByKey[p.key] = node.id;
}

// 3) Arestas mínimas (você ajusta depois)
const edgePairs: [string, string][] = [
['E1','R1_CRA'],
['R1_CRA','R5_SALA_AULA'],
['R5_SALA_AULA','R2_BANHEIRO'],
['R2_BANHEIRO','R3_PATIO'],
['R3_PATIO','R4_CANTINA'],
['R4_CANTINA','E2']
];
const getPoint = (k: string) => points.find(p => p.key === k)!;
const dist = (a: string, b: string) => {
const A = getPoint(a), B = getPoint(b);
return Math.hypot(A.x - B.x, A.y - B.y);
};

for (const [a, b] of edgePairs) {
const fromId = nodeIdByKey[a];
const toId = nodeIdByKey[b];
const weight = dist(a, b);

await prisma.graphEdge.create({
  data: { fromNodeId: fromId, toNodeId: toId, weight, type: 'CORRIDOR', accessible: true, bidirectional: true }
}).catch(() => {});
await prisma.graphEdge.create({
  data: { fromNodeId: toId, toNodeId: fromId, weight, type: 'CORRIDOR', accessible: true, bidirectional: true }
}).catch(() => {});
}

console.log('✅ Seed concluído!');
}

main().catch(e => {
console.error(e);
process.exit(1);
}).finally(async () => {
await prisma.$disconnect();
});