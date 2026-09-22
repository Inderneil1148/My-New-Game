import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Globe,
  Search,
  BookOpen,
  Compass,
  Play,
  Flame,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Lightbulb,
  Radio
} from 'lucide-react';
import { PlayerStats, GameMode } from '../types/game';
import { soundEffects } from '../utils/audio';
import { DeepDiveModal } from './DeepDiveModal';

interface HubProps {
  stats: PlayerStats;
  onStartBlitz: () => void;
  onStartFactOrFiction: () => void;
  onStartDetective: () => void;
  onOpenCodex: () => void;
  onOpenCustomTopic: () => void;
  isLoading: boolean;
}

export const Hub: React.FC<HubProps> = ({
  stats,
  onStartBlitz,
  onStartFactOrFiction,
  onStartDetective,
  onOpenCodex,
  onOpenCustomTopic,
  isLoading
}) => {
  const [showQuickDive, setShowQuickDive] = useState(false);
  const [quickDiveTopic, setQuickDiveTopic] = useState('');

  // Daily quest progress calculations
  const questBlitzDone = stats.totalAnswered >= 5;
  const questCodexDone = stats.codex.length >= 1;
  const questStreakDone = stats.streak >= 1;

  const handleCustomDeepDive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDiveTopic.trim()) return;
    soundEffects.playClick();
    setShowQuickDive(true);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-7 animate-in fade-in duration-300">
      {/* Hero Daily Edition Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-9 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Today's Live Edition Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight leading-tight mb-3">
            Pass the time. <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-400 bg-clip-text text-transparent">
              Learn something mind-expanding daily.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            Turn current world news and scientific breakthroughs into exhilarating mini-games.
            Play timed blitzes, expose AI fake headlines, and archive daily insights into your personal Codex.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                onStartBlitz();
              }}
              disabled={isLoading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-orange-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Play Today's News Blitz</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                onOpenCustomTopic();
              }}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all cursor-pointer hover:border-cyan-500/40"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Curiosity Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Quest / Streak Tracker Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-orange-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white font-['Space_Grotesk']">
                Daily Learning Streak: {stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold">
                +25 🪙 Streak Bonus
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Play at least one game mode each day to keep your streak and polymath rank growing!
            </p>
          </div>
        </div>

        {/* Quest Checkmarks */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2
              className={`w-4 h-4 ${questBlitzDone ? 'text-emerald-400' : 'text-slate-600'}`}
            />
            <span className={questBlitzDone ? 'line-through text-slate-400' : ''}>
              Play 1 Blitz
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle2
              className={`w-4 h-4 ${questCodexDone ? 'text-emerald-400' : 'text-slate-600'}`}
            />
            <span className={questCodexDone ? 'line-through text-slate-400' : ''}>
              Save 1 Codex Insight
            </span>
          </div>
        </div>
      </div>

      {/* Game Modes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Arcade Game Modes
          </h2>
          <span className="text-xs text-slate-400">All modes powered by Gemini AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Daily News Blitz */}
          <div
            onClick={() => {
              soundEffects.playClick();
              onStartBlitz();
            }}
            className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk'] group-hover:text-amber-300 transition-colors">
                  Daily News Blitz
                </h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Arcade
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                5 fast-paced trivia questions based on today's headlines. Beat the clock, rack up combos, and use 50-50 or Gemini hints.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-amber-400 pt-3 border-t border-slate-800/80">
              <span>Start 2-Min Run</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Fact or Fiction */}
          <div
            onClick={() => {
              soundEffects.playClick();
              onStartFactOrFiction();
            }}
            className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk'] group-hover:text-emerald-300 transition-colors">
                  Fact or Fiction?
                </h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Swiper
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Bizarre true events vs plausible AI fake news. Can you spot which strange headline actually happened this week?
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 pt-3 border-t border-slate-800/80">
              <span>Test Your Radar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Headline Detective */}
          <div
            onClick={() => {
              soundEffects.playClick();
              onStartDetective();
            }}
            className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-yellow-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-yellow-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk'] group-hover:text-yellow-300 transition-colors">
                  Headline Detective
                </h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                  Mystery
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                A critical word has been [REDACTED] from a breaking news story. Unravel progressive clues to crack the case.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-yellow-400 pt-3 border-t border-slate-800/80">
              <span>Open Dossiers</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Curiosity Lab */}
          <div
            onClick={() => {
              soundEffects.playClick();
              onOpenCustomTopic();
            }}
            className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-base text-white font-['Space_Grotesk'] group-hover:text-cyan-300 transition-colors">
                  Curiosity Lab
                </h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                  Custom
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Obsessed with black holes, electric hypercars, or Roman ruins? Type any curiosity to generate an instant game!
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 pt-3 border-t border-slate-800/80">
              <span>Explore Topics</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Daily Codex */}
          <div
            onClick={() => {
              soundEffects.playClick();
              onOpenCodex();
            }}
            className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between sm:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {stats.codex.length} Insights Collected
                </span>
              </div>
              <h3 className="font-bold text-base text-white font-['Space_Grotesk'] group-hover:text-blue-300 transition-colors mb-1">
                The Daily Knowledge Codex
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Review your permanent scrapbook of key scientific takeaways, surprising historical precedents, and shareable flashcards.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-blue-400 pt-3 border-t border-slate-800/80">
              <span>Review What You've Learned</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Gemini Tutor Query */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm sm:text-base font-bold text-slate-200 font-['Space_Grotesk']">
            Curious about any headline or event today?
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Ask Gemini to break down any news development into simple terms, context, and future impact:
        </p>

        <form onSubmit={handleCustomDeepDive} className="flex gap-2">
          <input
            type="text"
            value={quickDiveTopic}
            onChange={(e) => setQuickDiveTopic(e.target.value)}
            placeholder="e.g. 'Why did NASA postpone the Artemis mission?' or 'How do solid state batteries work?'"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!quickDiveTopic.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            <span>Explain</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {showQuickDive && (
        <DeepDiveModal
          headline={quickDiveTopic}
          topic="Curiosity Inquiry"
          onClose={() => {
            setShowQuickDive(false);
            setQuickDiveTopic('');
          }}
        />
      )}
    </div>
  );
};
