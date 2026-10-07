import React, { useState, useEffect } from 'react';
import { Character, GameStats } from '../types';
import { PRESET_CHARACTERS } from '../utils/pixelSprites';
import { DinoGame } from './DinoGame';
import { CharacterModal } from './CharacterModal';
import { StatsModal } from './StatsModal';
import {
  Globe,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Star,
  Settings,
  Trophy,
  Moon,
  Sun,
  Laptop,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';

export const ChromeOfflinePage: React.FC = () => {
  // Active character
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(() => {
    const saved = localStorage.getItem('dino_selected_character');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return PRESET_CHARACTERS[0];
      }
    }
    return PRESET_CHARACTERS[0];
  });

  // Custom user characters
  const [customCharacters, setCustomCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem('dino_custom_characters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Modals state
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Settings
  const [viewMode, setViewMode] = useState<'chrome' | 'arcade'>('chrome');
  const [themeMode, setThemeMode] = useState<'auto' | 'day' | 'night'>('auto');
  const [speedModifier, setSpeedModifier] = useState<'normal' | 'fast' | 'moon'>('normal');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stats
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('dino_game_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default
      }
    }
    const hi = localStorage.getItem('dino_high_score');
    return {
      highScore: hi ? parseInt(hi, 10) : 0,
      totalGames: 0,
      totalJumps: 0,
      totalDucks: 0,
      longestRunTime: 0,
      characterUsage: {},
    };
  });

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Save selected character to localStorage
  useEffect(() => {
    localStorage.setItem('dino_selected_character', JSON.stringify(selectedCharacter));
  }, [selectedCharacter]);

  // Save custom characters to localStorage
  useEffect(() => {
    localStorage.setItem('dino_custom_characters', JSON.stringify(customCharacters));
  }, [customCharacters]);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('dino_game_stats', JSON.stringify(stats));
  }, [stats]);

  const handleStatsUpdate = (score: number, jumped: boolean, ducked: boolean, blasted?: boolean) => {
    setStats((prev) => {
      const newHighScore = Math.max(prev.highScore, score);
      return {
        ...prev,
        highScore: newHighScore,
        totalJumps: jumped ? prev.totalJumps + 1 : prev.totalJumps,
        totalDucks: ducked ? prev.totalDucks + 1 : prev.totalDucks,
        obstaclesDestroyed: blasted ? (prev.obstaclesDestroyed || 0) + 1 : (prev.obstaclesDestroyed || 0),
      };
    });
  };

  const handleSaveCustomCharacter = (char: Character) => {
    setCustomCharacters((prev) => [char, ...prev]);
  };

  const handleDeleteCustomCharacter = (id: string) => {
    setCustomCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedCharacter.id === id) {
      setSelectedCharacter(PRESET_CHARACTERS[0]);
    }
  };

  const handleResetStats = () => {
    const emptyStats: GameStats = {
      highScore: 0,
      totalGames: 0,
      totalJumps: 0,
      totalDucks: 0,
      longestRunTime: 0,
      characterUsage: {},
    };
    setStats(emptyStats);
    localStorage.removeItem('dino_high_score');
    localStorage.setItem('dino_game_stats', JSON.stringify(emptyStats));
  };

  const toggleTheme = () => {
    sound.playClick();
    if (themeMode === 'auto') setThemeMode('night');
    else if (themeMode === 'night') setThemeMode('day');
    else setThemeMode('auto');
  };

  const isDarkMode = themeMode === 'night';

  return (
    <div
      className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
        isDarkMode ? 'dark bg-[#202124] text-[#e8eaed]' : 'bg-[#f7f7f7] text-[#535353]'
      }`}
    >
      {/* Top Application Navigation & Configuration Bar */}
      <header className="w-full bg-white dark:bg-[#292a2d] border-b border-gray-200 dark:border-neutral-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          {/* Dino Badge */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">🦖</span> CHROME DINO RUNNER
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              Custom Character Edition
            </span>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Character Chooser Button */}
          <button
            onClick={() => {
              setIsCharModalOpen(true);
              sound.playClick();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-neutral-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Character: <span className="underline decoration-emerald-500">{selectedCharacter.name}</span></span>
          </button>

          {/* Difficulty / Physics Mode */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-neutral-800 rounded-md p-0.5 border border-gray-300 dark:border-neutral-700 font-mono text-[11px]">
            <button
              onClick={() => {
                setSpeedModifier('normal');
                sound.playClick();
              }}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                speedModifier === 'normal'
                  ? 'bg-white dark:bg-neutral-700 font-bold text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Classic 1x
            </button>
            <button
              onClick={() => {
                setSpeedModifier('fast');
                sound.playClick();
              }}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                speedModifier === 'fast'
                  ? 'bg-white dark:bg-neutral-700 font-bold text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Fast ⚡
            </button>
            <button
              onClick={() => {
                setSpeedModifier('moon');
                sound.playClick();
              }}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                speedModifier === 'moon'
                  ? 'bg-white dark:bg-neutral-700 font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Moon 🌙
            </button>
          </div>

          {/* Maximize / True Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer font-mono text-xs font-medium"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize to Fullscreen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-emerald-500" />
                <span className="hidden md:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-emerald-500" />
                <span className="hidden md:inline">Maximize Screen</span>
              </>
            )}
          </button>

          {/* View mode toggle */}
          <button
            onClick={() => {
              setViewMode(viewMode === 'chrome' ? 'arcade' : 'chrome');
              sound.playClick();
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title={viewMode === 'chrome' ? 'Switch to Arcade View' : 'Switch to Chrome Offline View'}
          >
            {viewMode === 'chrome' ? <Laptop className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
          </button>

          {/* Stats Button */}
          <button
            onClick={() => {
              setIsStatsModalOpen(true);
              sound.playClick();
            }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="View statistics"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
          </button>

          {/* Day / Night Theme Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title={`Current theme: ${themeMode} (Click to toggle)`}
          >
            {themeMode === 'night' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : themeMode === 'day' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <span className="text-xs font-mono font-bold">Auto</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container Area - Maximized Full Width */}
      <main className="flex-1 flex flex-col w-full">
        {viewMode === 'chrome' ? (
          /* Authentic Full-Width Chrome Browser Window */
          <div className="w-full flex-1 flex flex-col bg-[#dee1e6] dark:bg-[#1f2023] transition-colors">
            
            {/* Full-Width Chrome Tab Bar */}
            <div className="flex items-center px-4 pt-2 gap-2 select-none w-full border-b border-gray-300/60 dark:border-neutral-800/80 bg-[#dee1e6] dark:bg-[#1a1b1e]">
              {/* Window action dots */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]"></span>
              </div>

              {/* Active Tab: "No internet" */}
              <div className="flex items-center gap-2 bg-[#f7f7f7] dark:bg-[#202124] text-gray-800 dark:text-gray-200 px-4 py-2 rounded-t-lg text-xs font-sans w-52 border-t border-l border-r border-gray-300/80 dark:border-neutral-700 shadow-2xs">
                <span className="text-base">🦖</span>
                <span className="truncate font-medium">No internet</span>
                <span className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ml-auto cursor-pointer">×</span>
              </div>

              {/* New Tab Plus */}
              <button
                onClick={() => sound.playClick()}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-300/60 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 text-sm cursor-pointer"
                title="New Tab"
              >
                +
              </button>
            </div>

            {/* Full-Width Chrome Omnibox / Address Bar */}
            <div className="bg-[#f7f7f7] dark:bg-[#202124] px-4 py-2 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-3 w-full">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => sound.playClick()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full cursor-pointer transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => sound.playClick()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full cursor-pointer transition-colors"
                  title="Forward"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => sound.playJump()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full cursor-pointer transition-colors"
                  title="Reload"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Address input */}
              <div className="flex-1 flex items-center gap-2.5 bg-[#ebedf0] dark:bg-[#28292d] px-4 py-1.5 rounded-full text-xs font-mono text-gray-700 dark:text-gray-300 border border-transparent focus-within:border-blue-500 transition-colors">
                <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">chrome://dino</span>
                <span className="text-gray-400 text-[11px] ml-auto hidden sm:inline">Offline runner</span>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <Star className="w-4 h-4 cursor-pointer hover:text-amber-500" />
              </div>
            </div>

            {/* Offline Error Page Viewport Content - Full Maximize */}
            <div className="bg-[#f7f7f7] dark:bg-[#202124] px-4 sm:px-10 md:px-16 py-8 flex-1 flex flex-col justify-between w-full transition-colors">
              
              {/* Dino Game Canvas - Full Width */}
              <div className="w-full mb-8">
                <DinoGame
                  character={selectedCharacter}
                  onOpenCharacterModal={() => setIsCharModalOpen(true)}
                  themeMode={themeMode}
                  onToggleTheme={toggleTheme}
                  speedModifier={speedModifier}
                  onStatsUpdate={handleStatsUpdate}
                />
              </div>

              {/* Authentic Google Chrome Error Text Block */}
              <div className="w-full max-w-2xl text-left select-text mt-2">
                <h1 className="text-3xl font-bold font-sans tracking-tight text-[#202124] dark:text-[#e8eaed] mb-4">
                  No internet
                </h1>

                <div className="text-sm font-sans text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed space-y-2 mb-6">
                  <p>Try:</p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Checking the network cables, modem, and router</li>
                    <li>Reconnecting to Wi-Fi</li>
                    <li>Running Windows Network Diagnostics or Network Assistant</li>
                  </ul>
                </div>

                <div className="text-xs font-mono text-[#70757a] dark:text-[#80868b] tracking-wide font-medium">
                  ERR_INTERNET_DISCONNECTED
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Pure Fullscreen Arcade Canvas Experience */
          <div className="w-full flex-1 flex flex-col px-4 sm:px-10 md:px-16 py-8 justify-between bg-[#f7f7f7] dark:bg-[#202124] transition-colors">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-mono font-bold tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <span>🕹️</span> T-REX RETRO RUNNER (FULLSCREEN)
              </h2>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                Avoid the cacti and flying pterodactyls. Jump or crouch to survive!
              </p>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center">
              <DinoGame
                character={selectedCharacter}
                onOpenCharacterModal={() => setIsCharModalOpen(true)}
                themeMode={themeMode}
                onToggleTheme={toggleTheme}
                speedModifier={speedModifier}
                onStatsUpdate={handleStatsUpdate}
              />
            </div>

            <div className="mt-8 text-center text-xs font-mono text-gray-400">
              Press Space to jump · Down Arrow to duck · P to pause
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full py-3 px-6 text-center text-xs font-mono text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-black/20">
        Chrome Dino Runner with Custom Image Character Support · Full Screen Edition
      </footer>

      {/* Character Selector & Image Upload Modal */}
      <CharacterModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={setSelectedCharacter}
        customCharacters={customCharacters}
        onSaveCustomCharacter={handleSaveCustomCharacter}
        onDeleteCustomCharacter={handleDeleteCustomCharacter}
      />

      {/* Statistics Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
      />
    </div>
  );
};

