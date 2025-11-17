// src/components/Campus3d.tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { useThemeVars } from '../libs/useThemeVars';

type Edge = [string, string, number?];
type Node3 = { id: string; x: number; y: number; z: number };

type Entry = {
  id: string;
  label: string;
  anchorId: string;
  vantage?: [number, number, number];
  pos?: [number, number, number];
  color?: string;
};

type Props = {
  url?: string;
  topDown?: boolean;
  edges?: Edge[];
  entries?: Entry[];
  startNodeId?: string;
  destNodeId?: string;
  selectedEntry?: Entry | null;
  markMode?: boolean;
  onPickPoint?: (p: THREE.Vector3) => void;
  onAnchorsLoaded?: (ids: string[]) => void;
  onFlyEnd?: () => void;
  onEntryClick?: (e: Entry) => void;
};

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
    for (const id of open) if (f[id] < best) { best = f[id]; current = id; }
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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<MapControls | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);

  const anchorsRef = useRef<Record<string, THREE.Vector3>>({});
  const routeMeshRef = useRef<THREE.Mesh | null>(null);
  const routeMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const startMarkerRef = useRef<THREE.Mesh | null>(null);
  const destMarkerRef = useRef<THREE.Mesh | null>(null);

  const entryPinsGroupRef = useRef<THREE.Group | null>(null);
  const entriesRef = useRef<Entry[]>(entries);

  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const markModeRef = useRef<boolean | undefined>(markMode);

  const onPickPointRef = useRef(onPickPoint);
  const onAnchorsLoadedRef = useRef(onAnchorsLoaded);
  const onFlyEndRef = useRef(onFlyEnd);
  const onEntryClickRef = useRef(onEntryClick);

  const { routePrimary } = useThemeVars();

  useEffect(() => { entriesRef.current = entries; }, [entries]);
  useEffect(() => { markModeRef.current = markMode; }, [markMode]);
  useEffect(() => { onPickPointRef.current = onPickPoint; }, [onPickPoint]);
  useEffect(() => { onAnchorsLoadedRef.current = onAnchorsLoaded; }, [onAnchorsLoaded]);
  useEffect(() => { onFlyEndRef.current = onFlyEnd; }, [onFlyEnd]);
  useEffect(() => { onEntryClickRef.current = onEntryClick; }, [onEntryClick]);

  // Theme updater
  useEffect(() => {
    if (routeMatRef.current) {
      routeMatRef.current.color = new THREE.Color(routePrimary);
    }
  }, [routePrimary]);

  // Main setup
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 5000);
    camera.position.set(50, 80, 50);
    cameraRef.current = camera;

    const controls = new MapControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.screenSpacePanning = true;
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(60, 120, 60);
    scene.add(dir);

    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    const onPointerDown = (ev: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      pointerRef.current.y = -((ev.clientY - r.top) / r.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const targets: THREE.Object3D[] = [];
      if (entryPinsGroupRef.current) targets.push(entryPinsGroupRef.current);
      if (rootRef.current) targets.push(rootRef.current);
      const hits = raycasterRef.current.intersectObjects(targets, true);

      const pinHit = hits.find(h => {
        let o: THREE.Object3D | null = h.object;
        while (o) {
          if ((o as any).userData && typeof (o as any).userData.entryIndex === 'number') return true;
          o = o.parent!;
        }
        return false;
      });

      if (pinHit) {
        let o: THREE.Object3D | null = pinHit.object;
        let idx: number | undefined;
        while (o) {
          if (typeof (o as any).userData.entryIndex === 'number') { idx = (o as any).userData.entryIndex; break; }
          o = o.parent!;
        }
        if (idx !== undefined) {
          const entry = entriesRef.current[idx];
          if (entry && onEntryClickRef.current) onEntryClickRef.current(entry);
        }
        return;
      }

      if (markModeRef.current && hits.length) {
        onPickPointRef.current?.(hits[0].point.clone());
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (el && renderer.domElement.parentElement === el) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  // GLB loader
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (rootRef.current) {
      scene.remove(rootRef.current);
      rootRef.current.traverse((o: any) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) disposeMaterial(o.material as THREE.Material | THREE.Material[]);
      });
    }

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(draco);

    let disposed = false;
    loader.load(
      url,
      (gltf) => {
        if (disposed || !sceneRef.current) return;
        const root = gltf.scene;
        rootRef.current = root;
        root.traverse((o: any) => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; } });
        scene.add(root);

        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        if (controlsRef.current) controlsRef.current.target.copy(center);
        if (cameraRef.current) {
          cameraRef.current.near = Math.max(0.1, Math.min(size.length() / 100, 10));
          cameraRef.current.far = Math.max(1000, size.length() * 10);
          cameraRef.current.updateProjectionMatrix();
          if (!topDown) cameraRef.current.position.set(center.x, center.y + 20, center.z + 50);
        }

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
        onAnchorsLoadedRef.current?.(Object.keys(anchors));

        syncEntryPins();
        updateRoute();
      },
      undefined,
      (err) => console.error('Falha ao carregar GLB:', err)
    );
    return () => { disposed = true; }
  }, [url, topDown]);

  useEffect(() => { syncEntryPins(); }, [entries]);
  useEffect(() => { updateRoute(); }, [edges, startNodeId, destNodeId, selectedEntry]);

  useEffect(() => {
    if (!selectedEntry) return;
    const cam = cameraRef.current;
    if (!cam) return;
    const ctr = controlsRef.current;
    if (!ctr) return;

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
      if (!cam) return;
      const t = Math.min(1, (now - t0) / dur);
      const k = easeInOut(t);
      cam.position.lerpVectors(startPos, dest, k);
      const tmp = new THREE.Vector3().lerpVectors(startTarget, lookAt, k);
      ctr!.target.copy(tmp);
      cam.lookAt(lookAt);
      if (t < 1) requestAnimationFrame(step);
      else onFlyEndRef.current?.();
    }
    requestAnimationFrame(step);
  }, [selectedEntry]);

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

  function updateRoute() {
    const scene = sceneRef.current;
    if (!scene) return;

    const posMap: Record<string, THREE.Vector3> = { ...anchorsRef.current };
    for (const e of entriesRef.current) {
      if (e.pos && !posMap[e.anchorId]) posMap[e.anchorId] = new THREE.Vector3(...e.pos);
    }

    const nodes: Node3[] = Object.entries(posMap).map(([id, p]) => ({ id, x: p.x, y: p.y, z: p.z }));
    const graph = buildGraph(nodes, edges || []);

    const startPos = startNodeId ? posMap[startNodeId] : undefined;
    const destPos = destNodeId ? posMap[destNodeId] : undefined;
    ensureMarker(startMarkerRef, startPos, '#34c759');
    ensureMarker(destMarkerRef, destPos, '#ffcc00');

    cleanupRoute();
    if (!startNodeId || !destNodeId) return;

    const pathIds = aStar3D(graph, startNodeId, destNodeId);
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

  function makePin(colorHex: string) {
    const color = new THREE.Color(colorHex);
    const g = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 18, 18),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 })
    );
    sphere.position.set(0, 0.4, 0);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.06, 8, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(sphere); g.add(ring);
    return g;
  }

  function syncEntryPins() {
    const scene = sceneRef.current;
    if (!scene) return;

    cleanupEntryPins();
    const group = new THREE.Group();
    entries.forEach((e, idx) => {
      const p =
        anchorsRef.current[e.anchorId] ||
        (e.pos ? new THREE.Vector3(e.pos[0], e.pos[1], e.pos[2]) : undefined);
      if (!p) return;
      const pin = makePin(e.color || (idx === 0 ? '#00AEF0' : idx === 1 ? '#34C759' : '#FFCC00'));
      pin.position.copy(p);
      (pin as any).userData.entryIndex = idx;
      pin.name = `pin:${e.id}`;
      group.add(pin);
    });
    entryPinsGroupRef.current = group;
    scene.add(group);
  }

  return <div
    ref={containerRef}
    style={{ width: '100%', height: '100%' }}
  />;
}