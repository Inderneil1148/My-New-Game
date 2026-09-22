import React, { useState } from 'react';
import { X, Sparkles, Compass, ArrowRight, Loader2 } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface CustomTopicModalProps {
  onStartCustomQuiz: (topic: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  { label: '🚀 Deep Space & James Webb', topic: 'James Webb Space Telescope cosmic discoveries, black holes, and Mars exploration' },
  { label: '🤖 AI & Autonomous Robots', topic: 'Cutting-edge AI breakthroughs, humanoid robotics, and neural networks' },
  { label: '⚡ Clean Energy & Solid-State Batteries', topic: 'Next-gen solid-state battery tech, nuclear fusion, and green energy innovations' },
  { label: '🌊 Deep Ocean Mysteries', topic: 'Deep sea exploration, hydrothermal vents, and bioluminescent ocean life' },
  { label: '🏛️ Ancient Lost Civilizations', topic: 'Archaeological discoveries, Roman engineering secrets, and ancient technology' },
  { label: '🧬 CRISPR & Biotechnology', topic: 'Gene editing, synthetic biology, and anti-aging medical breakthroughs' },
  { label: '🏎️ Formula 1 & Hypercar Engineering', topic: 'Aerodynamics, hybrid turbo engines, and cutting-edge motorsport tech' },
  { label: '🧠 Neuroscience & Brain Wonders', topic: 'Memory enhancement, sleep science, and neuroplasticity studies' },
];

export const CustomTopicModal: React.FC<CustomTopicModalProps> = ({
  onStartCustomQuiz,
  onClose,
  isLoading,
}) => {
  const [customInput, setCustomInput] = useState('');

  const handleLaunch = (topic: string) => {
    if (!topic.trim() || isLoading) return;
    soundEffects.playClick();
    onStartCustomQuiz(topic.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl flex flex-col shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-100 font-['Space_Grotesk']">
                Curiosity Lab
              </h3>
              <p className="text-xs text-slate-400">
                Generate a custom news trivia quest on any subject
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Custom prompt input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
              What are you curious about today?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLaunch(customInput);
                }}
                placeholder="e.g., Quantum Computing, Electric Aviation, Ocean Trenches..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={() => handleLaunch(customInput)}
                disabled={isLoading || !customInput.trim()}
                className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Generate</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Popular Curiosities list */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-3">
              Or Explore Trending Themes:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {PRESET_TOPICS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLaunch(preset.topic)}
                  disabled={isLoading}
                  className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 text-left text-xs text-slate-200 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-40"
                >
                  <span className="truncate pr-2">{preset.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Gemini will research live facts and craft an interactive 5-question arcade blitz.</span>
        </div>
      </div>
    </div>
  );
};
