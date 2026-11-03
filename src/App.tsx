import React, { useState } from 'react';
import * as THREE from 'three';
import { AIPresetModal } from './components/AIPresetModal';
import { GarageVaultModal } from './components/GarageVaultModal';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { Viewport3D } from './components/Viewport3D';
import { AllPartParams, FilamentMaterial, GarageVehicle, PartStats, PartType, VaultPart } from './types/cad';
import { ISO_THREAD_PRESETS } from './utils/isoThreads';
import { exportToSTL } from './utils/stlExporter';

export default function App() {
  // 1. Core CAD Parameters State
  const [partType, setPartType] = useState<PartType>('bolt');
  const [selectedIsoPreset, setSelectedIsoPreset] = useState<string>('M6x1.0');
  const [toleranceOffset, setToleranceOffset] = useState<number>(0.15);
  const [material, setMaterial] = useState<FilamentMaterial>('petg');

  const [partStats, setPartStats] = useState<PartStats>({
    boundingBox: { x: 10, y: 35, z: 10 },
    volumeMm3: 1800,
    weightGrams: 2.2,
    filamentLengthMeters: 0.7,
    estimatedCostUsd: 0.05,
    estimatedPrintTimeMins: 9,
    triangleCount: 1200,
  });

  const [allParams, setAllParams] = useState<AllPartParams>({
    bolt: {
      headType: 'hex',
      diameter: 6,
      pitch: 1.0,
      shaftLength: 30,
      headHeight: 5,
      headWidth: 10,
      washerFace: true,
    },
    hoseBarb: {
      innerDiameter: 12,
      outerDiameter: 16,
      length: 45,
      barbCount: 3,
      barbDepth: 1.5,
      wallThickness: 3,
      hexGrip: true,
    },
    gasket: {
      innerDiameter: 35,
      outerDiameter: 65,
      thickness: 3,
      boltHoleDiameter: 8,
      boltHoles: 4,
      pcd: 50,
    },
    knob: {
      diameter: 22,
      height: 18,
      shaftDiameter: 6,
      shaftType: 'd-shaft',
      gripRibs: 12,
      indicatorDot: true,
    },
    bracket: {
      length: 40,
      width: 25,
      height: 40,
      thickness: 4,
      holeDiameter: 6,
      holeSpacing: 20,
      gusset: true,
    },
    bushing: {
      innerDiameter: 10,
      outerDiameter: 20,
      length: 25,
      flangeDiameter: 28,
      flangeThickness: 4,
    },
    oring: {
      innerDiameter: 18,
      outerDiameter: 30,
      thickness: 4,
      grooveDepth: 1.5,
      grooveWidth: 3,
    },
    connector: {
      pinCount: 6,
      rows: 2,
      length: 22,
      wireDiameter: 2,
      latchClip: true,
    },
  });

  // 2. Vehicle Fleet & Cloud Vault State
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([
    { id: 'veh-1', name: '2018 Toyota Hilux', engine: '2.8L Turbo Diesel', partsCount: 3, icon: 'fa-truck-pickup' },
    { id: 'veh-2', name: '2021 Ford Ranger', engine: '3.2L Wildtrak', partsCount: 2, icon: 'fa-truck-monster' },
    { id: 'veh-3', name: '2015 Holden Commodore', engine: '6.0L V8 SS', partsCount: 4, icon: 'fa-car' },
  ]);
  const [activeVehicleId, setActiveVehicleId] = useState<string>('veh-1');

  const [vaultParts, setVaultParts] = useState<VaultPart[]>([
    {
      id: 'part-101',
      vehicleId: 'veh-1',
      name: 'Coolant Hose Barb Adapter',
      partType: 'hoseBarb',
      params: { innerDiameter: 12, outerDiameter: 16, length: 45, barbCount: 3, barbDepth: 1.5, wallThickness: 3, hexGrip: true },
      filamentMaterial: 'nylon',
      toleranceOffset: 0.15,
      date: '2026-10-15',
      notes: 'Print in Nylon PA12 for high temperature engine bay coolant hose fitment.',
    },
    {
      id: 'part-102',
      vehicleId: 'veh-1',
      name: 'Exhaust Heat Shield Flange Gasket',
      partType: 'gasket',
      params: { innerDiameter: 35, outerDiameter: 65, thickness: 3, boltHoleDiameter: 8, boltHoles: 4, pcd: 50 },
      filamentMaterial: 'tpu',
      toleranceOffset: 0.10,
      date: '2026-10-22',
      notes: 'Print in flexible TPU 95A rubber for leak-proof sealing.',
    },
    {
      id: 'part-103',
      vehicleId: 'veh-2',
      name: 'Dash Switch Knob Replacement',
      partType: 'knob',
      params: { diameter: 22, height: 18, shaftDiameter: 6, shaftType: 'd-shaft', gripRibs: 12, indicatorDot: true },
      filamentMaterial: 'petg',
      toleranceOffset: 0.15,
      date: '2026-11-01',
      notes: 'PETG print with 40% gyroid infill.',
    },
  ]);

  // 3. UI Modal & Toast States
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isSlicerOpen, setIsSlicerOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ message: string; visible: boolean; type?: 'success' | 'info' | 'error' }>({
    message: '',
    visible: false,
  });

  // 4. Three.js References
  const activeGroupRef = React.useRef<THREE.Group | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastInfo({ message, visible: true, type });
    setTimeout(() => {
      setToastInfo((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // 5. Param Handlers
  const handlePartTypeChange = (newType: PartType) => {
    setPartType(newType);
    showToast(`Switched CAD part generator to ${newType.toUpperCase()}`);
  };

  const handleIsoPresetChange = (presetId: string) => {
    setSelectedIsoPreset(presetId);
    if (presetId === 'custom') return;

    const preset = ISO_THREAD_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setAllParams((prev) => ({
        ...prev,
        bolt: {
          ...prev.bolt,
          diameter: preset.diameter,
          pitch: preset.pitch,
          headHeight: preset.recommendedHeadHeight,
          headWidth: preset.recommendedHeadWidth,
        },
      }));
      showToast(`Applied ${preset.label} dimensions`);
    }
  };

  const handleParamChange = (paramKey: string, value: any) => {
    setAllParams((prev) => ({
      ...prev,
      [partType]: {
        ...prev[partType],
        [paramKey]: value,
      },
    }));
  };

  // 6. Garage & Vault Handlers
  const handleAddVehicle = (name: string, engine: string) => {
    const newVeh: GarageVehicle = {
      id: `veh-${Date.now()}`,
      name,
      engine,
      partsCount: 0,
      icon: 'fa-truck-pickup',
    };
    setVehicles((prev) => [...prev, newVeh]);
    setActiveVehicleId(newVeh.id);
    showToast(`Added ${name} to Vehicle Garage!`);
  };

  const handleSaveVault = () => {
    const activeVeh = vehicles.find((v) => v.id === activeVehicleId);
    const vehName = activeVeh ? activeVeh.name : 'Vehicle';

    const label = prompt(
      `Enter a descriptive label for this CAD model (${vehName}):`,
      `${partType.toUpperCase()} Replacement Part`
    );
    if (!label) return;

    const newPart: VaultPart = {
      id: `part-${Date.now()}`,
      vehicleId: activeVehicleId,
      name: label,
      partType,
      params: JSON.parse(JSON.stringify(allParams[partType])),
      filamentMaterial: material,
      toleranceOffset,
      date: new Date().toISOString().split('T')[0],
      notes: `Custom 3D model saved for ${vehName} with +${toleranceOffset}mm clearance offset.`,
    };

    setVaultParts((prev) => [newPart, ...prev]);
    showToast(`Saved "${label}" to Cloud Vault!`);
  };

  const handleLoadVaultPart = (part: VaultPart) => {
    setPartType(part.partType);
    setMaterial(part.filamentMaterial);
    setToleranceOffset(part.toleranceOffset);

    setAllParams((prev) => ({
      ...prev,
      [part.partType]: { ...part.params },
    }));

    showToast(`Loaded "${part.name}" into CAD Viewport!`);
  };

  const handleDeleteVaultPart = (partId: string) => {
    if (!confirm('Are you sure you want to delete this part from your vault?')) return;
    setVaultParts((prev) => prev.filter((p) => p.id !== partId));
    showToast('Part deleted from vault.', 'info');
  };

  // 7. AI Preset Handler
  const handleApplyAIPreset = (aiResult: any) => {
    if (!aiResult) return;
    if (aiResult.partType && (allParams as any)[aiResult.partType]) {
      setPartType(aiResult.partType as PartType);
    }
    if (aiResult.filamentMaterial) {
      setMaterial(aiResult.filamentMaterial as FilamentMaterial);
    }
    if (aiResult.toleranceOffset !== undefined) {
      setToleranceOffset(aiResult.toleranceOffset);
    }
    if (aiResult.params) {
      const targetType = aiResult.partType || partType;
      setAllParams((prev) => ({
        ...prev,
        [targetType]: {
          ...(prev as any)[targetType],
          ...aiResult.params,
        },
      }));
    }
    showToast(`Applied AI CAD parameters for ${aiResult.partName || 'Custom Part'}!`);
  };

  // 8. STL Export Handler
  const handleExportSTL = () => {
    if (!activeGroupRef.current) {
      showToast('3D Model viewport is still loading...', 'error');
      return;
    }
    const filename = `${partType}_${material}_+${toleranceOffset}mm.stl`;
    exportToSTL(activeGroupRef.current, filename, true);
    showToast(`Exported 3D Printable STL file: ${filename}`);
  };

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex flex-col overflow-hidden select-none">
      {/* Header Bar */}
      <Header
        activeVehicle={activeVehicle}
        onOpenGarage={() => setIsGarageOpen(true)}
        onToggleSlicer={() => setIsSlicerOpen((prev) => !prev)}
        isSlicerOpen={isSlicerOpen}
        onOpenAI={() => setIsAIOpen(true)}
        onExportSTL={handleExportSTL}
      />

      {/* Main CAD Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden relative">
        {/* Left Control Sidebar */}
        <Sidebar
          partType={partType}
          onPartTypeChange={handlePartTypeChange}
          selectedIsoPreset={selectedIsoPreset}
          onIsoPresetChange={handleIsoPresetChange}
          toleranceOffset={toleranceOffset}
          onToleranceChange={setToleranceOffset}
          material={material}
          onMaterialChange={setMaterial}
          params={allParams[partType]}
          onParamChange={handleParamChange}
          partStats={partStats}
          onSaveVault={handleSaveVault}
          onOpenVault={() => setIsGarageOpen(true)}
          onOpenCameraScanner={() => setIsAIOpen(true)}
        />

        {/* Center 3D Viewport Canvas */}
        <Viewport3D
          partType={partType}
          params={allParams[partType]}
          material={material}
          toleranceOffset={toleranceOffset}
          isSlicerOpen={isSlicerOpen}
          onCloseSlicer={() => setIsSlicerOpen(false)}
          onStatsUpdated={(newStats: PartStats) => {
            setPartStats(newStats);
          }}
          onGroupReady={(group) => {
            activeGroupRef.current = group;
          }}
        />
      </main>

      {/* Multi-Vehicle Garage & Vault Modal */}
      <GarageVaultModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        vehicles={vehicles}
        activeVehicleId={activeVehicleId}
        onSelectVehicle={(id) => {
          setActiveVehicleId(id);
          const v = vehicles.find((veh) => veh.id === id);
          if (v) showToast(`Switched active vehicle context to ${v.name}`);
        }}
        onAddVehicle={handleAddVehicle}
        vaultParts={vaultParts}
        onLoadPart={handleLoadVaultPart}
        onDeletePart={handleDeleteVaultPart}
      />

      {/* AI Vehicle Preset Assistant Modal */}
      <AIPresetModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        activeVehicle={activeVehicle}
        onApplyPreset={handleApplyAIPreset}
      />

      {/* Toast Notification */}
      <Toast message={toastInfo.message} visible={toastInfo.visible} type={toastInfo.type} />
    </div>
  );
}
