import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Zap,
  Clock,
  HelpCircle,
  Scissors,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookMarked,
  RotateCcw,
  Trophy,
  Share2,
  Flame
} from 'lucide-react';
import { QuizQuestion, PlayerStats, LearningCodexItem } from '../types/game';
import { soundEffects } from '../utils/audio';
import { addCodexEntry, savePlayerStats } from '../utils/gameState';
import { DeepDiveModal } from './DeepDiveModal';

interface BlitzModeProps {
  questions: QuizQuestion[];
  stats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onExit: () => void;
  topicTitle?: string;
}

export const BlitzMode: React.FC<BlitzModeProps> = ({
  questions,
  stats,
  onUpdateStats,
  onExit,
  topicTitle = "Today's Daily News Blitz"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(25);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deepDiveTarget, setDeepDiveTarget] = useState<QuizQuestion | null>(null);
  const [savedToCodex, setSavedToCodex] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentQ = questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || isGameOver || isTimeFrozen) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) {
          soundEffects.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isGameOver, isTimeFrozen]);

  const handleTimeOut = () => {
    soundEffects.playWrong();
    setSelectedOption(-1); // timed out
    setIsAnswered(true);
    setCombo(1);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || disabledOptions.includes(idx)) return;

    soundEffects.playClick();
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      soundEffects.playCorrect();
      const speedBonus = Math.floor(timeLeft * 10);
      const pointsEarned = Math.floor((100 + speedBonus) * combo);
      setScore((s) => s + pointsEarned);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > highestCombo) {
        setHighestCombo(nextCombo);
      }
    } else {
      soundEffects.playWrong();
      setCombo(1);
    }
  };

  // Lifeline 1: 50-50
  const handleUse5050 = () => {
    if (isAnswered || disabledOptions.length > 0 || stats.coins < 15) return;
    soundEffects.playClick();

    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);

    // Shuffle and pick 2 to disable
    const toDisable = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setDisabledOptions(toDisable);

    const updatedStats = { ...stats, coins: stats.coins - 15 };
    onUpdateStats(updatedStats);
    savePlayerStats(updatedStats);
  };

  // Lifeline 2: Ask Gemini Hint
  const handleUseHint = async () => {
    if (isAnswered || geminiHint || stats.coins < 10 || isLoadingHint) return;
    soundEffects.playClick();
    setIsLoadingHint(true);

    try {
      const res = await fetch('/api/news-quiz/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          options: currentQ.options,
          headline: currentQ.headline,
        }),
      });
      const data = await res.json();
      setGeminiHint(data.hint || 'Focus on the simplest natural explanation!');
      soundEffects.playSparkle();

      const updatedStats = { ...stats, coins: stats.coins - 10 };
      onUpdateStats(updatedStats);
      savePlayerStats(updatedStats);
    } catch {
      setGeminiHint('Look closely at the word structure and natural processes!');
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Lifeline 3: Freeze Time
  const handleUseFreeze = () => {
    if (isAnswered || stats.coins < 10) return;
    soundEffects.playClick();
    setTimeLeft((t) => t + 15);
    setIsTimeFrozen(true);

    const updatedStats = { ...stats, coins: stats.coins - 10 };
    onUpdateStats(updatedStats);
    savePlayerStats(updatedStats);

    // Auto unfreeze after 5s
    setTimeout(() => setIsTimeFrozen(false), 5000);
  };

  const handleSaveToCodex = () => {
    soundEffects.playSparkle();
    const entry: LearningCodexItem = {
      id: `codex_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      headline: currentQ.headline,
      category: currentQ.category,
      takeaway: currentQ.learningBite.takeaway,
      funFact: currentQ.learningBite.funFact,
      whyItMatters: currentQ.learningBite.whyItMatters,
      source: currentQ.sourceOrContext,
    };
    const updated = addCodexEntry(stats, entry);
    onUpdateStats(updated);
    setSavedToCodex(true);
  };

  const handleNextQuestion = () => {
    soundEffects.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(25);
      setDisabledOptions([]);
      setGeminiHint(null);
      setSavedToCodex(false);
      setIsTimeFrozen(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setIsGameOver(true);
    soundEffects.playFanfare();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Award XP and Coins
    const xpGained = Math.round(score * 0.4) + 150;
    const coinsGained = Math.round(score / 50) + 20;

    const newHighScore = Math.max(stats.highScoreBlitz, score);
    const updatedStats: PlayerStats = {
      ...stats,
      xp: stats.xp + xpGained,
      coins: stats.coins + coinsGained,
      totalAnswered: stats.totalAnswered + questions.length,
      highScoreBlitz: newHighScore,
    };

    onUpdateStats(updatedStats);
    savePlayerStats(updatedStats);
  };

  // Rank determination
  const getRank = (finalScore: number) => {
    if (finalScore >= 2000) return { rank: 'S', label: 'Grand Polymath', color: 'text-amber-400' };
    if (finalScore >= 1400) return { rank: 'A', label: 'News Virtuoso', color: 'text-emerald-400' };
    if (finalScore >= 800) return { rank: 'B', label: 'Sharp Analyst', color: 'text-cyan-400' };
    return { rank: 'C', label: 'Curious Seeker', color: 'text-slate-300' };
  };

  if (isGameOver) {
    const rankInfo = getRank(score);
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4">
            <Trophy className="w-8 h-8 text-slate-950" />
          </div>

          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            Blitz Run Complete
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-['Space_Grotesk']">
            {rankInfo.label}
          </h2>

          <div className="my-6 py-4 px-6 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-around">
            <div>
              <p className="text-xs text-slate-400 font-medium">Final Score</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-['Space_Grotesk']">
                {score}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Rank Tier</p>
              <p className={`text-3xl font-extrabold ${rankInfo.color} font-['Space_Grotesk']`}>
                {rankInfo.rank}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Max Combo</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-orange-400 font-['Space_Grotesk'] flex items-center justify-center gap-0.5">
                <Flame className="w-5 h-5 fill-orange-500" />
                {highestCombo}x
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left">
              <span className="text-[11px] text-slate-400">XP Gained</span>
              <p className="text-lg font-bold text-cyan-400">+{Math.round(score * 0.4) + 150} XP</p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-left">
              <span className="text-[11px] text-slate-400">Curiosity Coins</span>
              <p className="text-lg font-bold text-amber-400">+{Math.round(score / 50) + 20} 🪙</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentIndex(0);
                setSelectedOption(null);
                setIsAnswered(false);
                setScore(0);
                setCombo(1);
                setTimeLeft(25);
                setIsGameOver(false);
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playClick();
                onExit();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
            >
              Back to Game Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Top Status Bar: Progress, Timer, Score, Combo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            Q {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            {combo > 1 ? `${combo}x Combo!` : '1x'}
          </span>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${
              timeLeft <= 5
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : isTimeFrozen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Score</span>
            <p className="text-sm font-extrabold text-amber-300 font-['Space_Grotesk'] leading-none">
              {score}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl relative overflow-hidden backdrop-blur-sm">
        {/* News Headline Hook */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
              {currentQ.category}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
              {currentQ.sourceOrContext}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-300 italic border-l-2 border-amber-500/80 pl-2.5 my-1">
            "{currentQ.headline}"
          </h4>
        </div>

        {/* Trivia Question */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-5 font-['Space_Grotesk'] leading-snug">
          {currentQ.question}
        </h3>

        {/* Lifeline Bar */}
        {!isAnswered && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
            <span className="text-slate-400 font-medium text-[11px] px-1">Lifelines:</span>
            <button
              onClick={handleUse5050}
              disabled={disabledOptions.length > 0 || stats.coins < 15}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Remove 2 wrong choices (15 Coins)"
            >
              <Scissors className="w-3 h-3 text-cyan-400" />
              <span>50:50</span>
              <span className="text-amber-400 text-[10px]">15🪙</span>
            </button>

            <button
              onClick={handleUseHint}
              disabled={geminiHint !== null || stats.coins < 10 || isLoadingHint}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Ask Gemini for a subtle hint (10 Coins)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{isLoadingHint ? 'Thinking...' : 'AI Hint'}</span>
              <span className="text-amber-400 text-[10px]">10🪙</span>
            </button>

            <button
              onClick={handleUseFreeze}
              disabled={stats.coins < 10 || isTimeFrozen}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Add 15 seconds (10 Coins)"
            >
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>+15s</span>
              <span className="text-amber-400 text-[10px]">10🪙</span>
            </button>
          </div>
        )}

        {/* Gemini Hint Display */}
        {geminiHint && !isAnswered && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Gemini Hint: </span>
              {geminiHint}
            </p>
          </div>
        )}

        {/* Multiple Choice Options */}
        <div className="space-y-2.5 mb-5">
          {currentQ.options.map((option, idx) => {
            const isDisabled = disabledOptions.includes(idx);
            let btnStyle = 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200';

            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-lg shadow-emerald-500/10';
              } else if (idx === selectedOption) {
                btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 font-semibold';
              } else {
                btnStyle = 'opacity-40 border-slate-900 bg-slate-950 text-slate-400';
              }
            } else if (isDisabled) {
              btnStyle = 'opacity-25 border-dashed border-slate-800 bg-slate-950/40 cursor-not-allowed';
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || isDisabled}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>

                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Post-Answer Learning Bite Card */}
        {isAnswered && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                What You Just Learned
              </span>
              <button
                onClick={handleSaveToCodex}
                disabled={savedToCodex}
                className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer disabled:text-emerald-400 disabled:border-emerald-500/30"
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>{savedToCodex ? 'Saved to Codex ✓' : 'Save to Codex'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {currentQ.explanation}
            </p>

            {/* Fun Fact pill */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300">Mind-Blowing Fact: </span>
                {currentQ.learningBite.funFact}
              </div>
            </div>

            {/* Action footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setDeepDiveTarget(currentQ);
                }}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ask Gemini to explain this news deeper</span>
              </button>

              <button
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deep Dive Modal if triggered */}
      {deepDiveTarget && (
        <DeepDiveModal
          headline={deepDiveTarget.headline}
          topic={deepDiveTarget.category}
          initialTakeaway={deepDiveTarget.learningBite.takeaway}
          onClose={() => setDeepDiveTarget(null)}
        />
      )}
    </div>
  );
};
