import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Key,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookMarked,
  RotateCcw,
  Sparkles,
  Trophy,
  Star
} from 'lucide-react';
import { DetectiveCase, PlayerStats, LearningCodexItem } from '../types/game';
import { soundEffects } from '../utils/audio';
import { addCodexEntry, savePlayerStats } from '../utils/gameState';
import { DeepDiveModal } from './DeepDiveModal';

interface DetectiveModeProps {
  cases: DetectiveCase[];
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onExit: () => void;
}

export const DetectiveMode: React.FC<DetectiveModeProps> = ({
  cases,
  stats,
  onUpdateStats,
  onExit
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [unlockedClues, setUnlockedClues] = useState<number[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<number | null>(null);
  const [isCaseSolved, setIsCaseSolved] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [savedToCodex, setSavedToCodex] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [deepDiveTarget, setDeepDiveTarget] = useState<DetectiveCase | null>(null);

  const currentCase = cases[currentIndex];

  const handleUnlockClue = (clueIdx: number) => {
    if (unlockedClues.includes(clueIdx) || isCaseSolved) return;
    soundEffects.playClick();
    setUnlockedClues((prev) => [...prev, clueIdx]);
  };

  const handleSelectSuspect = (idx: number) => {
    if (isCaseSolved) return;
    soundEffects.playClick();
    setSelectedSuspect(idx);
    setIsCaseSolved(true);

    const isCorrect = idx === currentCase.correctIndex;
    if (isCorrect) {
      soundEffects.playCorrect();
      // Stars based on clues used: 0 clues = 3 stars (300pts), 1 clue = 2 stars (200pts), 2+ clues = 1 star (100pts)
      const stars = Math.max(1, 3 - unlockedClues.length);
      const points = stars * 100;
      setTotalScore((s) => s + points);
    } else {
      soundEffects.playWrong();
    }
  };

  const handleNextCase = () => {
    soundEffects.playClick();
    if (currentIndex + 1 < cases.length) {
      setCurrentIndex((c) => c + 1);
      setUnlockedClues([]);
      setSelectedSuspect(null);
      setIsCaseSolved(false);
      setSavedToCodex(false);
    } else {
      finishAllCases();
    }
  };

  const finishAllCases = () => {
    setIsFinished(true);
    soundEffects.playFanfare();
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {
      // ignore
    }

    const xpEarned = totalScore * 2 + 100;
    const coinsEarned = Math.round(totalScore / 10) + 20;

    const updated: PlayerStats = {
      ...stats,
      xp: stats.xp + xpEarned,
      coins: stats.coins + coinsEarned,
      totalAnswered: stats.totalAnswered + cases.length,
    };
    onUpdateStats(updated);
    savePlayerStats(updated);
  };

  const handleSaveToCodex = () => {
    soundEffects.playSparkle();
    const entry: LearningCodexItem = {
      id: `det_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      headline: currentCase.redactedHeadline.replace('[REDACTED]', currentCase.secretWord),
      category: 'Headline Investigation',
      takeaway: currentCase.fullStory,
      funFact: currentCase.knowledgeLesson,
      whyItMatters: `Secret solution: ${currentCase.secretWord}. Unlocked with detective deduction.`,
      source: 'Global News Wire & Research Journal',
    };
    const updated = addCodexEntry(stats, entry);
    onUpdateStats(updated);
    setSavedToCodex(true);
  };

  if (isFinished) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-4">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Case Files Closed
          </span>
          <h2 className="text-2xl font-bold text-white mt-1 font-['Space_Grotesk']">
            Master News Detective
          </h2>

          <div className="my-6 py-4 px-6 bg-slate-950/70 border border-slate-800 rounded-2xl flex justify-around items-center">
            <div>
              <p className="text-xs text-slate-400">Detective Score</p>
              <p className="text-2xl font-bold text-amber-300 font-['Space_Grotesk']">{totalScore}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <p className="text-xs text-slate-400">Cases Solved</p>
              <p className="text-2xl font-bold text-yellow-400 font-['Space_Grotesk']">
                {cases.length} / {cases.length}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentIndex(0);
                setUnlockedClues([]);
                setSelectedSuspect(null);
                setIsCaseSolved(false);
                setTotalScore(0);
                setIsFinished(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Solve Again</span>
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

  const isCorrect = selectedSuspect === currentCase.correctIndex;
  const starsEarned = Math.max(1, 3 - unlockedClues.length);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            Case #{currentIndex + 1} of {cases.length}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            {starsEarned} ★ Potential
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Score</span>
          <p className="text-sm font-bold text-amber-300 font-['Space_Grotesk'] leading-none">
            {totalScore}
          </p>
        </div>
      </div>

      {/* Detective Dossier Card */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            The Redacted Headline
          </span>
          <span className="text-xs text-slate-400">Identify the missing keyword</span>
        </div>

        {/* Redacted Headline Display */}
        <div className="my-5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
          <p className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk'] leading-relaxed">
            {isCaseSolved ? (
              currentCase.redactedHeadline.replace(
                '[REDACTED]',
                `[${currentCase.secretWord.toUpperCase()}]`
              )
            ) : (
              <span>
                {currentCase.redactedHeadline.split('[REDACTED]')[0]}
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black tracking-wider animate-pulse">
                  [REDACTED]
                </span>
                {currentCase.redactedHeadline.split('[REDACTED]')[1]}
              </span>
            )}
          </p>
        </div>

        {/* Detective Clues Section */}
        {!isCaseSolved && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wide text-slate-300 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Dossier Clues (Unlock if stuck)
              </span>
              <span>Less clues = More stars</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {currentCase.clues.map((clue, idx) => {
                const isUnlocked = unlockedClues.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isUnlocked
                        ? 'bg-slate-950/70 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? (
                      <p className="leading-snug">
                        <span className="font-bold text-cyan-400">Clue {idx + 1}: </span>
                        {clue}
                      </p>
                    ) : (
                      <button
                        onClick={() => handleUnlockClue(idx)}
                        className="w-full h-full flex items-center justify-center gap-1.5 py-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock Clue {idx + 1}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suspect Choices */}
        <div className="space-y-2.5 mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Select the true missing keyword:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentCase.options.map((option, idx) => {
              let style = 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200';

              if (isCaseSolved) {
                if (idx === currentCase.correctIndex) {
                  style = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                } else if (idx === selectedSuspect) {
                  style = 'bg-rose-950/60 border-rose-500 text-rose-200';
                } else {
                  style = 'opacity-40 border-slate-900 bg-slate-950 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isCaseSolved}
                  onClick={() => handleSelectSuspect(idx)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all cursor-pointer ${style}`}
                >
                  <span className="font-medium">{option}</span>
                  {isCaseSolved && idx === currentCase.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {isCaseSolved && idx === selectedSuspect && idx !== currentCase.correctIndex && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Revealed Full Case Story */}
        {isCaseSolved && (
          <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {isCorrect ? (
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    {Array.from({ length: starsEarned }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                    <span className="ml-1 text-emerald-400">Case Solved! (+{starsEarned * 100} pts)</span>
                  </div>
                ) : (
                  <span className="text-rose-400 font-bold text-xs">Case Closed Unsolved</span>
                )}
              </div>

              <button
                onClick={handleSaveToCodex}
                disabled={savedToCodex}
                className="text-xs flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer disabled:text-emerald-400"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>{savedToCodex ? 'Saved to Codex ✓' : 'Save to Codex'}</span>
              </button>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                The Real Story
              </span>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                {currentCase.fullStory}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">Curiosity Insight: </span>
                {currentCase.knowledgeLesson}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setDeepDiveTarget(currentCase)}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explore full scientific lore</span>
              </button>

              <button
                onClick={handleNextCase}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-yellow-500/20"
              >
                <span>{currentIndex + 1 < cases.length ? 'Next Case Dossier' : 'Finish Investigation'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {deepDiveTarget && (
        <DeepDiveModal
          headline={deepDiveTarget.redactedHeadline.replace('[REDACTED]', deepDiveTarget.secretWord)}
          topic="Detective Case Dossier"
          initialTakeaway={deepDiveTarget.fullStory}
          onClose={() => setDeepDiveTarget(null)}
        />
      )}
    </div>
  );
};
