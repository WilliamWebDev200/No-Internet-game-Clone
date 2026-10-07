import React from 'react';
import { GameStats } from '../types';
import { X, Trophy, Flame, Play, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { sound } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202124] border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-gray-800 dark:text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold font-mono tracking-tight">
              GAME STATISTICS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
              <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" /> High Score
              </span>
              <span className="text-xl font-bold block mt-1">
                {String(stats.highScore).padStart(5, '0')}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
              <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
                <Play className="w-3 h-3 text-blue-500" /> Games Played
              </span>
              <span className="text-xl font-bold block mt-1">
                {stats.totalGames}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
              <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-emerald-500" /> Total Jumps
              </span>
              <span className="text-xl font-bold block mt-1">
                {stats.totalJumps}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
              <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-purple-500" /> Total Ducks
              </span>
              <span className="text-xl font-bold block mt-1">
                {stats.totalDucks}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 col-span-2">
              <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Obstacles Blasted (3 Bullets Power)
              </span>
              <span className="text-xl font-bold block mt-1 text-amber-600 dark:text-amber-400">
                {stats.obstaclesDestroyed || 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
            <span className="text-[11px] text-gray-500 uppercase flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500" /> Controls Guide
            </span>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mt-2">
              <li><strong className="text-gray-900 dark:text-white">Jump:</strong> Spacebar, Up Arrow (↑), or W</li>
              <li><strong className="text-gray-900 dark:text-white">Duck:</strong> Down Arrow (↓) or S</li>
              <li><strong className="text-amber-600 dark:text-amber-400">Shoot (3 Bullets):</strong> F, Z, Shift, or [SHOOT] button</li>
              <li><strong className="text-gray-900 dark:text-white">Pause:</strong> P or Escape</li>
              <li><strong className="text-gray-900 dark:text-white">Mobile:</strong> Touch buttons for JUMP, DUCK & SHOOT</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1b1e]">
          <button
            onClick={() => {
              if (window.confirm('Reset your high score and all stats?')) {
                onResetStats();
                sound.playClick();
              }
            }}
            className="text-xs font-mono text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset High Score
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 font-mono text-xs font-bold rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
