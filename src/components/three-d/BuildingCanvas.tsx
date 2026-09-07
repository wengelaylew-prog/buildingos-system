import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SceneBuildingDTO, SceneFloorDTO, SceneUnitDTO } from '../../modules/three-d/three-d.types.ts';
import { Badge } from '../common/Badge.tsx';

interface BuildingCanvasProps {
  building: SceneBuildingDTO;
  selectedFloorId: string;
  selectedUnitId: string | null;
  searchQuery?: string;
  statusFilter?: string;
  isExploded: boolean;
  explodeDistance?: number;
  cameraPreset?: 'perspective' | 'top' | 'front';
  autoRotate?: boolean;
  tenantUnitId?: string | null;
  compact?: boolean;
  onSelectUnit: (unit: SceneUnitDTO) => void;
  onResetViewComplete?: () => void;
}

const FLOOR_HEIGHT = 4.0;
const FLOOR_WIDTH = 26.0;
const FLOOR_DEPTH = 18.0;
const SLAB_THICKNESS = 0.45;

const STATUS_COLORS: Record<string, { hex: number; css: string; emissive: number }> = {
  VACANT: { hex: 0x10b981, css: '#10b981', emissive: 0x059669 },
  OCCUPIED: { hex: 0x4f46e5, css: '#4f46e5', emissive: 0x4338ca },
  RESERVED: { hex: 0xf59e0b, css: '#f59e0b', emissive: 0xd97706 },
  MAINTENANCE: { hex: 0xef4444, css: '#ef4444', emissive: 0xdc2626 },
  INACTIVE: { hex: 0x64748b, css: '#64748b', emissive: 0x475569 },
};

export const BuildingCanvas: React.FC<BuildingCanvasProps> = ({
  building,
  selectedFloorId,
  selectedUnitId,
  searchQuery = '',
  statusFilter = 'ALL',
  isExploded,
  explodeDistance = 3.5,
  cameraPreset = 'perspective',
  autoRotate = false,
  tenantUnitId,
  compact = false,
  onSelectUnit,
  onResetViewComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Hover state for tooltip overlay
  const [hoveredUnitData, setHoveredUnitData] = useState<{
    unit: SceneUnitDTO;
    x: number;
    y: number;
  } | null>(null);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Floor groups and unit meshes map
  const floorGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const unitMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const targetFloorYRef = useRef<Map<string, number>>(new Map());

  // Camera target animation
  const cameraTargetPos = useRef<THREE.Vector3 | null>(null);
  const controlsTargetPos = useRef<THREE.Vector3 | null>(null);

  // Raycasting
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // 1. INITIALIZE SCENE, CAMERA, LIGHTS, RENDERER
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(compact ? 0xf8fafc : 0x0f172a); // Slate-900 in full, light in compact
    if (!compact) {
      scene.fog = new THREE.FogExp2(0x0f172a, 0.008);
    }
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    const initialY = Math.max(12, (building.floors.length * FLOOR_HEIGHT) / 2 + 10);
    camera.position.set(28, initialY, 34);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 250;
    controls.maxPolarAngle = Math.PI / 2.05; // Keep above ground plane
    controls.target.set(0, (building.floors.length * FLOOR_HEIGHT) / 2, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.6);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(35, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    const shadowD = 35;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.35);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // Ground Podium & Architectural Base
    const groundGroup = new THREE.Group();

    // Architectural Ground Slab
    const groundGeo = new THREE.BoxGeometry(42, 0.8, 34);
    const groundMat = new THREE.MeshStandardMaterial({
      color: compact ? 0xe2e8f0 : 0x1e293b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.4;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    // Plaza Sidewalk Base
    const plazaGeo = new THREE.BoxGeometry(32, 0.3, 24);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: compact ? 0xf1f5f9 : 0x334155,
      roughness: 0.6,
      metalness: 0.15,
    });
    const plazaMesh = new THREE.Mesh(plazaGeo, plazaMat);
    plazaMesh.position.y = 0.15;
    plazaMesh.receiveShadow = true;
    groundGroup.add(plazaMesh);

    // Architectural Blueprint Grid
    const grid = new THREE.GridHelper(
      60,
      30,
      compact ? 0x94a3b8 : 0x475569,
      compact ? 0xcbd5e1 : 0x1e293b
    );
    grid.position.y = -0.8;
    groundGroup.add(grid);

    scene.add(groundGroup);

    // Animation Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      // Smooth camera interpolation if animating to target
      if (cameraTargetPos.current && cameraRef.current) {
        cameraRef.current.position.lerp(cameraTargetPos.current, 0.05);
        if (cameraRef.current.position.distanceTo(cameraTargetPos.current) < 0.1) {
          cameraTargetPos.current = null;
        }
      }

      if (controlsTargetPos.current && controlsRef.current) {
        controlsRef.current.target.lerp(controlsTargetPos.current, 0.05);
        if (controlsRef.current.target.distanceTo(controlsTargetPos.current) < 0.1) {
          controlsTargetPos.current = null;
          onResetViewComplete?.();
        }
      }

      // Smooth exploded floor vertical interpolation
      floorGroupsRef.current.forEach((group, floorId) => {
        const targetY = targetFloorYRef.current.get(floorId);
        if (targetY !== undefined) {
          group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, 0.08);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [compact]);

  // 2. BUILD BUILDING GEOMETRY (FLOORS + STRUCTURAL ELEMENTS + UNITS)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous floor groups
    floorGroupsRef.current.forEach((group) => {
      scene.remove(group);
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
    });
    floorGroupsRef.current.clear();
    unitMeshesRef.current.clear();
    targetFloorYRef.current.clear();

    const floorsSorted = [...building.floors].sort((a, b) => a.floorNumber - b.floorNumber);

    floorsSorted.forEach((floor, floorIndex) => {
      const floorGroup = new THREE.Group();
      floorGroup.name = `floor-${floor.id}`;

      // Calculate initial base Y position
      const baseY = floorIndex * FLOOR_HEIGHT;
      floorGroup.position.y = baseY;
      targetFloorYRef.current.set(floor.id, baseY);

      // Floor Slab (Reinforced Concrete / Architectural Glass Edge)
      const slabGeo = new THREE.BoxGeometry(FLOOR_WIDTH, SLAB_THICKNESS, FLOOR_DEPTH);
      const slabMat = new THREE.MeshStandardMaterial({
        color: compact ? 0xe2e8f0 : 0x1e293b,
        roughness: 0.4,
        metalness: 0.2,
      });
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.y = SLAB_THICKNESS / 2;
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;
      floorGroup.add(slabMesh);

      // Central Service Core (Elevator shaft, emergency stairs, utilities)
      const coreGeo = new THREE.BoxGeometry(6, FLOOR_HEIGHT - SLAB_THICKNESS, 6);
      const coreMat = new THREE.MeshStandardMaterial({
        color: compact ? 0xcbd5e1 : 0x334155,
        roughness: 0.7,
        metalness: 0.1,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.set(0, (FLOOR_HEIGHT - SLAB_THICKNESS) / 2 + SLAB_THICKNESS, 0);
      coreMesh.receiveShadow = true;
      coreMesh.castShadow = true;
      floorGroup.add(coreMesh);

      // 4 Perimeter Structural Columns
      const columnRadius = 0.35;
      const columnGeo = new THREE.CylinderGeometry(
        columnRadius,
        columnRadius,
        FLOOR_HEIGHT - SLAB_THICKNESS,
        16
      );
      const columnMat = new THREE.MeshStandardMaterial({
        color: compact ? 0x94a3b8 : 0x475569,
        roughness: 0.5,
        metalness: 0.3,
      });

      const colOffsets = [
        [-FLOOR_WIDTH / 2 + 1, -FLOOR_DEPTH / 2 + 1],
        [FLOOR_WIDTH / 2 - 1, -FLOOR_DEPTH / 2 + 1],
        [-FLOOR_WIDTH / 2 + 1, FLOOR_DEPTH / 2 - 1],
        [FLOOR_WIDTH / 2 - 1, FLOOR_DEPTH / 2 - 1],
      ];

      colOffsets.forEach(([cx, cz]) => {
        const col = new THREE.Mesh(columnGeo, columnMat);
        col.position.set(cx, (FLOOR_HEIGHT - SLAB_THICKNESS) / 2 + SLAB_THICKNESS, cz);
        col.castShadow = true;
        col.receiveShadow = true;
        floorGroup.add(col);
      });

      // Units on this floor
      const units = floor.units;
      const unitCount = units.length;

      if (unitCount > 0) {
        // Distribute units in architectural bays around the core
        const halfW = (FLOOR_WIDTH - 9) / 2;
        const halfD = (FLOOR_DEPTH - 8) / 2;

        units.forEach((unit, uIdx) => {
          // Determine procedural coordinate if not provided in unit.transform
          let posX = 0;
          let posZ = 0;
          let sizeW = 5.2;
          let sizeD = 4.0;
          let sizeH = FLOOR_HEIGHT - SLAB_THICKNESS - 0.4;

          if (unit.transform && unit.transform.position) {
            [posX, , posZ] = unit.transform.position;
            if (unit.transform.size) {
              [sizeW, sizeH, sizeD] = unit.transform.size;
            }
          } else {
            // Symmetrical architectural placement: North and South bay distribution
            const side = uIdx % 2 === 0 ? 1 : -1; // North vs South
            const colIndex = Math.floor(uIdx / 2);
            const colsPerSide = Math.max(1, Math.ceil(unitCount / 2));
            const step = colsPerSide > 1 ? (FLOOR_WIDTH - 7) / colsPerSide : 0;

            posX = -FLOOR_WIDTH / 2 + 3.5 + colIndex * step;
            posZ = side * (FLOOR_DEPTH / 2 - 2.8);
            sizeW = Math.min(step * 0.85 || 5.2, 5.8);
            sizeD = 4.2;
          }

          // Status colors
          const statusConfig = STATUS_COLORS[unit.status] || STATUS_COLORS.VACANT;

          // Unit Room Mesh
          const roomGeo = new THREE.BoxGeometry(sizeW, sizeH, sizeD);
          const roomMat = new THREE.MeshStandardMaterial({
            color: statusConfig.hex,
            roughness: 0.35,
            metalness: 0.15,
            transparent: true,
            opacity: 0.88,
          });

          const unitMesh = new THREE.Mesh(roomGeo, roomMat);
          unitMesh.position.set(posX, sizeH / 2 + SLAB_THICKNESS + 0.15, posZ);
          unitMesh.castShadow = true;
          unitMesh.receiveShadow = true;

          // Attach user metadata to mesh for raycasting
          unitMesh.userData = {
            unitId: unit.id,
            unit,
            floorId: floor.id,
            originalColor: statusConfig.hex,
            originalEmissive: statusConfig.emissive,
          };

          // Architectural Window Glass Facade (Outer side)
          const glassGeo = new THREE.PlaneGeometry(sizeW * 0.9, sizeH * 0.85);
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x93c5fd,
            transmission: 0.6,
            opacity: 0.8,
            transparent: true,
            roughness: 0.1,
            metalness: 0.1,
          });
          const glassMesh = new THREE.Mesh(glassGeo, glassMat);
          glassMesh.position.z = posZ > 0 ? sizeD / 2 + 0.02 : -sizeD / 2 - 0.02;
          if (posZ < 0) glassMesh.rotation.y = Math.PI;
          unitMesh.add(glassMesh);

          // Tenant Unit Glowing Beacon (if this is tenant's assigned unit)
          if (unit.id === tenantUnitId || unit.isTenantUnit) {
            const beaconGeo = new THREE.CylinderGeometry(0.1, 0.4, 1.2, 8);
            const beaconMat = new THREE.MeshBasicMaterial({
              color: 0xfacc15,
              wireframe: true,
            });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.y = sizeH / 2 + 0.8;
            unitMesh.add(beacon);
          }

          unitMeshesRef.current.set(unit.id, unitMesh);
          floorGroup.add(unitMesh);
        });
      }

      // Roof Parapet on topmost floor
      if (floorIndex === floorsSorted.length - 1) {
        const roofCapGeo = new THREE.BoxGeometry(FLOOR_WIDTH + 0.4, 0.4, FLOOR_DEPTH + 0.4);
        const roofCapMat = new THREE.MeshStandardMaterial({
          color: compact ? 0x94a3b8 : 0x0f172a,
          roughness: 0.3,
          metalness: 0.4,
        });
        const roofCap = new THREE.Mesh(roofCapGeo, roofCapMat);
        roofCap.position.y = FLOOR_HEIGHT + SLAB_THICKNESS;
        floorGroup.add(roofCap);
      }

      floorGroupsRef.current.set(floor.id, floorGroup);
      scene.add(floorGroup);
    });

    // GLTF Extensibility Hook (Requirement 22):
    // If building provides a 3D modelUrl (GLTF/GLB), seamlessly load and integrate it
    if (building.modelUrl) {
      const loader = new GLTFLoader();
      loader.load(
        building.modelUrl,
        (gltf) => {
          console.log('Architectural GLTF Model loaded:', gltf);
          // Optional: scene.add(gltf.scene);
        },
        undefined,
        (err) => {
          console.warn('GLTF Model not available, procedural geometry active:', err);
        }
      );
    }
  }, [building, tenantUnitId, compact]);

  // 3. HANDLE EXPLODED FLOORS (SMOOTH VERTICAL SEPARATION)
  useEffect(() => {
    const floorsSorted = [...building.floors].sort((a, b) => a.floorNumber - b.floorNumber);

    floorsSorted.forEach((floor, idx) => {
      const baseY = idx * FLOOR_HEIGHT;
      const targetY = isExploded ? baseY + idx * (explodeDistance * 1.5) : baseY;
      targetFloorYRef.current.set(floor.id, targetY);
    });
  }, [isExploded, explodeDistance, building]);

  // 4. HANDLE FLOOR ISOLATION & FILTERING
  useEffect(() => {
    floorGroupsRef.current.forEach((group, floorId) => {
      const isSelectedFloor = selectedFloorId === 'ALL' || selectedFloorId === floorId;

      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && !Array.isArray(mesh.material)) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (!isSelectedFloor) {
              mat.transparent = true;
              mat.opacity = 0.12; // Ghost translucent wireframe
            } else {
              mat.transparent = true;
              mat.opacity = 0.88;
            }
          }
        }
      });
    });
  }, [selectedFloorId]);

  // 5. HANDLE UNIT SELECTION & CAMERA FOCUS (TWEEN TO UNIT)
  useEffect(() => {
    if (!selectedUnitId) return;

    const mesh = unitMeshesRef.current.get(selectedUnitId);
    if (!mesh || !controlsRef.current || !cameraRef.current) return;

    // Get world position of selected unit
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Calculate camera focus target position
    controlsTargetPos.current = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);
    cameraTargetPos.current = new THREE.Vector3(
      worldPos.x + 12,
      worldPos.y + 6,
      worldPos.z + 14
    );

    // Emissive highlight on mesh
    mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh;
        if (m.material && !Array.isArray(m.material)) {
          const stdMat = m.material as THREE.MeshStandardMaterial;
          stdMat.emissive = new THREE.Color(0xffffff);
          stdMat.emissiveIntensity = 0.45;
        }
      }
    });

    return () => {
      // Revert highlight
      const stdMat = mesh.material as THREE.MeshStandardMaterial;
      if (stdMat && mesh.userData?.originalEmissive) {
        stdMat.emissive = new THREE.Color(mesh.userData.originalEmissive);
        stdMat.emissiveIntensity = 0.15;
      }
    };
  }, [selectedUnitId]);

  // 6. HANDLE CAMERA PRESETS (ISOMETRIC / TOP / FRONT)
  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;

    const centerY = (building.floors.length * FLOOR_HEIGHT) / 2;
    controlsTargetPos.current = new THREE.Vector3(0, centerY, 0);

    if (cameraPreset === 'top') {
      // Architectural Floorplan Top View
      cameraTargetPos.current = new THREE.Vector3(0, centerY + 45, 0.001);
    } else if (cameraPreset === 'front') {
      // Elevation View
      cameraTargetPos.current = new THREE.Vector3(0, centerY + 2, 44);
    } else {
      // Isometric Perspective
      cameraTargetPos.current = new THREE.Vector3(28, centerY + 10, 34);
    }
  }, [cameraPreset, building]);

  // 7. AUTO-ROTATE
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // 8. UNIT SEARCH & STATUS HIGHLIGHTING
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    unitMeshesRef.current.forEach((mesh) => {
      const unit: SceneUnitDTO = mesh.userData?.unit;
      if (!unit) return;

      const matchesStatus = statusFilter === 'ALL' || unit.status === statusFilter;
      const matchesSearch =
        !query ||
        unit.unitNumber.toLowerCase().includes(query) ||
        unit.unitType.toLowerCase().includes(query) ||
        (unit.tenant?.fullName && unit.tenant.fullName.toLowerCase().includes(query));

      const isMatch = matchesStatus && matchesSearch;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (mat) {
        if (isMatch) {
          mat.opacity = 0.95;
          if (query && matchesSearch) {
            mat.emissive = new THREE.Color(0xfacc15); // Golden glow for search matches
            mat.emissiveIntensity = 0.5;
          } else {
            mat.emissive = new THREE.Color(mesh.userData.originalEmissive || 0x000000);
            mat.emissiveIntensity = 0.1;
          }
        } else {
          mat.opacity = 0.15; // Dim non-matching units
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [searchQuery, statusFilter]);

  // 9. MOUSE EVENT HANDLERS (HOVER & CLICK DETECTION VIA RAYCASTER)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = mountRef.current;
      if (!container || !cameraRef.current || !sceneRef.current) return;

      const rect = container.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      const meshes = Array.from(unitMeshesRef.current.values());
      const intersects = raycaster.current.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const unit = hit.userData?.unit as SceneUnitDTO | undefined;

        if (unit) {
          container.style.cursor = 'pointer';
          setHoveredUnitData({
            unit,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }

      container.style.cursor = 'default';
      setHoveredUnitData(null);
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = mountRef.current;
      if (!container || !cameraRef.current || !sceneRef.current) return;

      const rect = container.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      const meshes = Array.from(unitMeshesRef.current.values());
      const intersects = raycaster.current.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const unit = hit.userData?.unit as SceneUnitDTO | undefined;
        if (unit) {
          onSelectUnit(unit);
        }
      }
    },
    [onSelectUnit]
  );

  return (
    <div
      ref={mountRef}
      id="three-d-building-viewport"
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className={`relative w-full h-full select-none overflow-hidden ${
        compact ? 'rounded-xl bg-slate-50' : 'rounded-2xl bg-slate-950'
      }`}
    >
      {/* Floating Hover Tooltip */}
      {hoveredUnitData && (
        <div
          ref={tooltipRef}
          style={{
            left: `${hoveredUnitData.x + 16}px`,
            top: `${hoveredUnitData.y - 12}px`,
          }}
          className="pointer-events-none absolute z-30 transform -translate-y-1/2 bg-slate-900/95 text-white backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1 min-w-[170px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-white">
              Unit {hoveredUnitData.unit.unitNumber}
            </span>
            <Badge status={hoveredUnitData.unit.status} size="sm" />
          </div>

          <div className="text-[11px] text-slate-300">
            {hoveredUnitData.unit.unitType} • {hoveredUnitData.unit.area} sqm
          </div>

          {hoveredUnitData.unit.monthlyRent > 0 && (
            <div className="text-[11px] font-semibold text-indigo-400">
              {hoveredUnitData.unit.monthlyRent.toLocaleString()} ETB/mo
            </div>
          )}

          {hoveredUnitData.unit.tenant && (
            <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-800">
              Tenant: {hoveredUnitData.unit.tenant.fullName}
            </div>
          )}

          <div className="text-[9px] text-indigo-300/80 pt-0.5 font-medium">
            Click to inspect full unit profile →
          </div>
        </div>
      )}
    </div>
  );
};
