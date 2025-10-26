export type Node3 = { id: string; x: number; y: number; z: number };
export type Edge = [string, string, number?];
export type Graph = {
byId: Record<string, Node3>;
adj: Record<string, Array<{ id: string; cost: number }>>;
};

export function dist(a: Node3, b: Node3) {
return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export function buildGraph(nodes: Node3[], edges: Edge[]): Graph {
const byId: Record<string, Node3> = {};
nodes.forEach((n) => (byId[n.id] = n));
const adj: Graph['adj'] = {};
edges.forEach(([a, b, w]) => {
const A = byId[a];
const B = byId[b];
if (!A || !B) return;
const cost = w ?? dist(A, B);
(adj[a] ||= []).push({ id: b, cost });
(adj[b] ||= []).push({ id: a, cost });
});
return { byId, adj };
}

export function aStar(graph: Graph, startId: string, goalId: string) {
const { byId, adj } = graph;
if (!byId[startId] || !byId[goalId]) return null;

const open = new Set([startId]);
const came: Record<string, string | undefined> = {};
const g: Record<string, number> = { [startId]: 0 };
const f: Record<string, number> = { [startId]: dist(byId[startId], byId[goalId]) };

while (open.size) {
let current: string | null = null;
let best = Infinity;
for (const id of open) {
if (f[id] < best) { current = id; best = f[id]; }
}
if (!current) break;

if (current === goalId) {
  const path = [current];
  while (came[current]) { current = came[current]!; path.unshift(current); }
  return path;
}

open.delete(current);
for (const nb of adj[current] || []) {
  const tentative = g[current] + nb.cost;
  if (tentative < (g[nb.id] ?? Infinity)) {
    came[nb.id] = current;
    g[nb.id] = tentative;
    f[nb.id] = tentative + dist(byId[nb.id], byId[goalId]);
    open.add(nb.id);
  }
}
}
return null;
}