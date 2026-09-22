/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  GameMode,
  PlayerStats,
  QuizQuestion,
  FactOrFictionItem,
  DetectiveCase
} from './types/game';
import { loadPlayerStats, savePlayerStats, updateDailyStreak } from './utils/gameState';
import { Header } from './components/Header';
import { Hub } from './components/Hub';
import { BlitzMode } from './components/BlitzMode';
import { FactOrFictionMode } from './components/FactOrFictionMode';
import { DetectiveMode } from './components/DetectiveMode';
import { CodexView } from './components/CodexView';
import { BadgesModal } from './components/BadgesModal';
import { CustomTopicModal } from './components/CustomTopicModal';

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [mode, setMode] = useState<GameMode>('hub');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Consulting Gemini AI...');
  const [showBadges, setShowBadges] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active game data
  const [blitzQuestions, setBlitzQuestions] = useState<QuizQuestion[]>([]);
  const [blitzTitle, setBlitzTitle] = useState("Today's Daily News Blitz");
  const [fofItems, setFofItems] = useState<FactOrFictionItem[]>([]);
  const [detectiveCases, setDetectiveCases] = useState<DetectiveCase[]>([]);

  // Update daily streak on launch
  useEffect(() => {
    const updated = updateDailyStreak(stats);
    setStats(updated);
  }, []);

  const handleUpdateStats = (newStats: PlayerStats) => {
    setStats(newStats);
    savePlayerStats(newStats);
  };

  // Launch Daily News Blitz
  const handleStartBlitz = async (topic?: string) => {
    setIsLoading(true);
    setLoadingMessage(topic ? `Gemini is researching "${topic}"...` : "Scanning today's global news & discoveries with Gemini...");
    setErrorMessage(null);

    try {
      const res = await fetch('/api/news-quiz/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || undefined })
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setBlitzQuestions(data.data);
        setBlitzTitle(topic ? `Curiosity Quest: ${topic}` : "Today's Daily News Blitz");
        setMode('blitz');
      } else {
        throw new Error('No quiz questions received');
      }
    } catch (err: any) {
      console.error('Failed to load quiz:', err);
      setErrorMessage('Could not connect to news feed. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  // Launch Fact or Fiction Mode
  const handleStartFactOrFiction = async () => {
    setIsLoading(true);
    setLoadingMessage('Gemini is mixing real news with clever AI fakes...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/news-quiz/fact-or-fiction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setFofItems(data.data);
        setMode('fof');
      } else {
        throw new Error('No items received');
      }
    } catch (err) {
      console.error('Failed to load Fact or Fiction:', err);
      setErrorMessage('Unable to load Fact or Fiction. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  // Launch Headline Detective Mode
  const handleStartDetective = async () => {
    setIsLoading(true);
    setLoadingMessage('Redacting sensitive keywords and drafting detective clues...');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/news-quiz/headline-detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        setDetectiveCases(data.data);
        setMode('detective');
      } else {
        throw new Error('No cases received');
      }
    } catch (err) {
      console.error('Failed to load Detective mode:', err);
      setErrorMessage('Unable to load Headline Detective. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Topic launch from modal
  const handleCustomQuizLaunch = async (topic: string) => {
    setShowCustomModal(false);
    await handleStartBlitz(topic);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <Header
        stats={stats}
        onOpenCodex={() => setMode('codex')}
        onGoHome={() => setMode('hub')}
        onOpenBadges={() => setShowBadges(true)}
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div className="max-w-md mx-auto my-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-100 text-xs font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {mode === 'hub' && (
          <Hub
            stats={stats}
            onStartBlitz={() => handleStartBlitz()}
            onStartFactOrFiction={handleStartFactOrFiction}
            onStartDetective={handleStartDetective}
            onOpenCodex={() => setMode('codex')}
            onOpenCustomTopic={() => setShowCustomModal(true)}
            isLoading={isLoading}
          />
        )}

        {mode === 'blitz' && blitzQuestions.length > 0 && (
          <BlitzMode
            questions={blitzQuestions}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onExit={() => setMode('hub')}
            topicTitle={blitzTitle}
          />
        )}

        {mode === 'fof' && fofItems.length > 0 && (
          <FactOrFictionMode
            items={fofItems}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onExit={() => setMode('hub')}
          />
        )}

        {mode === 'detective' && detectiveCases.length > 0 && (
          <DetectiveMode
            cases={detectiveCases}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onExit={() => setMode('hub')}
          />
        )}

        {mode === 'codex' && (
          <CodexView
            codex={stats.codex}
            onBack={() => setMode('hub')}
          />
        )}
      </main>

      {/* Modals */}
      {showBadges && (
        <BadgesModal
          stats={stats}
          onClose={() => setShowBadges(false)}
        />
      )}

      {showCustomModal && (
        <CustomTopicModal
          onStartCustomQuiz={handleCustomQuizLaunch}
          onClose={() => setShowCustomModal(false)}
          isLoading={isLoading}
        />
      )}

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-xl shadow-orange-500/25 mb-4 animate-bounce">
            <Sparkles className="w-7 h-7 text-slate-950 fill-slate-950" />
          </div>
          <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-2" />
          <p className="text-sm font-semibold text-slate-200 font-['Space_Grotesk'] text-center px-4">
            {loadingMessage}
          </p>
          <span className="text-xs text-slate-500 mt-1">Grounding with live Gemini intelligence</span>
        </div>
      )}

      {/* Sleek Minimal Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          NewsCade • Powered by Gemini AI • Learn something extraordinary every single day
        </p>
      </footer>
    </div>
  );
}
