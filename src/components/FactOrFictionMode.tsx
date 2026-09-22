import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookMarked,
  HelpCircle,
  Trophy,
  Flame,
  Globe
} from 'lucide-react';
import { FactOrFictionItem, PlayerStats, LearningCodexItem } from '../types/game';
import { soundEffects } from '../utils/audio';
import { addCodexEntry, savePlayerStats } from '../utils/gameState';
import { DeepDiveModal } from './DeepDiveModal';

interface FactOrFictionModeProps {
  items: FactOrFictionItem[];
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onExit: () => void;
}

export const FactOrFictionMode: React.FC<FactOrFictionModeProps> = ({
  items,
  stats,
  onUpdateStats,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [deepDiveHeadline, setDeepDiveHeadline] = useState<string | null>(null);
  const [savedToCodex, setSavedToCodex] = useState(false);

  const currentItem = items[currentIndex];

  const handleVote = (voteReal: boolean) => {
    if (isRevealed) return;
    soundEffects.playClick();
    setSelectedAnswer(voteReal);
    setIsRevealed(true);

    const isCorrect = voteReal === currentItem.isReal;
    if (isCorrect) {
      soundEffects.playCorrect();
      const points = 100 + streak * 30;
      setScore((s) => s + points);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > bestStreak) setBestStreak(nextStreak);
    } else {
      soundEffects.playWrong();
      setStreak(0);
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((c) => c + 1);
      setSelectedAnswer(null);
      setIsRevealed(false);
      setSavedToCodex(false);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsFinished(true);
    soundEffects.playFanfare();
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {
      // ignore
    }

    const xpEarned = Math.round(score * 0.5) + 120;
    const coinsEarned = Math.round(score / 40) + 15;

    const updated: PlayerStats = {
      ...stats,
      xp: stats.xp + xpEarned,
      coins: stats.coins + coinsEarned,
      totalAnswered: stats.totalAnswered + items.length,
    };
    onUpdateStats(updated);
    savePlayerStats(updated);
  };

  const handleSaveCodex = () => {
    soundEffects.playSparkle();
    const entry: LearningCodexItem = {
      id: `fof_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      headline: currentItem.headline,
      category: currentItem.isReal ? 'Real News Discovery' : 'Debunked AI Myth',
      takeaway: currentItem.story,
      funFact: currentItem.learningNugget,
      whyItMatters: `Verified status: ${currentItem.isReal ? '100% Real Event' : 'AI-Invented Fiction'}. Source: ${currentItem.source}`,
      source: currentItem.source,
    };
    const updated = addCodexEntry(stats, entry);
    onUpdateStats(updated);
    setSavedToCodex(true);
  };

  if (isFinished) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
            Fact Inspector Round Complete
          </span>
          <h2 className="text-2xl font-bold text-white mt-1 font-['Space_Grotesk']">
            Truth Sleuth Mastered
          </h2>

          <div className="my-6 py-4 px-6 bg-slate-950/70 border border-slate-800 rounded-2xl flex justify-around items-center">
            <div>
              <p className="text-xs text-slate-400">Final Score</p>
              <p className="text-2xl font-bold text-amber-300 font-['Space_Grotesk']">{score}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <p className="text-xs text-slate-400">Best Streak</p>
              <p className="text-2xl font-bold text-orange-400 font-['Space_Grotesk'] flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-orange-500" /> {bestStreak}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setIsRevealed(false);
                setScore(0);
                setStreak(0);
                setIsFinished(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Another Round</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                onExit();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Back to Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentItem.isReal;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            Card {currentIndex + 1} / {items.length}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            {streak > 0 ? `${streak} Streak` : '0'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Score</span>
          <p className="text-sm font-bold text-amber-300 font-['Space_Grotesk'] leading-none">
            {score}
          </p>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Headline Truth Detector
          </span>
          <span className="text-[11px] text-slate-400">Swipe or Vote</span>
        </div>

        {/* The headline in question */}
        <div className="my-6 min-h-[120px] flex items-center justify-center text-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          <h3 className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk'] leading-relaxed">
            "{currentItem.headline}"
          </h3>
        </div>

        {/* Voting Buttons */}
        {!isRevealed ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
            <button
              onClick={() => handleVote(true)}
              className="py-4 px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 border-2 border-emerald-500/60 hover:border-emerald-400 text-emerald-300 font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 transition-all transform active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <CheckCircle className="w-7 h-7 text-emerald-400" />
              <span>100% REAL NEWS</span>
              <span className="text-[10px] text-emerald-400/70 font-normal">This actually happened</span>
            </button>

            <button
              onClick={() => handleVote(false)}
              className="py-4 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border-2 border-rose-500/60 hover:border-rose-400 text-rose-300 font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-1.5 transition-all transform active:scale-95 shadow-lg shadow-rose-500/10 cursor-pointer"
            >
              <XCircle className="w-7 h-7 text-rose-400" />
              <span>AI FICTION</span>
              <span className="text-[10px] text-rose-400/70 font-normal">Plausible Hallucination</span>
            </button>
          </div>
        ) : (
          /* Reveal Section */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isCorrect
                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {isCorrect ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <p className="font-extrabold text-base sm:text-lg">
                    {isCorrect ? 'Brilliant Call! Correct!' : 'Fooled by the Headline!'}
                  </p>
                  <p className="text-xs opacity-90">
                    This news story is{' '}
                    <span className="font-bold underline">
                      {currentItem.isReal ? '100% TRUE & VERIFIED' : 'COMPLETE AI FICTION'}
                    </span>
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900/80 font-mono font-bold">
                {currentItem.source}
              </span>
            </div>

            {/* Story / Context */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  The True Background
                </span>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {currentItem.story}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-300">The Lesson: </span>
                  {currentItem.learningNugget}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCodex}
                  disabled={savedToCodex}
                  className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:text-emerald-400"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>{savedToCodex ? 'Saved to Codex ✓' : 'Save to Codex'}</span>
                </button>
                <button
                  onClick={() => setDeepDiveHeadline(currentItem.headline)}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Explain Deeper</span>
                </button>
              </div>

              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>{currentIndex + 1 < items.length ? 'Next News Card' : 'Finish Round'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deepDiveHeadline && (
        <DeepDiveModal
          headline={deepDiveHeadline}
          topic="Fact or Fiction Investigation"
          initialTakeaway={currentItem.story}
          onClose={() => setDeepDiveHeadline(null)}
        />
      )}
    </div>
  );
};
