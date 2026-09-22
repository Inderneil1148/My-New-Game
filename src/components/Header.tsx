import React from 'react';
import { Sparkles, Flame, Coins, Volume2, VolumeX, BookOpen, Trophy } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { soundEffects } from '../utils/audio';
import { calculateLevel } from '../utils/gameState';

interface HeaderProps {
  stats: PlayerStats;
  onOpenCodex: () => void;
  onGoHome: () => void;
  onOpenBadges: () => void;
}

export const Header: React.FC<HeaderProps> = ({ stats, onOpenCodex, onGoHome, onOpenBadges }) => {
  const [isMuted, setIsMuted] = React.useState(soundEffects.isMuted());
  const levelInfo = calculateLevel(stats.xp);
  const progressPercent = Math.min(100, Math.round((levelInfo.currentXp / levelInfo.nextLevelXp) * 100));

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playClick();
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-200 via-orange-200 to-rose-300 bg-clip-text text-transparent font-['Space_Grotesk']">
                NewsCade
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold tracking-wide">
                DAILY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              {todayStr} • Play, Learn & Level Up
            </p>
          </div>
        </button>

        {/* Stats & Controls Center */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Level & XP bar */}
          <button
            onClick={onOpenBadges}
            className="hidden md:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
            title={`Level ${levelInfo.level}: ${levelInfo.title} (${levelInfo.currentXp}/${levelInfo.nextLevelXp} XP)`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
              {levelInfo.level}
            </div>
            <div className="text-left w-24">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span className="truncate max-w-[65px] text-slate-300">{levelInfo.title}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </button>

          {/* Daily Streak */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-orange-500/30 px-2.5 py-1.5 rounded-xl text-orange-400 text-xs font-bold shadow-sm shadow-orange-500/10"
            title={`${stats.streak} day learning streak!`}
          >
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{stats.streak}d</span>
          </div>

          {/* Curiosity Coins */}
          <div
            className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-amber-300 text-xs font-bold"
            title={`${stats.coins} curiosity coins available`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{stats.coins}</span>
          </div>

          {/* Daily Codex Button */}
          <button
            onClick={onOpenCodex}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 transition-all cursor-pointer"
            title="Open Daily Learning Codex"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Codex</span>
            <span className="text-[10px] px-1 rounded-full bg-sky-500/20 text-sky-300 font-bold">
              {stats.codex.length}
            </span>
          </button>

          {/* Badges / Trophy */}
          <button
            onClick={onOpenBadges}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
            title="View Achievements & Badges"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
