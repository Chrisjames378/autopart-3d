import * as THREE from 'three';

/**
 * Custom STL Exporter for Three.js Object3D / Group / Mesh.
 * Generates an ASCII or Binary STL file blob and triggers a browser download.
 */
export function exportToSTL(object: THREE.Object3D, filename: string = 'autopart.stl', binary: boolean = true) {
  if (binary) {
    const buffer = generateBinarySTL(object);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    downloadBlob(blob, filename);
  } else {
    const asciiString = generateAsciiSTL(object);
    const blob = new Blob([asciiString], { type: 'text/plain' });
    downloadBlob(blob, filename);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function generateBinarySTL(object: THREE.Object3D): ArrayBuffer {
  const triangles: { v1: THREE.Vector3; v2: THREE.Vector3; v3: THREE.Vector3; normal: THREE.Vector3 }[] = [];

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);

      const posAttr = geometry.getAttribute('position');
      const indexAttr = geometry.getIndex();

      const tempV1 = new THREE.Vector3();
      const tempV2 = new THREE.Vector3();
      const tempV3 = new THREE.Vector3();

      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i += 3) {
          const a = indexAttr.getX(i);
          const b = indexAttr.getX(i + 1);
          const c = indexAttr.getX(i + 2);

          tempV1.fromBufferAttribute(posAttr, a);
          tempV2.fromBufferAttribute(posAttr, b);
          tempV3.fromBufferAttribute(posAttr, c);

          const cb = new THREE.Vector3().subVectors(tempV3, tempV2);
          const ab = new THREE.Vector3().subVectors(tempV1, tempV2);
          const normal = cb.cross(ab).normalize();

          triangles.push({
            v1: tempV1.clone(),
            v2: tempV2.clone(),
            v3: tempV3.clone(),
            normal: normal.clone(),
          });
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          tempV1.fromBufferAttribute(posAttr, i);
          tempV2.fromBufferAttribute(posAttr, i + 1);
          tempV3.fromBufferAttribute(posAttr, i + 2);

          const cb = new THREE.Vector3().subVectors(tempV3, tempV2);
          const ab = new THREE.Vector3().subVectors(tempV1, tempV2);
          const normal = cb.cross(ab).normalize();

          triangles.push({
            v1: tempV1.clone(),
            v2: tempV2.clone(),
            v3: tempV3.clone(),
            normal: normal.clone(),
          });
        }
      }
    }
  });

  const bufferLength = 80 + 4 + triangles.length * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const dataView = new DataView(buffer);

  // Header (80 bytes)
  const header = 'AutoPart 3D CAD Exporter - 3D Printable STL';
  for (let i = 0; i < header.length; i++) {
    dataView.setUint8(i, header.charCodeAt(i));
  }

  // Triangle count (4 bytes)
  dataView.setUint32(80, triangles.length, true);

  let offset = 84;
  for (const tri of triangles) {
    // Normal
    dataView.setFloat32(offset, tri.normal.x, true);
    dataView.setFloat32(offset + 4, tri.normal.y, true);
    dataView.setFloat32(offset + 8, tri.normal.z, true);
    offset += 12;

    // V1
    dataView.setFloat32(offset, tri.v1.x, true);
    dataView.setFloat32(offset + 4, tri.v1.y, true);
    dataView.setFloat32(offset + 8, tri.v1.z, true);
    offset += 12;

    // V2
    dataView.setFloat32(offset, tri.v2.x, true);
    dataView.setFloat32(offset + 4, tri.v2.y, true);
    dataView.setFloat32(offset + 8, tri.v2.z, true);
    offset += 12;

    // V3
    dataView.setFloat32(offset, tri.v3.x, true);
    dataView.setFloat32(offset + 4, tri.v3.y, true);
    dataView.setFloat32(offset + 8, tri.v3.z, true);
    offset += 12;

    // Attribute byte count (2 bytes, set to 0)
    dataView.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

function generateAsciiSTL(object: THREE.Object3D): string {
  let output = 'solid AutoPart3D\n';

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);

      const posAttr = geometry.getAttribute('position');
      const indexAttr = geometry.getIndex();

      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const v3 = new THREE.Vector3();

      const processTriangle = (a: number, b: number, c: number) => {
        v1.fromBufferAttribute(posAttr, a);
        v2.fromBufferAttribute(posAttr, b);
        v3.fromBufferAttribute(posAttr, c);

        const cb = new THREE.Vector3().subVectors(v3, v2);
        const ab = new THREE.Vector3().subVectors(v1, v2);
        const normal = cb.cross(ab).normalize();

        output += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
        output += `    outer loop\n`;
        output += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
        output += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
        output += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
        output += `    endloop\n`;
        output += `  endfacet\n`;
      };

      if (indexAttr) {
        for (let i = 0; i < indexAttr.count; i += 3) {
          processTriangle(indexAttr.getX(i), indexAttr.getX(i + 1), indexAttr.getX(i + 2));
        }
      } else {
        for (let i = 0; i < posAttr.count; i += 3) {
          processTriangle(i, i + 1, i + 2);
        }
      }
    }
  });

  output += 'endsolid AutoPart3D\n';
  return output;
}
