import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types';
import { PRESET_CHARACTERS } from '../utils/pixelSprites';
import { processCustomImage, drawCharacter } from '../utils/characterRenderer';
import { sound } from '../utils/audio';
import { Upload, X, Check, Trash2, Sparkles, Image as ImageIcon, Sliders, RefreshCw } from 'lucide-react';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacter: Character;
  onSelectCharacter: (char: Character) => void;
  customCharacters: Character[];
  onSaveCustomCharacter: (char: Character) => void;
  onDeleteCustomCharacter: (id: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  selectedCharacter,
  onSelectCharacter,
  customCharacters,
  onSaveCustomCharacter,
  onDeleteCustomCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'upload'>('presets');

  // Uploaded image state
  const [uploadedRawUrl, setUploadedRawUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [charName, setCharName] = useState<string>('Custom Runner');
  const [pixelate, setPixelate] = useState<boolean>(true);
  const [removeBg, setRemoveBg] = useState<boolean>(true);
  const [bgTolerance, setBgTolerance] = useState<number>(45);
  const [scale, setScale] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Preview canvas ref
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live animation preview for upload
  const [previewState, setPreviewState] = useState<'running' | 'ducking' | 'jumping'>('running');

  // Process custom image when settings change
  useEffect(() => {
    if (!uploadedRawUrl) {
      setProcessedUrl(null);
      return;
    }

    let isCancelled = false;
    setIsProcessing(true);

    processCustomImage(uploadedRawUrl, {
      pixelate,
      removeBg,
      bgTolerance,
    }).then((url) => {
      if (!isCancelled) {
        setProcessedUrl(url);
        setIsProcessing(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [uploadedRawUrl, pixelate, removeBg, bgTolerance]);

  // Preview canvas animation loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let lastSwitch = performance.now();

    const charToPreview: Character =
      activeTab === 'upload' && processedUrl
        ? {
            id: 'preview',
            name: charName,
            type: 'custom',
            description: 'Custom preview',
            customImageUrl: processedUrl,
            scale,
            pixelate,
          }
        : selectedCharacter;

    const renderPreview = (time: number) => {
      if (time - lastSwitch > 150) {
        frame = frame === 0 ? 1 : 0;
        lastSwitch = time;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw mini ground
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 90);
      ctx.lineTo(canvas.width, 90);
      ctx.stroke();

      // Mini rocks
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(20, 93, 3, 2);
      ctx.fillRect(80, 94, 5, 2);
      ctx.fillRect(150, 92, 4, 2);

      // Draw character
      const posX = 75;
      const posY = previewState === 'jumping' ? 30 : 90 - 47 * scale;

      drawCharacter(
        ctx,
        charToPreview,
        posX,
        posY,
        previewState,
        frame,
        '#374151'
      );

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, processedUrl, charName, scale, pixelate, selectedCharacter, previewState]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setUploadedRawUrl(dataUrl);
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').slice(0, 15);
      setCharName(fileNameWithoutExt || 'My Runner');
      sound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        setUploadedRawUrl(dataUrl);
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').slice(0, 15);
        setCharName(fileNameWithoutExt || 'My Runner');
        sound.playClick();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndUse = () => {
    if (!processedUrl) return;

    const newChar: Character = {
      id: `custom_${Date.now()}`,
      name: charName.trim() || 'Custom Runner',
      type: 'custom',
      description: 'Custom player-created character',
      customImageUrl: processedUrl,
      pixelate,
      removeBg,
      bgTolerance,
      scale,
    };

    onSaveCustomCharacter(newChar);
    onSelectCharacter(newChar);
    sound.playScore();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202124] border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-gray-800 dark:text-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold font-mono tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              CHOOSE YOUR RUNNER
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
              Select an iconic retro character or upload your own image!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 pt-3 bg-gray-50 dark:bg-[#1a1b1e]">
          <button
            onClick={() => {
              setActiveTab('presets');
              sound.playClick();
            }}
            className={`pb-3 px-4 font-mono text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Presets & Saved ({PRESET_CHARACTERS.length + customCharacters.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              sound.playClick();
            }}
            className={`pb-3 px-4 font-mono text-xs font-semibold cursor-pointer border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Custom Character
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'presets' ? (
            <div className="space-y-6">
              {/* Preset Characters */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Default Characters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PRESET_CHARACTERS.map((char) => {
                    const isSelected = selectedCharacter.id === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          onSelectCharacter(char);
                          sound.playClick();
                        }}
                        className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-gray-900 dark:border-white bg-gray-100/80 dark:bg-neutral-800 ring-2 ring-gray-900/10 dark:ring-white/10'
                            : 'border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div>
                            <span className="font-mono text-sm font-bold block">
                              {char.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {char.description}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="p-1 rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Custom Uploaded Characters */}
              {customCharacters.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                    Your Uploaded Characters
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {customCharacters.map((char) => {
                      const isSelected = selectedCharacter.id === char.id;
                      return (
                        <div
                          key={char.id}
                          className={`relative group p-3 rounded-lg border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-gray-900 dark:border-white bg-gray-100/80 dark:bg-neutral-800 ring-2 ring-gray-900/10 dark:ring-white/10'
                              : 'border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectCharacter(char);
                              sound.playClick();
                            }}
                            className="text-left w-full cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {char.customImageUrl && (
                                <img
                                  src={char.customImageUrl}
                                  alt={char.name}
                                  className="w-10 h-10 object-contain rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 p-0.5"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="font-mono text-sm font-bold truncate block">
                                  {char.name}
                                </span>
                                <span className="text-[11px] text-gray-500 font-mono">
                                  Custom Upload
                                </span>
                              </div>
                              {isSelected && (
                                <span className="p-1 rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Delete custom character button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomCharacter(char.id);
                              sound.playClick();
                            }}
                            className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-opacity cursor-pointer"
                            title="Delete character"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload Custom Image Tab */
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              {!uploadedRawUrl ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-neutral-900/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-mono text-sm font-bold mb-1">
                    Click to upload or drag & drop image
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, SVG, WebP, GIF (transparent PNGs or photos work great!)
                  </p>
                </div>
              ) : (
                /* Customization & Preview Workspace */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Left: Customization Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Character Name
                      </label>
                      <input
                        type="text"
                        value={charName}
                        onChange={(e) => setCharName(e.target.value)}
                        placeholder="E.g., Super Doge"
                        maxLength={20}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                      />
                    </div>

                    {/* Pixelate Filter Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
                      <div>
                        <span className="font-mono text-xs font-bold block">
                          8-Bit Pixelate Filter
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Transforms photo into authentic retro pixel art
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={pixelate}
                        onChange={(e) => setPixelate(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </div>

                    {/* Background Transparency Toggle */}
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold block">
                            Auto Transparent Background
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Removes white or solid background
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={removeBg}
                          onChange={(e) => setRemoveBg(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                      </div>

                      {removeBg && (
                        <div className="pt-2 border-t border-gray-200 dark:border-neutral-800">
                          <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
                            <span>Tolerance:</span>
                            <span>{bgTolerance}</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="90"
                            value={bgTolerance}
                            onChange={(e) => setBgTolerance(parseInt(e.target.value, 10))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Scale Adjustment */}
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
                      <div className="flex justify-between text-[11px] font-mono text-gray-500 mb-1">
                        <span className="font-bold">Sprite Scale:</span>
                        <span>{scale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.7"
                        max="1.4"
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Change Image Button */}
                    <button
                      onClick={() => {
                        setUploadedRawUrl(null);
                        setProcessedUrl(null);
                      }}
                      className="text-xs font-mono text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer underline"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Upload a different image
                    </button>
                  </div>

                  {/* Right: Live Interactive Simulation Preview */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Live Running Simulation
                    </span>

                    <div className="w-full h-[120px] bg-[#f7f7f7] border border-gray-300 dark:border-neutral-700 rounded overflow-hidden flex items-center justify-center relative">
                      <canvas
                        ref={previewCanvasRef}
                        width={200}
                        height={110}
                        className="block select-none"
                        style={{ imageRendering: 'pixelated' }}
                      />

                      {isProcessing && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center text-xs font-mono">
                          Processing filters...
                        </div>
                      )}
                    </div>

                    {/* Preview action state buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setPreviewState('running')}
                        className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                          previewState === 'running'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Run
                      </button>
                      <button
                        onClick={() => setPreviewState('jumping')}
                        className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                          previewState === 'jumping'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Jump
                      </button>
                      <button
                        onClick={() => setPreviewState('ducking')}
                        className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                          previewState === 'ducking'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Duck (Squish)
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-400 text-center font-mono mt-3">
                      When ducking, the custom sprite smoothly crouches to dodge low flying pterodactyls!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1b1e]">
          <button
            onClick={onClose}
            className="px-4 py-2 font-mono text-xs rounded border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'upload' && uploadedRawUrl && (
            <button
              onClick={handleSaveAndUse}
              disabled={isProcessing}
              className="px-5 py-2 font-mono text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Save & Play With This Character
            </button>
          )}

          {activeTab === 'presets' && (
            <button
              onClick={onClose}
              className="px-5 py-2 font-mono text-xs font-bold rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 active:scale-95 shadow-xs cursor-pointer"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
