// src/components/Campus3d.tsx
<<<<<<< HEAD
import { useEffect, useRef, type JSX } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { useThemeVars } from '../libs/useThemeVars';

// Tipos locais (sem libs)
type Edge = [string, string, number?];
type Node3 = { id: string; x: number; y: number; z: number };

=======
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { aStar, buildGraph, type Edge, type Node3 } from '../libs/nav/graph';
import { useThemeVars } from '../libs/useThemeVars';

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
type Entry = {
  id: string;
  label: string;
  anchorId: string;
  vantage?: [number, number, number];
  pos?: [number, number, number];
<<<<<<< HEAD
  color?: string;
=======
  color?: string; // opcional, cor do pin
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
};

type Props = {
  url?: string;
  topDown?: boolean;
  edges?: Edge[];
<<<<<<< HEAD
  entries?: Entry[];
=======
  entries?: Entry[];                 // ← lista de entradas (pins)
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  startNodeId?: string;
  destNodeId?: string;
  selectedEntry?: Entry | null;
  markMode?: boolean;
  onPickPoint?: (p: THREE.Vector3) => void;
  onAnchorsLoaded?: (ids: string[]) => void;
  onFlyEnd?: () => void;
<<<<<<< HEAD
  onEntryClick?: (e: Entry) => void;
};

// Utilitários locais (sem libs)
function dist3(a: Node3, b: Node3) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}
function buildGraph(nodes: Node3[], edges: Edge[]) {
  const byId: Record<string, Node3> = {};
  nodes.forEach(n => { byId[n.id] = n; });
  const adj: Record<string, Array<{ id: string; cost: number }>> = {};
  edges.forEach(([a, b, w]) => {
    const A = byId[a], B = byId[b];
    if (!A || !B) return;
    const cost = w ?? dist3(A, B);
    (adj[a] ||= []).push({ id: b, cost });
    (adj[b] ||= []).push({ id: a, cost });
  });
  return { byId, adj };
}
function aStar3D(graph: ReturnType<typeof buildGraph>, startId: string, goalId: string) {
  const { byId, adj } = graph;
  if (!byId[startId] || !byId[goalId]) return null;
  const open = new Set([startId]);
  const came: Record<string, string | undefined> = {};
  const g: Record<string, number> = { [startId]: 0 };
  const f: Record<string, number> = { [startId]: dist3(byId[startId], byId[goalId]) };
  while (open.size) {
    let current: string | null = null, best = Infinity;
    for (const id of open) { if (f[id] < best) { best = f[id]; current = id; } }
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
        f[nb.id] = tentative + dist3(byId[nb.id], byId[goalId]);
        open.add(nb.id);
      }
    }
  }
  return null;
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
=======
  onEntryClick?: (e: Entry) => void; // ← callback ao clicar no pin
};

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
function disposeMaterial(mat: THREE.Material | THREE.Material[]) {
  if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
  else mat.dispose();
}

export default function Campus3D({
  url = '/models/Campus.glb',
  topDown = false,
  edges = [],
  entries = [],
  startNodeId,
  destNodeId,
  selectedEntry,
  markMode,
  onPickPoint,
  onAnchorsLoaded,
  onFlyEnd,
  onEntryClick
<<<<<<< HEAD
}: Props): JSX.Element {
=======
}: Props) {
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  const containerRef = useRef<HTMLDivElement>(null);

  // core
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<MapControls | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);

  // nav
  const anchorsRef = useRef<Record<string, THREE.Vector3>>({});
  const routeMeshRef = useRef<THREE.Mesh | null>(null);
  const routeMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const startMarkerRef = useRef<THREE.Mesh | null>(null);
  const destMarkerRef = useRef<THREE.Mesh | null>(null);

  // entry pins
  const entryPinsGroupRef = useRef<THREE.Group | null>(null);
  const entriesRef = useRef<Entry[]>(entries);

  // picking
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const markModeRef = useRef<boolean | undefined>(markMode);
  const onPickPointRef = useRef<Props['onPickPoint']>(onPickPoint);

  const { routePrimary, bg3d } = useThemeVars();

  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { markModeRef.current = markMode; }, [markMode]);
  useEffect(() => { onPickPointRef.current = onPickPoint; }, [onPickPoint]);

<<<<<<< HEAD
  // tema em runtime
  useEffect(() => {
    if (routeMatRef.current) routeMatRef.current.color = new THREE.Color(routePrimary);
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(bg3d || '#0f1114');
    if (rendererRef.current) rendererRef.current.setClearColor(bg3d || '#0f1114', 1);
=======
  useEffect(() => {
    if (routeMatRef.current) routeMatRef.current.color = new THREE.Color(routePrimary);
    if (sceneRef.current) sceneRef.current.background = new THREE.Color(bg3d || '#0f1114');
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  }, [routePrimary, bg3d]);

  useEffect(() => {
    const el = containerRef.current!;
<<<<<<< HEAD
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(bg3d || '#0f1114', 1);
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);
=======
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg3d || '#0f1114');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 5000);
    camera.position.set(50, 80, 50);
    cameraRef.current = camera;

    const controls = new MapControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.screenSpacePanning = true;
    if (topDown) {
      controls.enableRotate = false;
      camera.position.set(0, 200, 0);
      camera.up.set(0, 0, -1);
      camera.lookAt(0, 0, 0);
    } else {
      controls.minPolarAngle = 0.2;
      controls.maxPolarAngle = Math.PI / 2;
    }
    controlsRef.current = controls;

<<<<<<< HEAD
    // Luzes (neutras)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(60, 120, 60);
    scene.add(dir);

    // Loader GLB com Draco
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);

=======
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(100, 150, 50);
    scene.add(dir);

    const loader = new GLTFLoader();
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    let disposed = false;

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        rootRef.current = root;
        root.traverse((o: any) => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; } });
        scene.add(root);

<<<<<<< HEAD
        // Enquadrar
=======
        // frame
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        camera.near = Math.max(0.1, Math.min(size.length() / 100, 10));
        camera.far = Math.max(1000, size.length() * 10);
        camera.updateProjectionMatrix();
        if (!topDown) camera.position.set(center.x + size.x, center.y + size.y * 1.2, center.z + size.z);

<<<<<<< HEAD
        // Anchors node:*
=======
        // anchors node:*
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
        const anchors: Record<string, THREE.Vector3> = {};
        const tmp = new THREE.Vector3();
        root.updateMatrixWorld(true);
        root.traverse((o: any) => {
          if (o.name && typeof o.name === 'string' && o.name.startsWith('node:')) {
            o.getWorldPosition(tmp);
            anchors[o.name] = tmp.clone();
          }
        });
        anchorsRef.current = anchors;
        onAnchorsLoaded?.(Object.keys(anchors));

<<<<<<< HEAD
        // pins/rota
        syncEntryPins();
=======
        syncEntryPins();  // ← cria/atualiza os pins
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
        updateRoute();
      },
      undefined,
      (err) => console.error('Falha ao carregar GLB:', err)
    );

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
<<<<<<< HEAD
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
=======
    const ro = new ResizeObserver(onResize); ro.observe(el);
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526

    const onPointerDown = (ev: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      pointerRef.current.y = -((ev.clientY - r.top) / r.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const targets: THREE.Object3D[] = [];
      if (entryPinsGroupRef.current) targets.push(entryPinsGroupRef.current);
      if (rootRef.current) targets.push(rootRef.current);
<<<<<<< HEAD
      const hits = raycasterRef.current.intersectObjects(targets, true);

      // Clique em pin?
      const pinHit = hits.find(h => {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if ((o as any).userData && typeof (o as any).userData.entryIndex === 'number') return true;
=======

      const hits = raycasterRef.current.intersectObjects(targets, true);

      // 1) clique em um pin de entrada?
      const pinHit = hits.find(h => {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if (o.userData && typeof o.userData.entryIndex === 'number') return true;
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
          o = o.parent!;
        }
        return false;
      });

      if (pinHit) {
        let o: THREE.Object3D | null = pinHit.object;
        let idx: number | undefined;
        while (o) {
<<<<<<< HEAD
          if (typeof (o as any).userData.entryIndex === 'number') { idx = (o as any).userData.entryIndex; break; }
=======
          if (typeof o.userData.entryIndex === 'number') {
            idx = o.userData.entryIndex;
            break;
          }
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
          o = o.parent!;
        }
        if (idx !== undefined) {
          const entry = entriesRef.current[idx];
          if (entry && onEntryClick) onEntryClick(entry);
        }
        return;
      }

<<<<<<< HEAD
      // Marcar local
      if (markModeRef.current && hits.length) {
        onPickPointRef.current?.(hits[0].point.clone());
=======
      // 2) se marcar local estiver ativo, captura o ponto
      if (markModeRef.current) {
        if (hits.length) onPickPointRef.current?.(hits[0].point.clone());
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);

      cleanupRoute();
      cleanupMarker(startMarkerRef);
      cleanupMarker(destMarkerRef);
      cleanupEntryPins();

<<<<<<< HEAD
      if (rootRef.current) {
        scene.remove(rootRef.current);
        rootRef.current.traverse((o: any) => {
          if (o.geometry) o.geometry.dispose?.();
          if (o.material) disposeMaterial(o.material as THREE.Material | THREE.Material[]);
        });
      }
=======
      if (rootRef.current) scene.remove(rootRef.current);
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
      renderer.dispose();
      el.removeChild(renderer.domElement);

      routeMatRef.current = null;
      routeMeshRef.current = null;
      rootRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
<<<<<<< HEAD
  }, [url, topDown, bg3d, routePrimary, onAnchorsLoaded, onEntryClick, onPickPoint]);

  // sincronizar pins quando entries mudar
  useEffect(() => { syncEntryPins(); }, [entries]);

  // atualizar rota quando edges/start/dest/selectedEntry mudar
  useEffect(() => { updateRoute(); }, [edges, startNodeId, destNodeId, selectedEntry]);

  // Fly-to
  useEffect(() => {
    if (!selectedEntry) return;
    const cam = cameraRef.current, ctr = controlsRef.current;
=======
  }, [url, topDown]); // tema e props variáveis em effects próprios

  // quando mudar entries ou anchors, sincroniza pins
  useEffect(() => { syncEntryPins(); }, [entries]); // eslint-disable-line

  // atualiza rota ao mudar edges/start/dest/selectedEntry
  useEffect(() => { updateRoute(); }, [edges, startNodeId, destNodeId, selectedEntry]); // eslint-disable-line

  // fly-to na entrada selecionada
  useEffect(() => {
    if (!selectedEntry) return;
    const cam = cameraRef.current as THREE.PerspectiveCamera | null;
    const ctr = controlsRef.current as MapControls | null;
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    if (!cam || !ctr) return;

    const base =
      anchorsRef.current[selectedEntry.anchorId] ||
      (selectedEntry.pos ? new THREE.Vector3(...selectedEntry.pos) : undefined);
    if (!base) return;

    const vantage = selectedEntry.vantage || [0, 10, 12];
    const lookAt = base.clone();
    const dest = base.clone().add(new THREE.Vector3(...vantage));

    const startPos = cam.position.clone();
    const startTarget = ctr.target.clone();

    const dur = 1000;
    const t0 = performance.now();
    function step(now: number) {
<<<<<<< HEAD
      const t = Math.min(1, (now - t0) / dur);
      const k = easeInOut(t);
      cam!.position.lerpVectors(startPos, dest, k);
      const tmp = new THREE.Vector3().lerpVectors(startTarget, lookAt, k);
      ctr!.target.copy(tmp);
      cam!.lookAt(lookAt);
=======
      if (!cam || !ctr) return;
      const t = Math.min(1, (now - t0) / dur);
      const k = easeInOut(t);
      cam.position.lerpVectors(startPos, dest, k);
      const tmp = new THREE.Vector3().lerpVectors(startTarget, lookAt, k);
      ctr.target.copy(tmp);
      cam.lookAt(lookAt);
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
      if (t < 1) requestAnimationFrame(step);
      else onFlyEnd?.();
    }
    requestAnimationFrame(step);
  }, [selectedEntry, onFlyEnd]);

  // helpers
  function cleanupRoute() {
    const scene = sceneRef.current;
    if (!scene) return;
    if (routeMeshRef.current) {
      scene.remove(routeMeshRef.current);
      routeMeshRef.current.geometry.dispose();
      disposeMaterial(routeMeshRef.current.material as THREE.Material | THREE.Material[]);
      routeMeshRef.current = null;
    }
  }
  function cleanupMarker(ref: React.MutableRefObject<THREE.Mesh | null>) {
    const scene = sceneRef.current;
    if (!scene || !ref.current) return;
    scene.remove(ref.current);
    ref.current.geometry?.dispose();
    disposeMaterial(ref.current.material as THREE.Material | THREE.Material[]);
    ref.current = null;
  }
  function ensureMarker(ref: React.MutableRefObject<THREE.Mesh | null>, pos: THREE.Vector3 | undefined, color: string) {
    const scene = sceneRef.current;
    if (!scene) return;
    if (!pos) { if (ref.current) cleanupMarker(ref); return; }
    if (!ref.current) {
      const geom = new THREE.SphereGeometry(0.28, 18, 18);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
      ref.current = new THREE.Mesh(geom, mat);
      scene.add(ref.current);
    }
    ref.current.position.copy(pos);
  }
<<<<<<< HEAD
=======

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  function updateRoute() {
    const scene = sceneRef.current;
    if (!scene) return;

<<<<<<< HEAD
    // base de posições: anchors do GLB + fallback de TODAS as entries com pos
    const posMap: Record<string, THREE.Vector3> = { ...anchorsRef.current };
    for (const e of entriesRef.current) {
      if (e.pos && !posMap[e.anchorId]) posMap[e.anchorId] = new THREE.Vector3(...e.pos);
=======
    const posMap: Record<string, THREE.Vector3> = { ...anchorsRef.current };
    if (selectedEntry?.pos && selectedEntry.anchorId && !posMap[selectedEntry.anchorId]) {
      posMap[selectedEntry.anchorId] = new THREE.Vector3(...selectedEntry.pos);
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    }

    const nodes: Node3[] = Object.entries(posMap).map(([id, p]) => ({ id, x: p.x, y: p.y, z: p.z }));
    const graph = buildGraph(nodes, edges || []);

    const startPos = startNodeId ? posMap[startNodeId] : undefined;
    const destPos = destNodeId ? posMap[destNodeId] : undefined;
    ensureMarker(startMarkerRef, startPos, '#34c759');
    ensureMarker(destMarkerRef, destPos, '#ffcc00');

    cleanupRoute();
    if (!startNodeId || !destNodeId) return;
<<<<<<< HEAD

    const pathIds = aStar3D(graph, startNodeId, destNodeId);
=======
    const pathIds = aStar(graph, startNodeId, destNodeId);
>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    if (!pathIds || pathIds.length < 2) return;

    const pts = pathIds.map((id) => posMap[id]).filter(Boolean) as THREE.Vector3[];
    if (pts.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.08);
    const tube = new THREE.TubeGeometry(curve, 220, 0.12, 12, false);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(routePrimary), transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(tube, mat);
    scene.add(mesh);
    routeMeshRef.current = mesh;
    routeMatRef.current = mat;
  }
<<<<<<< HEAD
=======

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  function cleanupEntryPins() {
    const scene = sceneRef.current;
    if (!scene || !entryPinsGroupRef.current) return;
    scene.remove(entryPinsGroupRef.current);
    entryPinsGroupRef.current.traverse((o: any) => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) disposeMaterial(o.material);
    });
    entryPinsGroupRef.current = null;
  }
<<<<<<< HEAD
  function makePin(colorHex: string) {
    const color = new THREE.Color(colorHex);
    const g = new THREE.Group();
=======

  function makePin(colorHex: string) {
    const color = new THREE.Color(colorHex);
    const g = new THREE.Group();

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 18, 18),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 })
    );
    sphere.position.set(0, 0.4, 0);
<<<<<<< HEAD
=======

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.06, 8, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
<<<<<<< HEAD
    g.add(sphere); g.add(ring);
    return g;
  }
=======

    g.add(sphere);
    g.add(ring);
    return g;
  }

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
  function syncEntryPins() {
    const scene = sceneRef.current;
    if (!scene) return;

    cleanupEntryPins();
<<<<<<< HEAD
=======

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    const group = new THREE.Group();
    entries.forEach((e, idx) => {
      const p =
        anchorsRef.current[e.anchorId] ||
        (e.pos ? new THREE.Vector3(e.pos[0], e.pos[1], e.pos[2]) : undefined);
      if (!p) return;
<<<<<<< HEAD
      const pin = makePin(e.color || (idx === 0 ? '#00AEF0' : idx === 1 ? '#34C759' : '#FFCC00'));
      pin.position.copy(p);
      (pin as any).userData.entryIndex = idx;
      pin.name = `pin:${e.id}`;
      group.add(pin);
    });
=======

      const pin = makePin(e.color || (idx === 0 ? '#00AEF0' : idx === 1 ? '#34C759' : '#FFCC00'));
      pin.position.copy(p);
      pin.userData.entryIndex = idx;
      pin.name = `pin:${e.id}`;
      group.add(pin);
    });

>>>>>>> d5fa0e01db4f9d48297d1ee27a7f18d4fce9c526
    entryPinsGroupRef.current = group;
    scene.add(group);
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}