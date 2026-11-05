import {
  AmbientLight, Color, DirectionalLight, Group, InstancedMesh, LineBasicMaterial, LineLoop,
  BufferGeometry, Matrix4, MeshStandardMaterial, PerspectiveCamera, Scene,
  SphereGeometry, Spherical, Vector3, WebGLRenderer, Points, ShaderMaterial, Float32BufferAttribute, AdditiveBlending,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import type { AtomModel } from './atomModel'
import type { OrbitalCloud } from './orbitals'

export type AtomScene = ReturnType<typeof createAtomScene>

/** Schematic geometry: particle sizes, shell radii and motion are deliberately not to scale. */
export function createAtomScene(host: HTMLElement, onError: () => void) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const labels = new CSS2DRenderer()
  labels.domElement.setAttribute('aria-hidden', 'true')
  Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
  host.appendChild(labels.domElement)
  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, .1, 100)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.enableDamping = false
  controls.minPolarAngle = .06
  controls.maxPolarAngle = Math.PI - .06
  controls.minDistance = 1
  controls.maxDistance = 40
  scene.add(new AmbientLight(0xc8daff, 1.8))
  const key = new DirectionalLight(0xffffff, 3)
  key.position.set(4, 5, 6)
  const rim = new DirectionalLight(0x77baff, 2)
  rim.position.set(-4, -2, -3)
  scene.add(key, rim)

  const nucleonGeometry = new SphereGeometry(.15, 16, 12)
  const electronGeometry = new SphereGeometry(.075, 12, 10)
  const protonMaterial = new MeshStandardMaterial({ color: '#fb7185', roughness: .32, metalness: .15 })
  const neutronMaterial = new MeshStandardMaterial({ color: '#f5d48f', roughness: .4, metalness: .12 })
  const electronMaterial = new MeshStandardMaterial({ color: '#82ddff', emissive: new Color('#2389b4'), emissiveIntensity: .65, roughness: .3 })
  const orbitMaterial = new LineBasicMaterial({ color: '#729bd8', transparent: true, opacity: .32 })
  const cloudMaterial = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { opacity: { value: .52 }, cutaway: { value: false } },
    vertexShader: `attribute float phase; varying float vPhase; varying float vZ;
      void main() { vPhase=phase; vZ=position.z;
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(34.0/max(1.0,-mv.z),1.2,5.0); }`,
    fragmentShader: `uniform float opacity; uniform bool cutaway; varying float vPhase; varying float vZ;
      void main() { if(cutaway && vZ>0.0) discard;
        float d=length(gl_PointCoord-vec2(0.5)); if(d>0.5) discard;
        vec3 color=vPhase>0.0?vec3(0.22,0.75,1.0):vec3(1.0,0.66,0.29);
        gl_FragColor=vec4(color,opacity*(1.0-smoothstep(0.08,0.5,d))); }`,
  })
  let cloud: Points | undefined
  let cloudMode = false
  let shellRadius = 3
  let selectedShell: number | null = null
  let particleFocus: 'proton' | 'neutron' | 'electron' | null = null
  let root = new Group()
  scene.add(root)
  const shells = new Map<number, { group: Group; rotor: Group }>()
  let labelObjects: CSS2DObject[] = []
  let nucleus = new Group()
  let outerRadius = 3
  let labelsVisible = false
  let motion = false
  let inView = true
  let disposed = false
  let frame = 0
  let lastFrame = 0

  function render() {
    if (disposed || !inView || document.hidden) return
    renderer.render(scene, camera)
    labels.render(scene, camera)
  }
  function animate(time: number) {
    frame = 0
    if (disposed || !motion || !inView || document.hidden) return
    frame = requestAnimationFrame(animate)
    if (lastFrame && time - lastFrame < 1000 / 30) return
    const elapsed = lastFrame ? Math.min((time - lastFrame) / 1000, .06) : 0
    lastFrame = time
    if (cloudMode) root.rotation.y += elapsed * .13
    else {
      nucleus.rotation.y += elapsed * .1
      for (const [number, { rotor }] of shells) rotor.rotation.z += elapsed * .45 / Math.sqrt(number)
    }
    render()
  }
  function syncLoop() {
    cancelAnimationFrame(frame)
    frame = 0
    lastFrame = 0
    render()
    if (!disposed && motion && inView && !document.hidden) frame = requestAnimationFrame(animate)
  }
  function addLabel(parent: Group, text: string, position: Vector3, kind: string) {
    const element = document.createElement('span')
    element.className = `atom-scene-label atom-scene-label-${kind}`
    element.textContent = text
    const label = new CSS2DObject(element)
    label.position.copy(position)
    label.visible = labelsVisible
    parent.add(label)
    labelObjects.push(label)
  }
  function clearCloud() {
    if (cloud) { root.remove(cloud); cloud.geometry.dispose(); cloud = undefined }
  }
  function clearModel() {
    clearCloud()
    root.traverse(object => {
      if (object instanceof InstancedMesh) object.dispose()
      if (object instanceof LineLoop) object.geometry.dispose()
    })
    labelObjects.forEach(label => label.element.remove())
    labelObjects = []
    shells.clear()
    scene.remove(root)
    root.clear()
    root = new Group()
    scene.add(root)
  }
  function resetView() {
    root.rotation.set(0, 0, 0)
    camera.position.set(outerRadius * .3, outerRadius * .45, outerRadius * 3.1)
    controls.target.set(0, 0, 0)
    controls.update()
    render()
  }
  function setAtom(model: AtomModel) {
    if (disposed) return
    clearModel()
    nucleus = new Group()
    root.add(nucleus)
    const protons = new InstancedMesh(nucleonGeometry, protonMaterial, model.protons)
    const neutrons = model.neutrons ? new InstancedMesh(nucleonGeometry, neutronMaterial, model.neutrons) : null
    nucleus.add(protons)
    if (neutrons) nucleus.add(neutrons)
    const matrix = new Matrix4()
    const a = model.massNumber
    const radius = Math.max(.12, Math.cbrt(a) * .17)
    let p = 0, n = 0
    for (let i = 0; i < a; i++) {
      const r = radius * Math.cbrt((i + .5) / a)
      const cos = 1 - 2 * ((i * .61803398875 + .5) % 1)
      const sin = Math.sqrt(1 - cos * cos)
      const angle = i * 2.39996322973
      const position = new Vector3(r * sin * Math.cos(angle), r * cos, r * sin * Math.sin(angle))
      matrix.makeTranslation(position.x, position.y, position.z)
      const isProton = Math.floor((i + 1) * model.protons / a) > Math.floor(i * model.protons / a)
      if (isProton) protons.setMatrixAt(p++, matrix)
      else neutrons?.setMatrixAt(n++, matrix)
    }
    protons.instanceMatrix.needsUpdate = true
    if (neutrons) neutrons.instanceMatrix.needsUpdate = true
    addLabel(nucleus, 'Պրոտոն · p⁺', new Vector3(-radius - .3, .2, radius), 'proton')
    if (neutrons) addLabel(nucleus, 'Նեյտրոն · n⁰', new Vector3(radius + .3, -.3, radius), 'neutron')

    for (const shell of model.shells) {
      const group = new Group(), rotor = new Group()
      const r = 1.65 + shell.number * .62
      group.rotation.set(.2 + shell.number * .24, shell.number * .35, .1 * shell.number)
      group.add(rotor)
      const points = Array.from({ length: 128 }, (_, i) => new Vector3(r * Math.cos(i * Math.PI / 64), r * Math.sin(i * Math.PI / 64), 0))
      group.add(new LineLoop(new BufferGeometry().setFromPoints(points), orbitMaterial))
      const electrons = new InstancedMesh(electronGeometry, electronMaterial, shell.count)
      for (let i = 0; i < shell.count; i++) {
        const angle = i * Math.PI * 2 / shell.count + shell.number * .3
        matrix.makeTranslation(r * Math.cos(angle), r * Math.sin(angle), 0)
        electrons.setMatrixAt(i, matrix)
      }
      electrons.instanceMatrix.needsUpdate = true
      rotor.add(electrons)
      if (shell.number === 1) addLabel(rotor, 'Էլեկտրոն · e⁻', new Vector3(r * Math.cos(.3), r * Math.sin(.3), 0), 'electron')
      shells.set(shell.number, { group, rotor })
      root.add(group)
    }
    shellRadius = 1.65 + (model.shells.at(-1)?.number || 1) * .62
    applyMode()
    resetView()
    syncLoop()
  }
  function applyMode() {
    for (const [n, { group }] of shells) group.visible = !cloudMode && (particleFocus === null || particleFocus === 'electron') && (selectedShell === null || selectedShell === n)
    nucleus.scale.setScalar(cloudMode ? .12 : 1)
    if (cloud) cloud.visible = cloudMode
    outerRadius = cloudMode ? 5 : shellRadius
  }
  function focusParticle(kind: 'proton' | 'neutron' | 'electron' | null) {
    particleFocus = kind
    for (const [name, material] of [['proton', protonMaterial], ['neutron', neutronMaterial], ['electron', electronMaterial]] as const) {
      material.transparent = kind !== null && kind !== name
      material.opacity = kind === null || kind === name ? 1 : .12
      material.depthWrite = !material.transparent
      material.needsUpdate = true
    }
    applyMode()
    resetView()
    if (kind === 'proton' || kind === 'neutron') {
      camera.position.set(.5, .7, 3.2)
      controls.update()
    }
    render()
  }
  function setView(mode: 'cloud' | 'shells') {
    cloudMode = mode === 'cloud'
    applyMode(); resetView(); syncLoop()
  }
  function setOrbitalCloud(data: OrbitalCloud) {
    if (disposed) return
    clearCloud()
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(data.positions, 3))
    geometry.setAttribute('phase', new Float32BufferAttribute(data.phases, 1))
    cloud = new Points(geometry, cloudMaterial)
    cloud.scale.setScalar(4.5 / data.radius95)
    root.add(cloud)
    applyMode(); render()
  }
  function resize() {
    if (disposed) return
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    labels.setSize(width, height)
    render()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  const intersection = new IntersectionObserver(entries => {
    inView = !!entries[0]?.isIntersecting
    syncLoop()
  })
  intersection.observe(host)
  controls.addEventListener('change', render)
  document.addEventListener('visibilitychange', syncLoop)
  function contextLost(event: Event) {
    event.preventDefault()
    motion = false
    cancelAnimationFrame(frame)
    onError()
  }
  canvas.addEventListener('webglcontextlost', contextLost)
  resize()
  return {
    setAtom, setView, setOrbitalCloud, focusParticle,
    clearCloud() { clearCloud(); render() },
    setCutaway(enabled: boolean) { cloudMaterial.uniforms.cutaway!.value = enabled; render() },
    setDensity(value: number) { cloudMaterial.uniforms.opacity!.value = Math.max(.1, Math.min(.9, value)); render() },
    setMotion(enabled: boolean) { motion = enabled; syncLoop() },
    setLabels(enabled: boolean) { labelsVisible = enabled; labelObjects.forEach(label => { label.visible = enabled }); render() },
    setShell(number: number | null) { selectedShell = number; applyMode(); render() },
    zoom(factor: number) {
      const direction = camera.position.clone().sub(controls.target)
      direction.setLength(Math.max(controls.minDistance, Math.min(controls.maxDistance, direction.length() * factor)))
      camera.position.copy(controls.target).add(direction)
      controls.update(); render()
    },
    rotate(horizontal: number, vertical: number) {
      const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.target))
      spherical.theta += horizontal
      spherical.phi = Math.max(.06, Math.min(Math.PI - .06, spherical.phi + vertical))
      camera.position.setFromSpherical(spherical).add(controls.target)
      controls.update(); render()
    },
    resetView,
    dispose() {
      if (disposed) return
      motion = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', syncLoop)
      canvas.removeEventListener('webglcontextlost', contextLost)
      controls.removeEventListener('change', render)
      controls.dispose()
      clearModel()
      disposed = true
      for (const resource of [nucleonGeometry, electronGeometry, protonMaterial, neutronMaterial, electronMaterial, orbitMaterial, cloudMaterial] as { dispose(): void }[]) resource.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      labels.domElement.remove()
    },
  }
}
