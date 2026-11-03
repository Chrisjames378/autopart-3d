import React, { useEffect, useRef, useState } from 'react';
import { GarageVehicle } from '../types/cad';

interface AIPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVehicle: GarageVehicle | null;
  onApplyPreset: (aiResult: any) => void;
}

export const AIPresetModal: React.FC<AIPresetModalProps> = ({
  isOpen,
  onClose,
  activeVehicle,
  onApplyPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'camera'>('camera');
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Camera & Image State
  const [cameraActive, setCameraActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error(err);
      setError('Could not access device camera. You can upload a photo file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/preset-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
          userNotes: promptText,
          vehicleInfo: activeVehicle
            ? { name: activeVehicle.name, engine: activeVehicle.engine }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze part photo');
      }

      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI Vision model.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateText = async (queryText?: string) => {
    const textToSend = queryText || promptText;
    if (!textToSend.trim()) return;

    setLoading(true);
    setError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          vehicleInfo: activeVehicle
            ? { name: activeVehicle.name, engine: activeVehicle.engine }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate vehicle preset');
      }

      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while contacting AI Assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!aiResult) return;
    onApplyPreset(aiResult);
    onClose();
  };

  const quickPrompts = [
    'Vacuum line hose barb adapter for 10mm ID tube in high heat engine bay',
    'M8 x 1.25mm hex head bolt for fender mounting with integrated washer',
    'Dash HVAC climate control knob with 6mm D-shaft and knurled grip',
    'Exhaust flange 2-bolt gasket with 50mm PCD for high temperature',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-100">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 text-amber-400 p-2.5 rounded-xl border border-amber-500/30">
              <i className="fa-solid fa-camera text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                Visual Part Scanner & AI Specialist
              </h2>
              <p className="text-xs text-gray-400">
                Snap a photo of a broken part or describe it to auto-build 3D CAD models
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-gray-400 hover:text-white text-lg p-1"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-900/60 px-6">
          <button
            onClick={() => {
              setActiveTab('camera');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'camera'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fa-solid fa-camera"></i>
            <span>Photo / Camera Scan</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('text');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'text'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>Text Description Prompt</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {activeVehicle && (
            <div className="bg-amber-950/30 border border-amber-800/60 p-2.5 rounded-lg text-xs text-amber-300 flex items-center gap-2">
              <i className="fa-solid fa-car"></i>
              <span>
                Active Context Vehicle: <strong>{activeVehicle.name}</strong> ({activeVehicle.engine})
              </span>
            </div>
          )}

          {/* TAB 1: CAMERA & PHOTO SCAN */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Image Preview or Video Stream */}
              <div className="relative bg-gray-900 border border-gray-700 rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center">
                {imagePreview ? (
                  <div className="relative w-full h-full max-h-72 flex items-center justify-center p-2 bg-black">
                    <img
                      src={imagePreview}
                      alt="Part Preview"
                      className="max-h-64 rounded-lg object-contain"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow"
                    >
                      <i className="fa-solid fa-rotate-left"></i> Clear / Retake
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="relative w-full flex flex-col items-center bg-black">
                    <video
                      ref={videoRef}
                      className="w-full max-h-64 object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute bottom-3 flex gap-3">
                      <button
                        onClick={capturePhoto}
                        className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-2"
                      >
                        <i className="fa-solid fa-circle-dot text-red-600"></i>
                        <span>Snap Photo Now</span>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-2 rounded-xl"
                      >
                        Cancel Camera
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <i className="fa-solid fa-camera-retro text-gray-600 text-4xl mb-1"></i>
                    <p className="text-xs text-gray-300 font-medium">
                      Take a photo of your part or upload an image file
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={startCamera}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow"
                      >
                        <i className="fa-solid fa-video"></i> Start Device Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
                      >
                        <i className="fa-solid fa-upload"></i> Upload Part Image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional notes for image */}
              <div>
                <label className="block text-[11px] text-gray-300 mb-1">
                  Optional Part Notes (e.g., "Inner diameter is roughly 12mm"):
                </label>
                <input
                  type="text"
                  placeholder="Add any extra dimensions or target material notes..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              {/* Trigger Button */}
              {imagePreview && (
                <button
                  onClick={handleAnalyzeImage}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white font-bold text-xs py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Visually Inspecting Part with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-microscope"></i>
                      <span>Analyze Photo & Auto-Generate 3D CAD Model</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: TEXT PROMPT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Quick Preset Examples
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPromptText(p);
                        handleGenerateText(p);
                      }}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-amber-400 text-[11px] px-3 py-1.5 rounded-lg transition text-left"
                    >
                      <i className="fa-solid fa-bolt text-amber-400 mr-1.5"></i>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-300">
                  Describe Replacement Part Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., I need a coolant hose barb adapter to connect a 12mm hose to a 16mm port on my radiator, with a hex nut in the middle for wrench tightening..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => handleGenerateText()}
                  disabled={loading || !promptText.trim()}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      <span>Analyzing Engineering Specs...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Generate CAD Parameters with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-950/40 border border-red-800 p-3 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* AI Result Card */}
          {aiResult && (
            <div className="bg-gray-900 border border-amber-500/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                <div>
                  <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <i className="fa-solid fa-circle-check text-emerald-400"></i>{' '}
                    {aiResult.partName || 'Recommended CAD Model'}
                  </h3>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Target CAD Part:{' '}
                    <span className="font-mono text-sky-400 font-bold uppercase">
                      {aiResult.partType}
                    </span>
                  </div>
                </div>
                <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono px-2 py-0.5 rounded">
                  Filament: {(aiResult.filamentMaterial || 'petg').toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700/60">
                <div className="text-[11px] font-semibold text-gray-300 mb-1">
                  AI Engineering Analysis & Rationale:
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {aiResult.rationale}
                </p>
              </div>

              {/* Param Summary Grid */}
              <div className="bg-gray-800/40 p-2.5 rounded-lg border border-gray-800">
                <div className="text-[10px] font-mono text-gray-400 mb-1.5 uppercase font-semibold">
                  Detected CAD Dimensions:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-gray-300">
                  {Object.entries(aiResult.params || {}).map(([key, val]) => (
                    <div key={key} className="bg-gray-900 px-2 py-1 rounded">
                      <span className="text-gray-400 text-[10px] block capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-sky-300 font-bold">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                      </span>
                    </div>
                  ))}
                  {aiResult.toleranceOffset !== undefined && (
                    <div className="bg-gray-900 px-2 py-1 rounded">
                      <span className="text-gray-400 text-[10px] block">Tolerance Fit</span>
                      <span className="text-amber-400 font-bold">
                        +{aiResult.toleranceOffset} mm
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Apply Action Button */}
              <button
                onClick={handleApply}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-cube"></i>
                <span>Apply Parameters to 3D Viewport</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
