import {
  AmbientLight,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  FogExp2,
  InstancedMesh,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

/**
 * Procedural "roasted coffee beans in the air" scene.
 *
 * Framework-free so it can be loaded on demand with a dynamic import and kept
 * out of every other bundle. Beans are generated from a deformed sphere (no
 * model download) and drawn with one InstancedMesh (a single draw call).
 */

export interface CoffeeBeansSceneOptions {
  /** Number of beans; the caller lowers it on small or low-power devices. */
  beanCount: number;
  /** Upper bound for the renderer pixel ratio. */
  maxPixelRatio: number;
}

export interface CoffeeBeansScene {
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  /** Pointer position normalised to -1..1 on both axes. */
  setPointer(x: number, y: number): void;
  /** Section scroll progress, 0 (entering the viewport) .. 1 (leaving it). */
  setScrollProgress(progress: number): void;
  dispose(): void;
}

interface BeanState {
  position: Vector3;
  rotation: Euler;
  spin: Vector3;
  scale: number;
  phase: number;
  drift: number;
}

const ROAST_COLORS = ['#2e1a10', '#3b2214', '#4a2b18', '#5a341c', '#6b3f22'];
const VOLUME = { x: 9, y: 6, z: 6 };
const BASE_CAMERA_DISTANCE = 11;
const BASE_FOG_DENSITY = 0.06;

/** Ellipsoid with a flat face and the characteristic S-shaped centre crease. */
const createBeanGeometry = (): SphereGeometry => {
  const geometry = new SphereGeometry(1, 40, 28);
  const position = geometry.attributes.position;
  const vertex = new Vector3();

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    vertex.x *= 0.62;
    vertex.y *= 0.9;
    vertex.z *= 0.5;

    if (vertex.z > 0) {
      // Flatten the front face, then carve the crease along it.
      vertex.z *= 0.55;
      const creaseCentre = 0.08 * Math.sin(vertex.y * 3.2);
      const distance = vertex.x - creaseCentre;
      const crease = Math.exp(-(distance * distance) / 0.0045);
      vertex.z -= crease * 0.13 * Math.min(1, vertex.z * 6);
    }

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
};

export const createCoffeeBeansScene = (
  canvas: HTMLCanvasElement,
  { beanCount, maxPixelRatio }: CoffeeBeansSceneOptions,
): CoffeeBeansScene => {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const fog = new FogExp2(0x120a06, BASE_FOG_DENSITY);
  scene.fog = fog;

  const camera = new PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0, BASE_CAMERA_DISTANCE);

  // Warm key light, amber rim light from behind, and a soft light that follows the pointer.
  scene.add(new AmbientLight(0xffe2c4, 0.75));
  const keyLight = new DirectionalLight(0xffd6a3, 2.8);
  keyLight.position.set(4, 6, 8);
  scene.add(keyLight);
  const rimLight = new DirectionalLight(0xff8a2a, 2.6);
  rimLight.position.set(-6, -2, -6);
  scene.add(rimLight);
  const pointerLight = new PointLight(0xffb067, 18, 14, 2);
  pointerLight.position.set(0, 0, 5);
  scene.add(pointerLight);

  const geometry = createBeanGeometry();
  const material = new MeshStandardMaterial({ roughness: 0.42, metalness: 0.08 });
  const beans = new InstancedMesh(geometry, material, beanCount);
  beans.instanceMatrix.setUsage(DynamicDrawUsage);
  scene.add(beans);

  const color = new Color();
  const states: BeanState[] = Array.from({ length: beanCount }, (_, index) => {
    beans.setColorAt(index, color.set(ROAST_COLORS[index % ROAST_COLORS.length]));
    return {
      position: new Vector3(
        MathUtils.randFloatSpread(VOLUME.x * 2),
        MathUtils.randFloatSpread(VOLUME.y * 2),
        MathUtils.randFloat(-VOLUME.z, VOLUME.z * 0.4),
      ),
      rotation: new Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      spin: new Vector3(MathUtils.randFloatSpread(0.6), MathUtils.randFloatSpread(0.6), MathUtils.randFloatSpread(0.6)),
      scale: MathUtils.randFloat(0.22, 0.42),
      phase: Math.random() * Math.PI * 2,
      drift: MathUtils.randFloat(0.12, 0.32),
    };
  });
  if (beans.instanceColor) beans.instanceColor.needsUpdate = true;

  // Reused every frame to avoid garbage-collection pauses.
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const translation = new Vector3();
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollProgress = 0.5;
  let frameId = 0;
  let running = false;
  let lastTime = 0;

  const updateBeans = (delta: number, seconds: number) => {
    for (let i = 0; i < states.length; i += 1) {
      const bean = states[i];
      bean.position.y += bean.drift * delta;
      if (bean.position.y > VOLUME.y) {
        bean.position.y = -VOLUME.y;
        bean.position.x = MathUtils.randFloatSpread(VOLUME.x * 2);
      }
      bean.rotation.x += bean.spin.x * delta;
      bean.rotation.y += bean.spin.y * delta;
      bean.rotation.z += bean.spin.z * delta;

      const sway = Math.sin(seconds * 0.6 + bean.phase) * 0.25;
      quaternion.setFromEuler(bean.rotation);
      scale.setScalar(bean.scale);
      translation.set(bean.position.x + sway, bean.position.y, bean.position.z);
      matrix.compose(translation, quaternion, scale);
      beans.setMatrixAt(i, matrix);
    }
    beans.instanceMatrix.needsUpdate = true;
  };

  const updateCamera = () => {
    // Ease the pointer so the parallax feels weighty rather than jittery.
    pointer.x += (pointer.targetX - pointer.x) * 0.05;
    pointer.y += (pointer.targetY - pointer.y) * 0.05;
    camera.position.x = pointer.x * 1.2;
    camera.position.y = -pointer.y * 0.8 + (scrollProgress - 0.5) * 1.6;
    camera.lookAt(0, 0, 0);
    beans.rotation.z = (scrollProgress - 0.5) * 0.35;
    pointerLight.position.set(pointer.x * 6, -pointer.y * 4, 5);
  };

  const renderFrame = (time: number) => {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    updateBeans(delta, time / 1000);
    updateCamera();
    renderer.render(scene, camera);
    if (running) frameId = requestAnimationFrame(renderFrame);
  };

  // Place every bean once so a paused scene still shows a complete frame.
  updateBeans(0, 0);

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      frameId = requestAnimationFrame(renderFrame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
    },
    resize(width, height) {
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Pull the camera back on portrait screens so the bean field still fills the width.
      camera.position.z = camera.aspect < 1
        ? BASE_CAMERA_DISTANCE / Math.max(camera.aspect, 0.55)
        : BASE_CAMERA_DISTANCE;
      // Fog scales with camera distance so beans stay equally visible on every screen.
      fog.density = BASE_FOG_DENSITY * (BASE_CAMERA_DISTANCE / camera.position.z);
      camera.updateProjectionMatrix();
      if (!running) {
        updateCamera();
        renderer.render(scene, camera);
      }
    },
    setPointer(x, y) {
      pointer.targetX = MathUtils.clamp(x, -1, 1);
      pointer.targetY = MathUtils.clamp(y, -1, 1);
    },
    setScrollProgress(progress) {
      scrollProgress = MathUtils.clamp(progress, 0, 1);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      beans.dispose();
      renderer.dispose();
    },
  };
};
