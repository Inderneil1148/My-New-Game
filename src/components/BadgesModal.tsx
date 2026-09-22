import React from 'react';
import { X, Trophy, Award, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { AVAILABLE_BADGES, calculateLevel } from '../utils/gameState';
import { soundEffects } from '../utils/audio';

interface BadgesModalProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ stats, onClose }) => {
  const levelInfo = calculateLevel(stats.xp);

  const isBadgeUnlocked = (id: string) => {
    if (id === 'first_quiz' && stats.totalAnswered >= 1) return true;
    if (id === 'streak_3' && stats.streak >= 3) return true;
    if (id === 'streak_7' && stats.streak >= 7) return true;
    if (id === 'blitz_ace' && stats.highScoreBlitz >= 1500) return true;
    if (id === 'scholar_10' && stats.codex.length >= 10) return true;
    return stats.badges.includes(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 font-['Space_Grotesk']">
                Player Profile & Achievements
              </h3>
              <p className="text-xs text-slate-400">
                Level {levelInfo.level} • {levelInfo.title}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Level Progress Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs text-slate-400 font-medium">Current Rank</span>
                <h4 className="text-base font-extrabold text-amber-300 font-['Space_Grotesk']">
                  Level {levelInfo.level}: {levelInfo.title}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Total XP</span>
                <p className="text-sm font-bold text-cyan-400 font-mono">{stats.xp} XP</p>
              </div>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden my-2">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((levelInfo.currentXp / levelInfo.nextLevelXp) * 100))}%`
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>{levelInfo.currentXp} XP</span>
              <span>{levelInfo.nextLevelXp} XP to Next Tier</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-slate-400">Total Played</span>
              <p className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk'] mt-0.5">
                {stats.totalAnswered}
              </p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-slate-400">Best Blitz Score</span>
              <p className="text-base sm:text-lg font-bold text-amber-300 font-['Space_Grotesk'] mt-0.5">
                {stats.highScoreBlitz}
              </p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
              <span className="text-[11px] text-slate-400">Knowledge Codex</span>
              <p className="text-base sm:text-lg font-bold text-cyan-300 font-['Space_Grotesk'] mt-0.5">
                {stats.codex.length}
              </p>
            </div>
          </div>

          {/* Badges List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Trophy Vault
            </h4>

            <div className="space-y-2.5">
              {AVAILABLE_BADGES.map((badge) => {
                const unlocked = isBadgeUnlocked(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      unlocked
                        ? 'bg-slate-950/80 border-amber-500/30 shadow-md shadow-amber-500/5'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        unlocked ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-800/50 border border-slate-800'
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-200 truncate font-['Space_Grotesk']">
                          {badge.title}
                        </h5>
                        {unlocked ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
