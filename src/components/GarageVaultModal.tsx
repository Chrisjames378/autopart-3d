import React, { useState } from 'react';
import { GarageVehicle, VaultPart } from '../types/cad';

interface GarageVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: GarageVehicle[];
  activeVehicleId: string;
  onSelectVehicle: (id: string) => void;
  onAddVehicle: (name: string, engine: string) => void;
  vaultParts: VaultPart[];
  onLoadPart: (part: VaultPart) => void;
  onDeletePart: (partId: string) => void;
}

export const GarageVaultModal: React.FC<GarageVaultModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  activeVehicleId,
  onSelectVehicle,
  onAddVehicle,
  vaultParts,
  onLoadPart,
  onDeletePart,
}) => {
  const [showAddVehForm, setShowAddVehForm] = useState(false);
  const [newVehName, setNewVehName] = useState('');
  const [newVehEngine, setNewVehEngine] = useState('');

  if (!isOpen) return null;

  const filteredParts = vaultParts.filter((p) => p.vehicleId === activeVehicleId);
  const currentVehicle = vehicles.find((v) => v.id === activeVehicleId);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehName.trim()) return;
    onAddVehicle(newVehName.trim(), newVehEngine.trim() || 'Standard Specs');
    setNewVehName('');
    setNewVehEngine('');
    setShowAddVehForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-100">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg border border-amber-500/30">
              <i className="fa-solid fa-garage text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                Multi-Vehicle Garage & Cloud Vault
              </h2>
              <p className="text-xs text-gray-400">
                Save custom CAD part presets organized by vehicle model and specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Section 1: My Vehicle Fleet */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-car-side"></i> My Vehicle Fleet
              </h3>
              <button
                onClick={() => setShowAddVehForm((prev) => !prev)}
                className="bg-amber-600/80 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
              >
                <i className={`fa-solid ${showAddVehForm ? 'fa-minus' : 'fa-plus'}`}></i>{' '}
                {showAddVehForm ? 'Cancel' : 'Add Vehicle'}
              </button>
            </div>

            {/* Add Vehicle Inline Form */}
            {showAddVehForm && (
              <form
                onSubmit={handleAddSubmit}
                className="bg-gray-900 border border-amber-500/40 p-4 rounded-xl mb-4 space-y-3"
              >
                <h4 className="text-xs font-bold text-amber-400">
                  Add New Vehicle to Garage
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">
                      Vehicle Year, Make & Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2022 Nissan Navara PRO-4X"
                      value={newVehName}
                      onChange={(e) => setNewVehName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-xs text-white p-2 rounded outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">
                      Engine / Trim Specs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2.3L Twin Turbo Diesel"
                      value={newVehEngine}
                      onChange={(e) => setNewVehEngine(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-xs text-white p-2 rounded outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs px-4 py-1.5 rounded"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            )}

            {/* Fleet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vehicles.map((v) => {
                const isActive = v.id === activeVehicleId;
                const count = vaultParts.filter((p) => p.vehicleId === v.id).length;
                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={isActive ? 'text-amber-400 text-xl' : 'text-gray-400 text-xl'}>
                        <i className={`fa-solid ${v.icon || 'fa-car'}`}></i>
                      </div>
                      <div>
                        <div className="font-bold text-xs">{v.name}</div>
                        <div className="text-[10px] text-gray-400">{v.engine}</div>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {count} Parts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Saved Parts Library */}
          <div className="border-t border-gray-700/80 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-vault"></i> Saved 3D Part Presets
                </h3>
                <p className="text-xs text-gray-400">
                  CAD files saved for {currentVehicle ? currentVehicle.name : 'active vehicle'}
                </p>
              </div>
              <span className="bg-sky-950 text-sky-400 border border-sky-800 text-xs font-mono px-2.5 py-1 rounded-full">
                {filteredParts.length} Saved Parts
              </span>
            </div>

            {filteredParts.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/40 border border-dashed border-gray-700 rounded-xl p-4">
                <i className="fa-solid fa-folder-open text-gray-600 text-3xl mb-2"></i>
                <p className="text-xs text-gray-400">
                  No saved CAD models for this vehicle yet.
                </p>
                <p className="text-[10px] text-amber-400 mt-1">
                  Configure parameters in the sidebar and click "Save to Vault".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredParts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-sky-500/60 transition"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                          <i className="fa-solid fa-cubes"></i> {p.name}
                        </h4>
                        <span className="text-[9px] font-mono bg-gray-900 px-2 py-0.5 rounded text-gray-400 uppercase">
                          {p.partType}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1.5 line-clamp-2">
                        {p.notes}
                      </p>
                      <div className="text-[10px] font-mono text-gray-400 mt-2 flex justify-between">
                        <span>Material: {p.filamentMaterial.toUpperCase()}</span>
                        <span>Saved: {p.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700/60">
                      <button
                        onClick={() => {
                          onLoadPart(p);
                          onClose();
                        }}
                        className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-[11px] py-1.5 rounded font-semibold transition flex items-center justify-center gap-1 shadow"
                      >
                        <i className="fa-solid fa-file-import"></i> Load Model
                      </button>
                      <button
                        onClick={() => onDeletePart(p.id)}
                        className="bg-gray-700 hover:bg-red-900/60 text-gray-300 hover:text-red-400 px-2.5 py-1.5 rounded transition"
                        title="Delete Part"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
