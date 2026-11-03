import React from 'react';
import { GarageVehicle } from '../types/cad';

interface HeaderProps {
  activeVehicle: GarageVehicle | null;
  onOpenGarage: () => void;
  onToggleSlicer: () => void;
  isSlicerOpen: boolean;
  onOpenAI: () => void;
  onExportSTL: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeVehicle,
  onOpenGarage,
  onToggleSlicer,
  isSlicerOpen,
  onOpenAI,
  onExportSTL,
}) => {
  return (
    <header className="bg-gray-800/90 backdrop-blur border-b border-gray-700 px-4 py-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3">
      {/* Brand & Subtitle */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-sky-500 to-amber-500 p-2 rounded-lg text-white shadow-lg">
          <i className="fa-solid fa-wrench text-xl"></i>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-amber-400 flex items-center">
            AutoPart 3D{' '}
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 ml-2 font-mono">
              v3.0 PRO CAD
            </span>
          </h1>
          <p className="text-xs text-gray-400">
            Custom Vehicle Parts, Threads, Barb Fittings & Brackets for 3D Printing
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onOpenGarage}
          className="bg-gray-700 hover:bg-gray-600 text-amber-400 text-xs font-medium px-3 py-2 rounded-lg shadow flex items-center gap-2 transition border border-gray-600"
        >
          <i className="fa-solid fa-car"></i>
          <span>
            {activeVehicle ? activeVehicle.name : 'My Garage & Vault'}
          </span>
        </button>

        <button
          onClick={onToggleSlicer}
          className={`text-xs font-medium px-3 py-2 rounded-lg shadow flex items-center gap-2 transition border ${
            isSlicerOpen
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-gray-700 hover:bg-gray-600 text-sky-400 border-gray-600'
          }`}
        >
          <i className="fa-solid fa-layer-group"></i>
          <span>Slicer & Infill</span>
        </button>

        <button
          onClick={onOpenAI}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow flex items-center gap-2 transition"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <span>Vehicle Preset AI</span>
        </button>

        <button
          onClick={onExportSTL}
          className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2 transition border border-sky-400"
        >
          <i className="fa-solid fa-download"></i>
          <span>Export 3D Printable STL</span>
        </button>
      </div>
    </header>
  );
};
