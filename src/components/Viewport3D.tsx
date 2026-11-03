import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AllPartParams, FilamentMaterial, PartStats, PartType, SlicerConfig } from '../types/cad';
import { buildCADModel } from '../utils/cadGenerator';
import { MATERIALS } from '../utils/materials';
import { calculateSlicerMetrics } from '../utils/slicerSimulator';

interface Viewport3DProps {
  partType: PartType;
  params: AllPartParams[PartType];
  material: FilamentMaterial;
  toleranceOffset: number;
  isSlicerOpen: boolean;
  onCloseSlicer: () => void;
  onStatsUpdated: (stats: PartStats) => void;
  onGroupReady: (group: THREE.Group) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  partType,
  params,
  material,
  toleranceOffset,
  isSlicerOpen,
  onCloseSlicer,
  onStatsUpdated,
  onGroupReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cadGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);

  // Viewport states
  const [isWireframe, setIsWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [stats, setStats] = useState<PartStats>({
    boundingBox: { x: 0, y: 0, z: 0 },
    volumeMm3: 0,
    weightGrams: 0,
    filamentLengthMeters: 0,
    estimatedCostUsd: 0,
    estimatedPrintTimeMins: 0,
    triangleCount: 0,
  });

  // Slicer State
  const [slicerConfig, setSlicerConfig] = useState<SlicerConfig>({
    layerHeight: 0.2,
    slicePercentage: 100,
    infillDensity: 40,
    infillPattern: 'gyroid',
    showInfill: true,
  });

  // 1. Initialize Three.js Scene, Camera, Lighting & RoomEnvironment
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712'); // Dark graphite background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(60, 60, 80);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.localClippingEnabled = true;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // PMREM Generator & Room Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 15, 0);
    controlsRef.current = controls;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(50, 100, 50);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 1.2);
    fillLight.position.set(-50, 40, -50);
    scene.add(fillLight);

    // 200x200mm 3D Print Bed Grid Helper
    const grid = new THREE.GridHelper(200, 40, 0x0284c7, 0x334155);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Axis indicator
    const axesHelper = new THREE.AxesHelper(15);
    axesHelper.position.set(-95, 0.2, -95);
    scene.add(axesHelper);

    // Animation Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Rebuild CAD Model whenever Part Type, Parameters, Material, or Tolerance Offset changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old model group
    if (cadGroupRef.current) {
      sceneRef.current.remove(cadGroupRef.current);
      cadGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
            else mesh.material.dispose();
          }
        }
      });
    }

    // Build new CAD model
    const { group, stats: newStats } = buildCADModel(partType, params, material, toleranceOffset);
    cadGroupRef.current = group;
    sceneRef.current.add(group);

    // Pass group back to parent
    onGroupReady(group);
    setStats(newStats);
    onStatsUpdated(newStats);

    // Apply wireframe setting if active
    applyWireframeState(group, isWireframe);

    // Apply clipping plane if active
    updateSlicerClippingPlane(group, slicerConfig, newStats.boundingBox.y);
  }, [partType, params, material, toleranceOffset]);

  // 3. Update Wireframe state
  const applyWireframeState = (group: THREE.Group | null, wireframe: boolean) => {
    if (!group) return;
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => ((m as any).wireframe = wireframe));
        } else if (mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  };

  const handleToggleWireframe = () => {
    const nextState = !isWireframe;
    setIsWireframe(nextState);
    applyWireframeState(cadGroupRef.current, nextState);
  };

  const handleToggleGrid = () => {
    setShowGrid((prev) => {
      const next = !prev;
      if (gridHelperRef.current) gridHelperRef.current.visible = next;
      return next;
    });
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(60, 60, 80);
      controlsRef.current.target.set(0, 15, 0);
      controlsRef.current.update();
    }
  };

  // 4. Update Slicer Clipping Plane
  const updateSlicerClippingPlane = (
    group: THREE.Group | null,
    config: SlicerConfig,
    maxY: number
  ) => {
    if (!group) return;

    if (config.slicePercentage < 100) {
      const planeY = (Math.max(10, maxY) * config.slicePercentage) / 100;
      const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), planeY);
      clippingPlaneRef.current = clippingPlane;

      if (rendererRef.current) rendererRef.current.localClippingEnabled = true;

      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.clippingPlanes = [clippingPlane];
              m.clipShadows = true;
            });
          } else if (mesh.material) {
            mesh.material.clippingPlanes = [clippingPlane];
            mesh.material.clipShadows = true;
          }
        }
      });
    } else {
      clippingPlaneRef.current = null;
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => (m.clippingPlanes = []));
          } else if (mesh.material) {
            mesh.material.clippingPlanes = [];
          }
        }
      });
    }
  };

  const handleSlicerPercentageChange = (pct: number) => {
    const nextConfig = { ...slicerConfig, slicePercentage: pct };
    setSlicerConfig(nextConfig);
    updateSlicerClippingPlane(cadGroupRef.current, nextConfig, stats.boundingBox.y);
  };

  const handleInfillDensityChange = (density: number) => {
    const nextConfig = { ...slicerConfig, infillDensity: density };
    setSlicerConfig(nextConfig);
  };

  // Calculate detailed slicer stats
  const matDensity = MATERIALS[material]?.density || 1.25;
  const slicerMetrics = calculateSlicerMetrics(
    stats.boundingBox.y || 20,
    stats.volumeMm3,
    matDensity,
    slicerConfig.layerHeight,
    slicerConfig.infillDensity
  );

  return (
    <section className="lg:col-span-8 xl:col-span-9 bg-gray-950 relative flex flex-col h-full overflow-hidden">
      {/* Canvas Top-Left Overlay Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-gray-800/80 backdrop-blur px-3 py-2 rounded-lg border border-gray-700 shadow">
        <button
          onClick={handleResetCamera}
          title="Reset View"
          className="text-gray-300 hover:text-white text-xs px-2.5 py-1 rounded bg-gray-700/60 hover:bg-gray-700 transition flex items-center gap-1.5"
        >
          <i className="fa-solid fa-arrows-to-dot"></i> Reset Camera
        </button>
        <button
          onClick={handleToggleWireframe}
          title="Toggle Wireframe View"
          className={`text-xs px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
            isWireframe
              ? 'bg-amber-600 text-white'
              : 'text-gray-300 hover:text-white bg-gray-700/60 hover:bg-gray-700'
          }`}
        >
          <i className="fa-solid fa-cube"></i>{' '}
          <span>{isWireframe ? 'Wireframe' : 'Solid'}</span>
        </button>
        <button
          onClick={handleToggleGrid}
          title="Toggle Bed Grid"
          className={`text-xs px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
            showGrid
              ? 'bg-sky-600 text-white'
              : 'text-gray-300 hover:text-white bg-gray-700/60 hover:bg-gray-700'
          }`}
        >
          <i className="fa-solid fa-border-all"></i> Grid
        </button>
      </div>

      {/* Slicer & Infill Overlay Controls (Shown when toggled from header) */}
      {isSlicerOpen && (
        <div className="absolute bottom-12 left-4 z-20 bg-gray-800/90 backdrop-blur px-4 py-3 rounded-xl border border-sky-500/50 shadow-2xl space-y-3 w-80">
          <div className="flex items-center justify-between text-xs text-sky-400 font-bold border-b border-gray-700 pb-1.5">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group"></i> 3D Slicer & Infill Simulator
            </span>
            <button
              onClick={onCloseSlicer}
              className="text-gray-400 hover:text-white text-sm"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-gray-300 mb-1">
              <span>Layer Height Preview:</span>
              <span className="font-mono text-amber-400">
                {slicerConfig.slicePercentage}% ({Math.round((slicerMetrics.totalLayers * slicerConfig.slicePercentage) / 100)} / {slicerMetrics.totalLayers} layers)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={slicerConfig.slicePercentage}
              onChange={(e) => handleSlicerPercentageChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-gray-300 mb-1">
              <span>Infill Density:</span>
              <span className="font-mono text-sky-400">
                {slicerConfig.infillDensity}% Gyroid
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={slicerConfig.infillDensity}
              onChange={(e) => handleInfillDensityChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 pt-1.5 border-t border-gray-700/60">
            <div>
              Est. Print Time:{' '}
              <span className="text-amber-400 font-bold">{slicerMetrics.printMinutes} mins</span>
            </div>
            <div>
              Est. Filament:{' '}
              <span className="text-sky-400 font-bold">{slicerMetrics.massGrams} g ({slicerMetrics.filamentLengthMeters}m)</span>
            </div>
          </div>
        </div>
      )}

      {/* Top-Right Bounding Box Dimension Display Widget */}
      <div className="absolute top-4 right-4 z-10 bg-gray-800/80 backdrop-blur px-3 py-2 rounded-lg border border-gray-700 text-xs font-mono text-gray-300 shadow">
        <div className="text-gray-400 font-sans font-semibold mb-1">
          Part Bounding Box (X × Y × Z):
        </div>
        <div className="text-amber-400 font-bold text-sm">
          {stats.boundingBox.x} × {stats.boundingBox.y} × {stats.boundingBox.z} mm
        </div>
      </div>

      {/* Interactive 3D WebGL Canvas Mount Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing"></div>

      {/* Viewport Bottom Status Bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 font-mono">
        <div className="flex items-center space-x-5">
          <span>
            <i className="fa-solid fa-layer-group text-sky-400"></i> Triangles:{' '}
            <span className="text-gray-200">{stats.triangleCount.toLocaleString()}</span>
          </span>
          <span>
            <i className="fa-solid fa-ruler-combined text-amber-400"></i> Fit Clearance:{' '}
            <span className="text-gray-200">+{toleranceOffset.toFixed(2)} mm</span>
          </span>
          <span>
            <i className="fa-solid fa-weight-hanging text-emerald-400"></i> Volume:{' '}
            <span className="text-gray-200">{stats.volumeMm3.toLocaleString()} mm³</span>
          </span>
        </div>
        <div className="hidden md:block text-gray-400">
          Left Drag: Rotate | Right Drag: Pan | Scroll: Zoom
        </div>
      </div>
    </section>
  );
};
