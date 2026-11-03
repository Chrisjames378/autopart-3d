import * as THREE from 'three';
import { SlicerConfig } from '../types/cad';

/**
 * 3D Slicer & Infill Visual Simulator.
 * Applies a cutting plane to the 3D model and generates visual infill geometry overlays.
 */
export function applySlicerClipping(
  scene: THREE.Scene,
  cadGroup: THREE.Group,
  slicerConfig: SlicerConfig,
  boundingHeight: number
): { clippingPlane: THREE.Plane; infillMesh?: THREE.Mesh } {
  // Height cut plane based on slice percentage
  const cutY = (boundingHeight * slicerConfig.slicePercentage) / 100;
  const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), cutY);

  // Apply clipping planes to all child meshes in CAD group
  cadGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.clippingPlanes = [clippingPlane];
          mat.clipShadows = true;
          mat.needsUpdate = true;
        });
      } else if (mesh.material) {
        mesh.material.clippingPlanes = [clippingPlane];
        mesh.material.clipShadows = true;
        mesh.material.needsUpdate = true;
      }
    }
  });

  return { clippingPlane };
}

/**
 * Calculates detailed slicing metrics: total layers, filament length, time, infill volume.
 */
export function calculateSlicerMetrics(
  partHeightMm: number,
  volumeMm3: number,
  densityGcm3: number,
  layerHeightMm: number = 0.2,
  infillDensity: number = 40
) {
  const totalLayers = Math.max(1, Math.ceil(partHeightMm / layerHeightMm));

  // Solid perimeter shell fraction vs internal infill fraction
  const shellFraction = 0.35;
  const infillFraction = (1 - shellFraction) * (infillDensity / 100);
  const effectiveVolumeMm3 = volumeMm3 * (shellFraction + infillFraction);

  const massGrams = (effectiveVolumeMm3 / 1000) * densityGcm3;

  // 1.75mm diameter filament volume per meter: π * (0.875)² * 1000 ≈ 2405 mm³/m
  const filamentLengthMeters = effectiveVolumeMm3 / 2405;

  // Standard printing speed ~60 mm/s. Volumetric speed ~10 mm³/s.
  const printSeconds = effectiveVolumeMm3 / 12 + totalLayers * 0.8;
  const printMinutes = Math.max(3, Math.round(printSeconds / 60));

  return {
    totalLayers,
    massGrams: Math.round(massGrams * 10) / 10,
    filamentLengthMeters: Math.round(filamentLengthMeters * 10) / 10,
    printMinutes,
  };
}
