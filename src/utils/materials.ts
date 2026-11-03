import { FilamentMaterial, MaterialInfo } from '../types/cad';

export const MATERIALS: Record<FilamentMaterial, MaterialInfo> = {
  petg: {
    id: 'petg',
    name: 'PETG - General Auto / Cabin',
    maxTemp: '80°C',
    oilResistance: 'Good',
    uvRating: 'Moderate',
    tensileStrength: '50 MPa',
    density: 1.27,
    costPerKg: 24, // $24 / kg
    nozzleTemp: '230 - 250°C',
    bedTemp: '70 - 85°C',
    color: '#0284c7', // Sky Blue
    roughness: 0.3,
    metalness: 0.1,
    description: 'Durable, chemical resistant, easy to print. Ideal for interior dash trim, clips, and non-engine brackets.',
  },
  asa: {
    id: 'asa',
    name: 'ASA - Under-Hood & UV Resistant',
    maxTemp: '100°C',
    oilResistance: 'High',
    uvRating: 'Excellent',
    tensileStrength: '55 MPa',
    density: 1.07,
    costPerKg: 30, // $30 / kg
    nozzleTemp: '240 - 260°C',
    bedTemp: '90 - 110°C',
    color: '#d97706', // Amber / Orange
    roughness: 0.45,
    metalness: 0.05,
    description: 'High heat & weather resistance. Perfect for outdoor body trim, side mirror caps, and engine bay cowlings.',
  },
  abs: {
    id: 'abs',
    name: 'ABS - High Strength & Impact',
    maxTemp: '98°C',
    oilResistance: 'Good',
    uvRating: 'Fair',
    tensileStrength: '43 MPa',
    density: 1.04,
    costPerKg: 22, // $22 / kg
    nozzleTemp: '230 - 250°C',
    bedTemp: '95 - 110°C',
    color: '#38bdf8', // Light Cyan
    roughness: 0.35,
    metalness: 0.1,
    description: 'Slightly flexible, high impact toughness. Great for interior knobs, housing covers, and snap-fit parts.',
  },
  tpu: {
    id: 'tpu',
    name: 'TPU 95A - Flexible Gaskets & Seals',
    maxTemp: '85°C',
    oilResistance: 'High',
    uvRating: 'Good',
    tensileStrength: '35 MPa',
    density: 1.21,
    costPerKg: 35, // $35 / kg
    nozzleTemp: '220 - 240°C',
    bedTemp: '50 - 60°C',
    color: '#10b981', // Emerald Green
    roughness: 0.6,
    metalness: 0.0,
    description: 'Rubber-like elastomeric flexibility. Essential for custom flange gaskets, O-rings, and vibration dampers.',
  },
  nylon: {
    id: 'nylon',
    name: 'Nylon PA12 - Fluid Hose Barbs & Gears',
    maxTemp: '130°C',
    oilResistance: 'Excellent',
    uvRating: 'Good',
    tensileStrength: '75 MPa',
    density: 1.14,
    costPerKg: 50, // $50 / kg
    nozzleTemp: '260 - 280°C',
    bedTemp: '80 - 100°C',
    color: '#a855f7', // Purple
    roughness: 0.25,
    metalness: 0.15,
    description: 'Extremely strong, self-lubricating, high wear resistance. Best for fluid hose barbs, gears, and fuel fittings.',
  },
  cfpc: {
    id: 'cfpc',
    name: 'CF-PC (Carbon Fiber Polycarbonate)',
    maxTemp: '145°C',
    oilResistance: 'Extreme',
    uvRating: 'High',
    tensileStrength: '90 MPa',
    density: 1.25,
    costPerKg: 70, // $70 / kg
    nozzleTemp: '280 - 310°C',
    bedTemp: '100 - 120°C',
    color: '#475569', // Dark Slate Metallic
    roughness: 0.5,
    metalness: 0.35,
    description: 'Maximum thermal rating & structural stiffness. Built for high-heat turbo intake tubes, manifold adapters, and heavy brackets.',
  },
};
