import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MapControls } from 'three/examples/jsm/controls/MapControls.js'
import { useThemeVars } from '../libs/useThemeVars'
export default function Campus3D({ url = '/models/Campus.glb', topDown = false }: { url?: string; topDown?: boolean }) {
const ref = useRef<HTMLDivElement>(null)
const sceneRef = useRef<THREE.Scene | null>(null)
const routeMatRef = useRef<THREE.LineBasicMaterial | null>(null)

const { routePrimary, bg3d } = useThemeVars()

// Atualiza cores quando o tema muda
useEffect(() => {
if (routeMatRef.current) routeMatRef.current.color = new THREE.Color(routePrimary)
if (sceneRef.current) sceneRef.current.background = new THREE.Color(bg3d || '#0f1114')
}, [routePrimary, bg3d])

useEffect(() => {
const el = ref.current!
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
renderer.setSize(el.clientWidth, el.clientHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
el.appendChild(renderer.domElement)

const scene = new THREE.Scene()
sceneRef.current = scene
scene.background = new THREE.Color(bg3d || '#0f1114')

const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 5000)
camera.position.set(50, 80, 50)

const controls = new MapControls(camera, renderer.domElement)
controls.enableDamping = true
controls.screenSpacePanning = true
if (topDown) {
  controls.enableRotate = false
  camera.position.set(0, 200, 0)
  camera.up.set(0, 0, -1)
  camera.lookAt(0, 0, 0)
} else {
  controls.minPolarAngle = 0.2
  controls.maxPolarAngle = Math.PI / 2
}

scene.add(new THREE.AmbientLight(0xffffff, 1.0))
const dir = new THREE.DirectionalLight(0xffffff, 0.5)
dir.position.set(100, 150, 50)
scene.add(dir)

const loader = new GLTFLoader()
let root: THREE.Group | null = null

loader.load(
  url,
  (gltf) => {
    root = gltf.scene
    root.traverse((o: any) => { if (o.isMesh) { o.castShadow = o.receiveShadow = false } })
    scene.add(root)

    // Enquadrar câmera
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    if (topDown) {
      const h = Math.max(size.y * 6, 150)
      controls.target.copy(center)
      camera.near = 0.1
      camera.far = Math.max(1000, size.length() * 10)
      camera.updateProjectionMatrix()
      camera.position.set(center.x, center.y + h, center.z)
    } else {
      controls.target.copy(center)
      camera.near = Math.max(0.1, Math.min(size.length() / 100, 10))
      camera.far = Math.max(1000, size.length() * 10)
      camera.updateProjectionMatrix()
      camera.position.set(center.x + size.x, center.y + size.y * 1.2, center.z + size.z)
    }

    // (Opcional) Exemplo de linha de rota 3D — troque pelos seus pontos quando estiver pronto
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(routePrimary) })
    routeMatRef.current = mat
    const points = [new THREE.Vector3(-10, 1, -10), new THREE.Vector3(0, 1, 0), new THREE.Vector3(10, 1, 8)]
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geo, mat)
    scene.add(line)
  },
  undefined,
  (err) => console.error('Falha ao carregar GLB:', err)
)

const onResize = () => {
  const w = el.clientWidth, h = el.clientHeight
  renderer.setSize(w, h)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
const ro = new ResizeObserver(onResize); ro.observe(el)

let raf = 0
const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera) }
loop()

return () => {
  cancelAnimationFrame(raf)
  ro.disconnect()
  if (root) scene.remove(root)
  renderer.dispose()
  el.removeChild(renderer.domElement)
  sceneRef.current = null
  routeMatRef.current = null
}
}, [url, topDown]) // bg3d e routePrimary são aplicadas no outro effect

return <div ref={ref} style={{ width: '100%', height: '100vh' }} />
}