import * as THREE from 'three';
import { AllPartParams, FilamentMaterial, PartStats, PartType } from '../types/cad';
import { MATERIALS } from './materials';

/**
 * Main Parametric 3D CAD Geometry Engine.
 * Creates procedural THREE.Group models for automotive replacement parts.
 */
export function buildCADModel(
  partType: PartType,
  params: AllPartParams[PartType],
  materialId: FilamentMaterial,
  toleranceOffset: number = 0.15
): { group: THREE.Group; stats: PartStats } {
  const group = new THREE.Group();
  group.name = 'AutoPartModel';

  const matInfo = MATERIALS[materialId] || MATERIALS.petg;
  const baseColor = new THREE.Color(matInfo.color);

  // Main PBR Material for primary body
  const primaryMaterial = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: matInfo.roughness,
    metalness: matInfo.metalness,
    envMapIntensity: 1.2,
  });

  // Secondary Accent Material for threads, barbs, ridges, and indicators
  const accentColor = new THREE.Color(baseColor).lerp(new THREE.Color('#ffffff'), 0.2);
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: Math.max(0.1, matInfo.roughness - 0.1),
    metalness: Math.min(0.9, matInfo.metalness + 0.15),
    envMapIntensity: 1.5,
  });

  let totalVolumeMm3 = 0;

  switch (partType) {
    case 'bolt':
      totalVolumeMm3 = buildBoltModel(group, params as AllPartParams['bolt'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'hoseBarb':
      totalVolumeMm3 = buildHoseBarbModel(group, params as AllPartParams['hoseBarb'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'gasket':
      totalVolumeMm3 = buildGasketModel(group, params as AllPartParams['gasket'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'knob':
      totalVolumeMm3 = buildKnobModel(group, params as AllPartParams['knob'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'bracket':
      totalVolumeMm3 = buildBracketModel(group, params as AllPartParams['bracket'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'bushing':
      totalVolumeMm3 = buildBushingModel(group, params as AllPartParams['bushing'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'oring':
      totalVolumeMm3 = buildOringModel(group, params as AllPartParams['oring'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
    case 'connector':
      totalVolumeMm3 = buildConnectorModel(group, params as AllPartParams['connector'], primaryMaterial, accentMaterial, toleranceOffset);
      break;
  }

  // Calculate bounding box and stats
  group.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  bbox.getSize(size);

  let triangleCount = 0;
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) {
        const index = mesh.geometry.getIndex();
        if (index) {
          triangleCount += index.count / 3;
        } else {
          const pos = mesh.geometry.getAttribute('position');
          if (pos) triangleCount += pos.count / 3;
        }
      }
    }
  });

  const weightGrams = (totalVolumeMm3 / 1000) * matInfo.density * 0.55; // 55% effective density accounting for shell + infill
  // 1.75mm diameter filament volume: ~2405 mm³/m
  const filamentLengthMeters = (totalVolumeMm3 * 0.55) / 2405;
  const estimatedCostUsd = (weightGrams / 1000) * matInfo.costPerKg;
  // Estimated print time (minutes): ~0.6 mins per gram + 5 mins setup/warmup
  const estimatedPrintTimeMins = Math.max(3, Math.round(5 + weightGrams * 1.6));

  const stats: PartStats = {
    boundingBox: {
      x: Math.round(size.x * 100) / 100,
      y: Math.round(size.y * 100) / 100,
      z: Math.round(size.z * 100) / 100,
    },
    volumeMm3: Math.round(totalVolumeMm3),
    weightGrams: Math.round(weightGrams * 10) / 10,
    filamentLengthMeters: Math.round(filamentLengthMeters * 10) / 10,
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
    estimatedPrintTimeMins,
    triangleCount: Math.round(triangleCount),
  };

  return { group, stats };
}

/* ========================================================================= */
/* 1. BOLT MODEL GENERATOR                                                   */
/* ========================================================================= */
function buildBoltModel(
  group: THREE.Group,
  params: AllPartParams['bolt'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const shaftRadius = Math.max(1, (params.diameter - tolerance) / 2);
  const shaftLen = Math.max(5, params.shaftLength);
  const headH = Math.max(2, params.headHeight);
  const headW = Math.max(params.diameter + 2, params.headWidth);
  const pitch = Math.max(0.4, params.pitch);

  let volume = 0;

  // 1. Bolt Head
  let headGeo: THREE.BufferGeometry;
  if (params.headType === 'hex') {
    headGeo = new THREE.CylinderGeometry(headW / 2, headW / 2, headH, 6);
    volume += (Math.sqrt(3) / 2) * Math.pow(headW, 2) * headH;
  } else if (params.headType === 'socket') {
    headGeo = new THREE.CylinderGeometry(headW / 2, headW / 2, headH, 32);
    volume += Math.PI * Math.pow(headW / 2, 2) * headH;
  } else {
    // Flange
    headGeo = new THREE.CylinderGeometry(headW / 2, headW * 0.7, headH, 32);
    volume += Math.PI * Math.pow(headW / 2, 2) * headH;
  }

  const headMesh = new THREE.Mesh(headGeo, matMain);
  headMesh.position.y = shaftLen + headH / 2;
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  group.add(headMesh);

  // Hex Socket Inset if socket head
  if (params.headType === 'socket') {
    const socketGeo = new THREE.CylinderGeometry(headW * 0.28, headW * 0.28, headH * 0.6, 6);
    const socketMesh = new THREE.Mesh(socketGeo, matAccent);
    socketMesh.position.y = shaftLen + headH - (headH * 0.3);
    group.add(socketMesh);
  }

  // 2. Optional Washer Face under head
  let washerOffset = 0;
  if (params.washerFace) {
    const washerRadius = (headW / 2) * 1.15;
    const washerH = 1.0;
    const washerGeo = new THREE.CylinderGeometry(washerRadius, washerRadius, washerH, 32);
    const washerMesh = new THREE.Mesh(washerGeo, matMain);
    washerMesh.position.y = shaftLen - washerH / 2;
    group.add(washerMesh);
    washerOffset = washerH;
    volume += Math.PI * Math.pow(washerRadius, 2) * washerH;
  }

  // 3. Shaft Core
  const shaftCoreRadius = shaftRadius - pitch * 0.35;
  const shaftGeo = new THREE.CylinderGeometry(shaftCoreRadius, shaftCoreRadius, shaftLen, 32);
  const shaftMesh = new THREE.Mesh(shaftGeo, matMain);
  shaftMesh.position.y = shaftLen / 2;
  shaftMesh.castShadow = true;
  group.add(shaftMesh);
  volume += Math.PI * Math.pow(shaftCoreRadius, 2) * shaftLen;

  // 4. Thread Helical Ridges (Procedural spiral thread rings)
  const threadCount = Math.floor(shaftLen / pitch);
  const threadRidgeGeo = new THREE.TorusGeometry(shaftRadius - pitch * 0.15, pitch * 0.3, 8, 32);
  
  for (let i = 1; i < threadCount; i++) {
    const threadMesh = new THREE.Mesh(threadRidgeGeo, matAccent);
    threadMesh.rotation.x = Math.PI / 2;
    // slight helix slant angle
    threadMesh.rotation.z = (i * 0.1) % (Math.PI * 2);
    threadMesh.position.y = i * pitch;
    group.add(threadMesh);
  }

  // 5. Chamfer Tip Cone
  const tipH = Math.min(2, pitch * 1.5);
  const tipGeo = new THREE.ConeGeometry(shaftRadius, tipH, 32);
  const tipMesh = new THREE.Mesh(tipGeo, matMain);
  tipMesh.rotation.x = Math.PI;
  tipMesh.position.y = -tipH / 2;
  group.add(tipMesh);

  return volume;
}

/* ========================================================================= */
/* 2. HOSE BARB FITTING MODEL GENERATOR                                       */
/* ========================================================================= */
function buildHoseBarbModel(
  group: THREE.Group,
  params: AllPartParams['hoseBarb'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const inRad = Math.max(1.5, (params.innerDiameter + tolerance) / 2);
  const wall = Math.max(1.2, params.wallThickness);
  const baseOutRad = Math.max(inRad + wall, (params.outerDiameter - tolerance) / 2);
  const totalLen = Math.max(20, params.length);
  const barbCount = Math.max(1, Math.min(8, params.barbCount));
  const barbDepth = Math.max(0.5, params.barbDepth);

  // Outer Barb Tube with Inner Bore
  const shape = new THREE.Shape();
  shape.absarc(0, 0, baseOutRad, 0, Math.PI * 2, false);
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, inRad, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const tubeLen = totalLen;
  const extrudeSettings = { depth: tubeLen, bevelEnabled: false, curveSegments: 32 };
  const tubeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const tubeMesh = new THREE.Mesh(tubeGeo, matMain);
  tubeMesh.rotation.x = -Math.PI / 2;
  tubeMesh.castShadow = true;
  group.add(tubeMesh);

  // Hex Nut Grip Center (if enabled)
  if (params.hexGrip) {
    const hexRadius = baseOutRad * 1.45;
    const hexH = Math.min(8, totalLen * 0.25);
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = hexRadius * Math.cos(angle);
      const y = hexRadius * Math.sin(angle);
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    hexShape.closePath();
    const hexHole = new THREE.Path();
    hexHole.absarc(0, 0, inRad, 0, Math.PI * 2, true);
    hexShape.holes.push(hexHole);

    const hexGeo = new THREE.ExtrudeGeometry(hexShape, { depth: hexH, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8 });
    const hexMesh = new THREE.Mesh(hexGeo, matAccent);
    hexMesh.rotation.x = -Math.PI / 2;
    hexMesh.position.y = (totalLen - hexH) / 2;
    group.add(hexMesh);
  }

  // Barbs (Conical ridges along upper section)
  const barbSectionLen = totalLen * 0.55;
  const barbSpacing = barbSectionLen / (barbCount + 1);

  for (let i = 1; i <= barbCount; i++) {
    const barbOuterRad = baseOutRad + barbDepth;
    const barbH = barbSpacing * 0.8;
    const barbGeo = new THREE.CylinderGeometry(baseOutRad, barbOuterRad, barbH, 32, 1, true);
    const barbMesh = new THREE.Mesh(barbGeo, matAccent);
    barbMesh.position.y = totalLen * 0.45 + i * barbSpacing;
    group.add(barbMesh);
  }

  const volume = Math.PI * (Math.pow(baseOutRad, 2) - Math.pow(inRad, 2)) * totalLen;
  return volume;
}

/* ========================================================================= */
/* 3. FLANGE GASKET MODEL GENERATOR                                         */
/* ========================================================================= */
function buildGasketModel(
  group: THREE.Group,
  params: AllPartParams['gasket'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const inRad = Math.max(5, (params.innerDiameter + tolerance) / 2);
  const outRad = Math.max(inRad + 5, params.outerDiameter / 2);
  const thick = Math.max(1, params.thickness);
  const holeRad = Math.max(1.5, (params.boltHoleDiameter + tolerance) / 2);
  const boltHoles = Math.max(2, Math.min(12, params.boltHoles));
  const pcdRad = Math.max(inRad + holeRad + 2, Math.min(outRad - holeRad - 1, params.pcd / 2));

  const shape = new THREE.Shape();
  shape.absarc(0, 0, outRad, 0, Math.PI * 2, false);

  // Main inner bore hole
  const innerPath = new THREE.Path();
  innerPath.absarc(0, 0, inRad, 0, Math.PI * 2, true);
  shape.holes.push(innerPath);

  // PCD Bolt holes
  for (let i = 0; i < boltHoles; i++) {
    const angle = (i * Math.PI * 2) / boltHoles;
    const hx = pcdRad * Math.cos(angle);
    const hy = pcdRad * Math.sin(angle);
    const boltHolePath = new THREE.Path();
    boltHolePath.absarc(hx, hy, holeRad, 0, Math.PI * 2, true);
    shape.holes.push(boltHolePath);
  }

  const extrudeSettings = { depth: thick, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, curveSegments: 36 };
  const gasketGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const gasketMesh = new THREE.Mesh(gasketGeo, matMain);
  gasketMesh.rotation.x = -Math.PI / 2;
  gasketMesh.castShadow = true;
  group.add(gasketMesh);

  // Sealing Lip Ridges (Concentric raised sealing rings)
  const lipRadius1 = inRad + (pcdRad - holeRad - inRad) * 0.5;
  const lipGeo = new THREE.TorusGeometry(lipRadius1, 0.4, 8, 48);
  const lipMesh1 = new THREE.Mesh(lipGeo, matAccent);
  lipMesh1.rotation.x = Math.PI / 2;
  lipMesh1.position.y = thick;
  group.add(lipMesh1);

  const lipMesh2 = lipMesh1.clone();
  lipMesh2.position.y = 0;
  group.add(lipMesh2);

  const baseArea = Math.PI * (Math.pow(outRad, 2) - Math.pow(inRad, 2)) - (boltHoles * Math.PI * Math.pow(holeRad, 2));
  return baseArea * thick;
}

/* ========================================================================= */
/* 4. DASH KNOB MODEL GENERATOR                                              */
/* ========================================================================= */
function buildKnobModel(
  group: THREE.Group,
  params: AllPartParams['knob'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const knobRad = Math.max(5, params.diameter / 2);
  const knobH = Math.max(8, params.height);
  const shaftRad = Math.max(1.5, (params.shaftDiameter + tolerance) / 2);
  const gripRibs = Math.max(0, Math.min(36, params.gripRibs));

  // Knob Body Shape with inner D-shaft or round shaft hole
  const shape = new THREE.Shape();
  shape.absarc(0, 0, knobRad, 0, Math.PI * 2, false);

  const shaftHole = new THREE.Path();
  if (params.shaftType === 'd-shaft') {
    // D-shaft hole (circle with flat edge)
    const flatOffset = shaftRad * 0.5;
    shaftHole.absarc(0, 0, shaftRad, Math.PI * 0.25, Math.PI * 1.75, true);
    shaftHole.lineTo(flatOffset, -shaftRad * 0.7);
  } else {
    shaftHole.absarc(0, 0, shaftRad, 0, Math.PI * 2, true);
  }
  shape.holes.push(shaftHole);

  const knobGeo = new THREE.ExtrudeGeometry(shape, { depth: knobH, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, curveSegments: 36 });
  const knobMesh = new THREE.Mesh(knobGeo, matMain);
  knobMesh.rotation.x = -Math.PI / 2;
  knobMesh.castShadow = true;
  group.add(knobMesh);

  // Exterior Knurling / Grip Ribs
  if (gripRibs > 0) {
    const ribGeo = new THREE.CylinderGeometry(0.6, 0.6, knobH * 0.7, 8);
    for (let i = 0; i < gripRibs; i++) {
      const angle = (i * Math.PI * 2) / gripRibs;
      const rx = (knobRad + 0.3) * Math.cos(angle);
      const rz = (knobRad + 0.3) * Math.sin(angle);
      const ribMesh = new THREE.Mesh(ribGeo, matAccent);
      ribMesh.position.set(rx, knobH * 0.45, rz);
      group.add(ribMesh);
    }
  }

  // Top Indicator Line / Dot
  if (params.indicatorDot) {
    const lineGeo = new THREE.BoxGeometry(1.2, 0.8, knobRad * 0.7);
    const lineMesh = new THREE.Mesh(lineGeo, matAccent);
    lineMesh.position.set(0, knobH + 0.5, knobRad * 0.4);
    group.add(lineMesh);
  }

  return Math.PI * (Math.pow(knobRad, 2) - Math.pow(shaftRad, 2)) * knobH;
}

/* ========================================================================= */
/* 5. L-BRACKET & MOUNT ADAPTER MODEL GENERATOR                             */
/* ========================================================================= */
function buildBracketModel(
  group: THREE.Group,
  params: AllPartParams['bracket'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const len = Math.max(15, params.length);
  const wid = Math.max(10, params.width);
  const hgt = Math.max(15, params.height);
  const thk = Math.max(2, params.thickness);
  const holeRad = Math.max(1.5, (params.holeDiameter + tolerance) / 2);

  // L-profile 2D shape
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(len, 0);
  shape.lineTo(len, thk);
  shape.lineTo(thk, thk);
  shape.lineTo(thk, hgt);
  shape.lineTo(0, hgt);
  shape.closePath();

  const bracketGeo = new THREE.ExtrudeGeometry(shape, { depth: wid, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
  const bracketMesh = new THREE.Mesh(bracketGeo, matMain);
  bracketMesh.position.z = -wid / 2;
  bracketMesh.castShadow = true;
  group.add(bracketMesh);

  // Base Arm Hole (Horizontal)
  const holeGeo = new THREE.CylinderGeometry(holeRad, holeRad, thk * 2, 24);
  const holeMesh1 = new THREE.Mesh(holeGeo, matAccent);
  holeMesh1.position.set(len * 0.6, thk / 2, 0);
  group.add(holeMesh1);

  // Vertical Arm Hole
  const holeMesh2 = new THREE.Mesh(holeGeo, matAccent);
  holeMesh2.rotation.z = Math.PI / 2;
  holeMesh2.position.set(thk / 2, hgt * 0.6, 0);
  group.add(holeMesh2);

  // Optional Diagonal Gusset Reinforcement Rib
  if (params.gusset) {
    const gussetShape = new THREE.Shape();
    gussetShape.moveTo(thk, thk);
    gussetShape.lineTo(len * 0.7, thk);
    gussetShape.lineTo(thk, hgt * 0.7);
    gussetShape.closePath();

    const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, { depth: thk, bevelEnabled: false });
    const gussetMesh = new THREE.Mesh(gussetGeo, matAccent);
    gussetMesh.position.z = -thk / 2;
    group.add(gussetMesh);
  }

  return (len * thk + (hgt - thk) * thk) * wid;
}

/* ========================================================================= */
/* 6. SPACER / SUSPENSION BUSHING MODEL GENERATOR                           */
/* ========================================================================= */
function buildBushingModel(
  group: THREE.Group,
  params: AllPartParams['bushing'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const inRad = Math.max(2, (params.innerDiameter + tolerance) / 2);
  const outRad = Math.max(inRad + 2, (params.outerDiameter - tolerance) / 2);
  const len = Math.max(5, params.length);
  const flangeRad = Math.max(outRad, params.flangeDiameter / 2);
  const flangeThick = Math.min(len * 0.4, params.flangeThickness);

  // Main Outer Sleeve with Inner Bore
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outRad, 0, Math.PI * 2, false);
  const innerHole = new THREE.Path();
  innerHole.absarc(0, 0, inRad, 0, Math.PI * 2, true);
  shape.holes.push(innerHole);

  const sleeveGeo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, curveSegments: 36 });
  const sleeveMesh = new THREE.Mesh(sleeveGeo, matMain);
  sleeveMesh.rotation.x = -Math.PI / 2;
  sleeveMesh.castShadow = true;
  group.add(sleeveMesh);

  // Optional Flange Step Ring
  if (flangeRad > outRad && flangeThick > 0) {
    const flangeShape = new THREE.Shape();
    flangeShape.absarc(0, 0, flangeRad, 0, Math.PI * 2, false);
    const fHole = new THREE.Path();
    fHole.absarc(0, 0, inRad, 0, Math.PI * 2, true);
    flangeShape.holes.push(fHole);

    const flangeGeo = new THREE.ExtrudeGeometry(flangeShape, { depth: flangeThick, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5 });
    const flangeMesh = new THREE.Mesh(flangeGeo, matAccent);
    flangeMesh.rotation.x = -Math.PI / 2;
    flangeMesh.position.y = len - flangeThick;
    group.add(flangeMesh);
  }

  return Math.PI * (Math.pow(outRad, 2) - Math.pow(inRad, 2)) * len;
}

/* ========================================================================= */
/* 7. O-RING SEAL GROOVE / WASHER MODEL GENERATOR                            */
/* ========================================================================= */
function buildOringModel(
  group: THREE.Group,
  params: AllPartParams['oring'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const inRad = Math.max(3, (params.innerDiameter + tolerance) / 2);
  const outRad = Math.max(inRad + 3, params.outerDiameter / 2);
  const thick = Math.max(2, params.thickness);
  const grooveDepth = Math.min(thick * 0.6, params.grooveDepth);

  const shape = new THREE.Shape();
  shape.absarc(0, 0, outRad, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inRad, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const washerGeo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, curveSegments: 36 });
  const washerMesh = new THREE.Mesh(washerGeo, matMain);
  washerMesh.rotation.x = -Math.PI / 2;
  washerMesh.castShadow = true;
  group.add(washerMesh);

  // O-Ring Channel Groove (Visualized on face)
  const grooveMidRad = inRad + (outRad - inRad) * 0.5;
  const grooveGeo = new THREE.TorusGeometry(grooveMidRad, grooveDepth * 0.7, 12, 48);
  const grooveMesh = new THREE.Mesh(grooveGeo, matAccent);
  grooveMesh.rotation.x = Math.PI / 2;
  grooveMesh.position.y = thick;
  group.add(grooveMesh);

  return Math.PI * (Math.pow(outRad, 2) - Math.pow(inRad, 2)) * thick;
}

/* ========================================================================= */
/* 8. WIRING HARNESS CONNECTOR SHELL MODEL GENERATOR                         */
/* ========================================================================= */
function buildConnectorModel(
  group: THREE.Group,
  params: AllPartParams['connector'],
  matMain: THREE.Material,
  matAccent: THREE.Material,
  tolerance: number
): number {
  const pins = Math.max(1, params.pinCount);
  const rows = Math.max(1, Math.min(2, params.rows));
  const cols = Math.ceil(pins / rows);

  const pinSpacing = 4.0;
  const shellW = cols * pinSpacing + 8;
  const shellH = rows * pinSpacing + 8;
  const shellL = Math.max(15, params.length);

  // Shell Rectangular Housing
  const shellGeo = new THREE.BoxGeometry(shellW, shellH, shellL);
  const shellMesh = new THREE.Mesh(shellGeo, matMain);
  shellMesh.position.y = shellH / 2;
  shellMesh.castShadow = true;
  group.add(shellMesh);

  // Pin Cavities Grid
  const pinGeo = new THREE.BoxGeometry(2.0, 2.0, shellL + 1);
  const startX = -((cols - 1) * pinSpacing) / 2;
  const startY = -((rows - 1) * pinSpacing) / 2 + shellH / 2;

  let pinIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pinIdx >= pins) break;
      const pinMesh = new THREE.Mesh(pinGeo, matAccent);
      pinMesh.position.set(startX + c * pinSpacing, startY + r * pinSpacing, 0);
      group.add(pinMesh);
      pinIdx++;
    }
  }

  // Top Retaining Latch Clip
  if (params.latchClip) {
    const clipGeo = new THREE.BoxGeometry(shellW * 0.5, 3, shellL * 0.6);
    const clipMesh = new THREE.Mesh(clipGeo, matAccent);
    clipMesh.position.set(0, shellH + 1.5, 0);
    group.add(clipMesh);
  }

  return shellW * shellH * shellL;
}
