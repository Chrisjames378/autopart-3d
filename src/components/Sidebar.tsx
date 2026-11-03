import React from 'react';
import { AllPartParams, FilamentMaterial, PartStats, PartType } from '../types/cad';
import { ISO_THREAD_PRESETS } from '../utils/isoThreads';
import { MATERIALS } from '../utils/materials';

interface SidebarProps {
  partType: PartType;
  onPartTypeChange: (type: PartType) => void;
  selectedIsoPreset: string;
  onIsoPresetChange: (presetId: string) => void;
  toleranceOffset: number;
  onToleranceChange: (offset: number) => void;
  material: FilamentMaterial;
  onMaterialChange: (mat: FilamentMaterial) => void;
  params: AllPartParams[PartType];
  onParamChange: (paramKey: string, value: any) => void;
  partStats: PartStats;
  onSaveVault: () => void;
  onOpenVault: () => void;
  onOpenCameraScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  partType,
  onPartTypeChange,
  selectedIsoPreset,
  onIsoPresetChange,
  toleranceOffset,
  onToleranceChange,
  material,
  onMaterialChange,
  params,
  onParamChange,
  partStats,
  onSaveVault,
  onOpenVault,
  onOpenCameraScanner,
}) => {
  const currentMaterialInfo = MATERIALS[material] || MATERIALS.petg;

  const hours = Math.floor((partStats.estimatedPrintTimeMins || 0) / 60);
  const mins = (partStats.estimatedPrintTimeMins || 0) % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

  return (
    <aside className="lg:col-span-4 xl:col-span-3 bg-gray-800 border-r border-gray-700 p-4 flex flex-col h-full overflow-y-auto space-y-4">
      {/* 0. Camera Part Photo Scanner Quick Action Bar */}
      <button
        onClick={onOpenCameraScanner}
        className="w-full bg-gradient-to-r from-sky-600 via-amber-600 to-amber-500 hover:from-sky-500 hover:to-amber-400 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 border border-amber-400/40"
      >
        <i className="fa-solid fa-camera text-base text-amber-300"></i>
        <span>📷 Camera Part Photo Scanner (AI)</span>
      </button>

      {/* 1. Part Category Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Select Auto Part Type
        </label>
        <div className="relative">
          <select
            value={partType}
            onChange={(e) => onPartTypeChange(e.target.value as PartType)}
            className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          >
            <option value="bolt">🔩 Custom Bolt & ISO Thread</option>
            <option value="hoseBarb">🔌 Hose Adapter / Barb Fitting</option>
            <option value="gasket">⭕ Flange Gasket / Seal Ring</option>
            <option value="knob">🎛️ Dash Knob / Switch Button</option>
            <option value="bracket">📐 L-Bracket & Mount Adapter</option>
            <option value="bushing">⭕ Spacer / Suspension Bushing</option>
            <option value="oring">⭕ O-Ring Seal Groove / Washer</option>
            <option value="connector">🔌 Wiring Harness Connector Shell</option>
          </select>
        </div>
      </div>

      {/* 2. ISO Metric Thread Presets (Visible only when bolt is selected) */}
      {partType === 'bolt' && (
        <div className="bg-gray-900/90 p-3 rounded-xl border border-gray-700 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">
            Standard Automotive ISO Threads
          </label>
          <select
            value={selectedIsoPreset}
            onChange={(e) => onIsoPresetChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-amber-400 font-mono rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
          >
            <option value="custom">Custom Dimensions</option>
            {ISO_THREAD_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Global Print Tolerance Compensation */}
      <div className="bg-gray-900/90 p-3 rounded-xl border border-gray-700 space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-gray-300">Fit Tolerance Offset</label>
          <span className="font-mono text-amber-400">
            +{toleranceOffset.toFixed(2)} mm
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={toleranceOffset}
          onChange={(e) => onToleranceChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <p className="text-[10px] text-gray-400">
          Compensates for 3D printer plastic expansion so threads and press-fits slide together seamlessly.
        </p>
      </div>

      {/* 4. Filament Material Selector & Specs */}
      <div className="bg-gray-900/90 p-3 rounded-xl border border-gray-700 space-y-2">
        <label className="block text-xs font-semibold text-gray-300">
          Automotive Print Filament Choice
        </label>
        <select
          value={material}
          onChange={(e) => onMaterialChange(e.target.value as FilamentMaterial)}
          className="w-full bg-gray-800 border border-gray-700 text-sky-400 font-medium rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 outline-none"
        >
          {Object.values(MATERIALS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center pt-1 border-t border-gray-800">
          <div className="bg-gray-800 p-1.5 rounded">
            <div className="text-gray-400">Max Temp</div>
            <div className="text-amber-400 font-bold">{currentMaterialInfo.maxTemp}</div>
          </div>
          <div className="bg-gray-800 p-1.5 rounded">
            <div className="text-gray-400">Oil/Fuel</div>
            <div className="text-emerald-400 font-bold">{currentMaterialInfo.oilResistance}</div>
          </div>
          <div className="bg-gray-800 p-1.5 rounded">
            <div className="text-gray-400">UV Rating</div>
            <div className="text-sky-400 font-bold">{currentMaterialInfo.uvRating}</div>
          </div>
        </div>
      </div>

      {/* 5. Cost & Print Estimator Card */}
      <div className="bg-gradient-to-br from-gray-900 via-sky-950/40 to-gray-900 p-3.5 rounded-xl border border-sky-500/40 space-y-2 shadow-lg">
        <div className="flex items-center justify-between text-xs border-b border-gray-700/80 pb-1.5">
          <span className="font-bold text-sky-400 flex items-center gap-1.5">
            <i className="fa-solid fa-calculator text-amber-400"></i> Filament Cost & Print Estimator
          </span>
          <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded">
            ${currentMaterialInfo.costPerKg}/kg
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-gray-800/80 p-2 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 font-sans">Est. Material Cost</div>
            <div className="text-emerald-400 font-bold text-sm">
              ${partStats.estimatedCostUsd.toFixed(2)} USD
            </div>
          </div>
          <div className="bg-gray-800/80 p-2 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 font-sans">Est. Print Duration</div>
            <div className="text-amber-400 font-bold text-sm">
              {timeFormatted}
            </div>
          </div>
          <div className="bg-gray-800/80 p-2 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 font-sans">Filament Usage</div>
            <div className="text-sky-300 font-bold">
              {partStats.weightGrams} g ({partStats.filamentLengthMeters}m)
            </div>
          </div>
          <div className="bg-gray-800/80 p-2 rounded border border-gray-700/60">
            <div className="text-[10px] text-gray-400 font-sans">Nozzle / Bed Temp</div>
            <div className="text-gray-300 font-bold text-[11px]">
              {currentMaterialInfo.nozzleTemp.split(' ')[0]} / {currentMaterialInfo.bedTemp.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Dynamic Parametric Control Panel */}
      <div className="space-y-4 bg-gray-850 p-4 rounded-xl border border-gray-700/60 shadow-inner">
        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
          <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
            <i className="fa-solid fa-sliders"></i> {getPartTitle(partType)} Dimensions
          </h3>
          <span className="text-xs text-gray-400 font-mono">Unit: mm</span>
        </div>

        <div className="space-y-3 text-xs">
          {renderDynamicFields(partType, params, onParamChange)}
        </div>
      </div>

      {/* 7. Cloud Part Vault Quick Actions */}
      <div className="bg-gray-900/90 p-3 rounded-xl border border-gray-700 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <i className="fa-solid fa-vault text-amber-400"></i> Cloud Part Vault
          </span>
          <span className="text-[10px] text-gray-400">Vehicle Linked</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSaveVault}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i> Save to Vault
          </button>
          <button
            onClick={onOpenVault}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs px-3 py-2 rounded-lg transition"
            title="Open Part Library"
          >
            <i className="fa-solid fa-folder-open"></i>
          </button>
        </div>
      </div>

      {/* 8. Installation & Post-Processing Tips */}
      <div className="bg-sky-950/40 rounded-xl p-3 border border-sky-900/60 space-y-1 text-xs text-sky-200">
        <div className="font-semibold text-sky-300 flex items-center gap-1.5">
          <i className="fa-solid fa-screwdriver-wrench"></i> Post-Processing & Install
        </div>
        <p className="text-gray-300 text-[11px] leading-relaxed">
          {getPostProcessingTip(partType, material)}
        </p>
      </div>
    </aside>
  );
};

function getPartTitle(type: PartType): string {
  switch (type) {
    case 'bolt': return 'Bolt & Thread';
    case 'hoseBarb': return 'Hose Barb Fitting';
    case 'gasket': return 'Flange Gasket';
    case 'knob': return 'Dash Knob';
    case 'bracket': return 'L-Bracket';
    case 'bushing': return 'Bushing / Spacer';
    case 'oring': return 'O-Ring Seal';
    case 'connector': return 'Connector Shell';
  }
}

function getPostProcessingTip(type: PartType, mat: FilamentMaterial): string {
  if (mat === 'nylon') {
    return 'Anneal Nylon parts in warm water for 12 hours post-print to increase layer impact toughness and prevent brittle cracking under fluid pressure.';
  }
  if (type === 'bolt') {
    return 'Tap threaded holes with a steel metric tap set after printing. For high-torque bolts, insert brass heat-set threaded inserts with a soldering iron.';
  }
  if (type === 'gasket') {
    return 'Print flexible TPU gaskets with 100% solid concentric infill for leak-proof fluid/vacuum sealing.';
  }
  if (type === 'hoseBarb') {
    return 'Lightly sand barb ridges with 400-grit sandpaper for a smooth airtight hose connection without tearing the rubber hose.';
  }
  return 'Use 4-6 perimeter walls for maximum structural strength. Align layer direction perpendicular to pulling forces.';
}

function renderDynamicFields(
  type: PartType,
  params: any,
  onParamChange: (key: string, val: any) => void
) {
  switch (type) {
    case 'bolt':
      return (
        <>
          <div>
            <label className="block text-gray-300 mb-1 font-medium">Bolt Head Style</label>
            <select
              value={params.headType}
              onChange={(e) => onParamChange('headType', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded p-1.5"
            >
              <option value="hex">Hex Head Bolt</option>
              <option value="socket">Socket Head Cap Screw</option>
              <option value="flange">Flange Head Bolt</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Shaft Diameter (D):</span>
              <span className="font-mono text-amber-400">{params.diameter} mm</span>
            </div>
            <input
              type="range" min="3" max="24" step="0.5" value={params.diameter}
              onChange={(e) => onParamChange('diameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Thread Pitch (P):</span>
              <span className="font-mono text-sky-400">{params.pitch} mm</span>
            </div>
            <input
              type="range" min="0.4" max="3.0" step="0.1" value={params.pitch}
              onChange={(e) => onParamChange('pitch', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Shaft Length (L):</span>
              <span className="font-mono text-amber-400">{params.shaftLength} mm</span>
            </div>
            <input
              type="range" min="8" max="100" step="1" value={params.shaftLength}
              onChange={(e) => onParamChange('shaftLength', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Head Width (W):</span>
              <span className="font-mono text-gray-300">{params.headWidth} mm</span>
            </div>
            <input
              type="range" min="6" max="36" step="0.5" value={params.headWidth}
              onChange={(e) => onParamChange('headWidth', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chkWasher"
              checked={params.washerFace}
              onChange={(e) => onParamChange('washerFace', e.target.checked)}
              className="rounded accent-sky-500"
            />
            <label htmlFor="chkWasher" className="text-gray-300 cursor-pointer">
              Include Integrated Washer Face
            </label>
          </div>
        </>
      );

    case 'hoseBarb':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Inner Bore Diameter (ID):</span>
              <span className="font-mono text-amber-400">{params.innerDiameter} mm</span>
            </div>
            <input
              type="range" min="3" max="30" step="0.5" value={params.innerDiameter}
              onChange={(e) => onParamChange('innerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Base Outer Diameter (OD):</span>
              <span className="font-mono text-sky-400">{params.outerDiameter} mm</span>
            </div>
            <input
              type="range" min="6" max="40" step="0.5" value={params.outerDiameter}
              onChange={(e) => onParamChange('outerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Total Length (L):</span>
              <span className="font-mono text-gray-300">{params.length} mm</span>
            </div>
            <input
              type="range" min="20" max="90" step="1" value={params.length}
              onChange={(e) => onParamChange('length', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Barb Ridges Count:</span>
              <span className="font-mono text-amber-400">{params.barbCount}</span>
            </div>
            <input
              type="range" min="1" max="6" step="1" value={params.barbCount}
              onChange={(e) => onParamChange('barbCount', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chkHexGrip"
              checked={params.hexGrip}
              onChange={(e) => onParamChange('hexGrip', e.target.checked)}
              className="rounded accent-sky-500"
            />
            <label htmlFor="chkHexGrip" className="text-gray-300 cursor-pointer">
              Include Wrench Hex Grip Nut Center
            </label>
          </div>
        </>
      );

    case 'gasket':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Inner Bore Diameter:</span>
              <span className="font-mono text-amber-400">{params.innerDiameter} mm</span>
            </div>
            <input
              type="range" min="10" max="100" step="1" value={params.innerDiameter}
              onChange={(e) => onParamChange('innerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Outer Diameter:</span>
              <span className="font-mono text-sky-400">{params.outerDiameter} mm</span>
            </div>
            <input
              type="range" min="20" max="160" step="1" value={params.outerDiameter}
              onChange={(e) => onParamChange('outerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Gasket Thickness:</span>
              <span className="font-mono text-gray-300">{params.thickness} mm</span>
            </div>
            <input
              type="range" min="1" max="10" step="0.5" value={params.thickness}
              onChange={(e) => onParamChange('thickness', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Bolt Hole Count:</span>
              <span className="font-mono text-amber-400">{params.boltHoles} holes</span>
            </div>
            <input
              type="range" min="2" max="8" step="1" value={params.boltHoles}
              onChange={(e) => onParamChange('boltHoles', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Pitch Circle Diameter (PCD):</span>
              <span className="font-mono text-sky-400">{params.pcd} mm</span>
            </div>
            <input
              type="range" min="15" max="140" step="1" value={params.pcd}
              onChange={(e) => onParamChange('pcd', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </>
      );

    case 'knob':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Knob Body Diameter:</span>
              <span className="font-mono text-amber-400">{params.diameter} mm</span>
            </div>
            <input
              type="range" min="12" max="50" step="1" value={params.diameter}
              onChange={(e) => onParamChange('diameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Knob Height:</span>
              <span className="font-mono text-sky-400">{params.height} mm</span>
            </div>
            <input
              type="range" min="10" max="40" step="1" value={params.height}
              onChange={(e) => onParamChange('height', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 font-medium">Mounting Shaft Style</label>
            <select
              value={params.shaftType}
              onChange={(e) => onParamChange('shaftType', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded p-1.5"
            >
              <option value="d-shaft">D-Shaft (Flattened Side)</option>
              <option value="round">Round Press Fit</option>
              <option value="knurled">Spline Knurled Shaft</option>
            </select>
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Grip Ribs Count:</span>
              <span className="font-mono text-amber-400">{params.gripRibs} ribs</span>
            </div>
            <input
              type="range" min="0" max="24" step="2" value={params.gripRibs}
              onChange={(e) => onParamChange('gripRibs', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chkIndicator"
              checked={params.indicatorDot}
              onChange={(e) => onParamChange('indicatorDot', e.target.checked)}
              className="rounded accent-sky-500"
            />
            <label htmlFor="chkIndicator" className="text-gray-300 cursor-pointer">
              Include Top Pointer Line
            </label>
          </div>
        </>
      );

    case 'bracket':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Base Arm Length:</span>
              <span className="font-mono text-amber-400">{params.length} mm</span>
            </div>
            <input
              type="range" min="15" max="100" step="1" value={params.length}
              onChange={(e) => onParamChange('length', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Bracket Width:</span>
              <span className="font-mono text-sky-400">{params.width} mm</span>
            </div>
            <input
              type="range" min="10" max="60" step="1" value={params.width}
              onChange={(e) => onParamChange('width', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Vertical Arm Height:</span>
              <span className="font-mono text-gray-300">{params.height} mm</span>
            </div>
            <input
              type="range" min="15" max="100" step="1" value={params.height}
              onChange={(e) => onParamChange('height', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Wall Thickness:</span>
              <span className="font-mono text-amber-400">{params.thickness} mm</span>
            </div>
            <input
              type="range" min="2" max="10" step="0.5" value={params.thickness}
              onChange={(e) => onParamChange('thickness', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chkGusset"
              checked={params.gusset}
              onChange={(e) => onParamChange('gusset', e.target.checked)}
              className="rounded accent-sky-500"
            />
            <label htmlFor="chkGusset" className="text-gray-300 cursor-pointer">
              Add Diagonal Gusset Reinforcer
            </label>
          </div>
        </>
      );

    case 'bushing':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Inner Hole Diameter (ID):</span>
              <span className="font-mono text-amber-400">{params.innerDiameter} mm</span>
            </div>
            <input
              type="range" min="4" max="40" step="0.5" value={params.innerDiameter}
              onChange={(e) => onParamChange('innerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Outer Sleeve Diameter (OD):</span>
              <span className="font-mono text-sky-400">{params.outerDiameter} mm</span>
            </div>
            <input
              type="range" min="8" max="60" step="0.5" value={params.outerDiameter}
              onChange={(e) => onParamChange('outerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Bushing Height:</span>
              <span className="font-mono text-gray-300">{params.length} mm</span>
            </div>
            <input
              type="range" min="8" max="80" step="1" value={params.length}
              onChange={(e) => onParamChange('length', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Flange Step Diameter:</span>
              <span className="font-mono text-amber-400">{params.flangeDiameter} mm</span>
            </div>
            <input
              type="range" min={params.outerDiameter} max="80" step="1" value={params.flangeDiameter}
              onChange={(e) => onParamChange('flangeDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </>
      );

    case 'oring':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Washer Inner Diameter:</span>
              <span className="font-mono text-amber-400">{params.innerDiameter} mm</span>
            </div>
            <input
              type="range" min="5" max="60" step="0.5" value={params.innerDiameter}
              onChange={(e) => onParamChange('innerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Washer Outer Diameter:</span>
              <span className="font-mono text-sky-400">{params.outerDiameter} mm</span>
            </div>
            <input
              type="range" min="10" max="90" step="0.5" value={params.outerDiameter}
              onChange={(e) => onParamChange('outerDiameter', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Groove Depth:</span>
              <span className="font-mono text-amber-400">{params.grooveDepth} mm</span>
            </div>
            <input
              type="range" min="0.5" max="4.0" step="0.25" value={params.grooveDepth}
              onChange={(e) => onParamChange('grooveDepth', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </>
      );

    case 'connector':
      return (
        <>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Total Pins Count:</span>
              <span className="font-mono text-amber-400">{params.pinCount} pins</span>
            </div>
            <input
              type="range" min="2" max="16" step="1" value={params.pinCount}
              onChange={(e) => onParamChange('pinCount', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div>
            <div className="flex justify-between text-gray-300 mb-1">
              <span>Rows Count:</span>
              <span className="font-mono text-sky-400">{params.rows} row(s)</span>
            </div>
            <input
              type="range" min="1" max="2" step="1" value={params.rows}
              onChange={(e) => onParamChange('rows', parseInt(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chkLatch"
              checked={params.latchClip}
              onChange={(e) => onParamChange('latchClip', e.target.checked)}
              className="rounded accent-sky-500"
            />
            <label htmlFor="chkLatch" className="text-gray-300 cursor-pointer">
              Include Top Locking Clip
            </label>
          </div>
        </>
      );
  }
}
