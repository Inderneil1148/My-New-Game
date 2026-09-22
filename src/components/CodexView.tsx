import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Share2,
  HelpCircle,
  Calendar,
  Layers,
  ArrowLeft,
  Check
} from 'lucide-react';
import { LearningCodexItem } from '../types/game';
import { soundEffects } from '../utils/audio';
import { DeepDiveModal } from './DeepDiveModal';

interface CodexViewProps {
  codex: LearningCodexItem[];
  onBack: () => void;
}

export const CodexView: React.FC<CodexViewProps> = ({ codex, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deepDiveItem, setDeepDiveItem] = useState<LearningCodexItem | null>(null);

  const categories = ['All', ...Array.from(new Set(codex.map((i) => i.category)))];

  const filtered = codex.filter((item) => {
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      item.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.takeaway.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.funFact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleShare = (item: LearningCodexItem) => {
    soundEffects.playClick();
    const text = `🧠 Daily Mind-Bite from NewsCade:\n\n"${item.headline}"\n\n💡 Takeaway: ${item.takeaway}\n✨ Fun Fact: ${item.funFact}\n\nPlay & Learn daily on NewsCade!`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
                The Daily Codex
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {codex.length} Insights Collected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Your personal archive of mind-expanding daily news discoveries
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your discoveries..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                soundEffects.playClick();
                setSelectedCategory(cat);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Codex Cards List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300 font-['Space_Grotesk']">
            No Codex Insights Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {codex.length === 0
              ? 'Play a Daily News Blitz or Fact or Fiction round and click "Save to Codex" to build your daily knowledge journal!'
              : 'Try clearing your search filters to view your saved knowledge.'}
          </p>
          <button
            onClick={() => {
              soundEffects.playClick();
              onBack();
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-amber-500/20"
          >
            Play Today's Edition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk'] group-hover:text-amber-200 transition-colors mb-3">
                  "{item.headline}"
                </h3>

                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {item.takeaway}
                </p>

                {item.funFact && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-snug">{item.funFact}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setDeepDiveItem(item);
                  }}
                  className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemini Deep Dive</span>
                </button>

                <button
                  onClick={() => handleShare(item)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors cursor-pointer text-[11px]"
                  title="Copy formatted knowledge bite"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3" />
                      <span>Share Card</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deepDiveItem && (
        <DeepDiveModal
          headline={deepDiveItem.headline}
          topic={deepDiveItem.category}
          initialTakeaway={deepDiveItem.takeaway}
          onClose={() => setDeepDiveItem(null)}
        />
      )}
    </div>
  );
};
