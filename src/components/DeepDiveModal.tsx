import React, { useState } from 'react';
import { X, Sparkles, Send, Compass, Clock, Zap, Loader2 } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface DeepDiveModalProps {
  headline: string;
  topic?: string;
  initialTakeaway?: string;
  onClose: () => void;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({
  headline,
  topic = 'General Science & News',
  initialTakeaway,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; a: string }>>([]);

  // Fetch initial deep dive on mount
  React.useEffect(() => {
    let isMounted = true;
    async function fetchDeepDive() {
      try {
        setLoading(true);
        const res = await fetch('/api/news-quiz/deep-dive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            headline,
            topic,
            userQuestion: 'Explain the core mechanics, why this discovery/event is revolutionary, and what it teaches us.'
          })
        });
        const data = await res.json();
        if (isMounted) {
          setContent(data.explanation || 'No details available.');
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setContent(initialTakeaway || 'This topic is an emerging story with rich historical and scientific depth.');
          setLoading(false);
        }
      }
    }
    fetchDeepDive();
    return () => {
      isMounted = false;
    };
  }, [headline, topic, initialTakeaway]);

  const handleSendCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isAsking) return;

    soundEffects.playClick();
    const q = customQuestion.trim();
    setCustomQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/news-quiz/deep-dive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          topic,
          userQuestion: q
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { q, a: data.explanation || 'No response.' }]);
      soundEffects.playSparkle();
    } catch {
      setChatHistory(prev => [
        ...prev,
        { q, a: 'Unable to reach Gemini right now. Please check your connection!' }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-100 font-['Space_Grotesk']">
                  Gemini Deep Dive
                </h3>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {topic}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md">
                {headline}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-slate-300 leading-relaxed custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
              <p className="text-xs tracking-wide animate-pulse font-medium">
                Gemini is synthesizing news context, history & scientific impact...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Core explanation card */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 whitespace-pre-line prose prose-invert max-w-none text-slate-300 text-sm sm:text-[15px]">
                {content}
              </div>

              {/* Chat interactions */}
              {chatHistory.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" /> Follow-Up Curiosity
                  </h4>
                  {chatHistory.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                        Q: {item.q}
                      </div>
                      <div className="text-xs text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg p-3 whitespace-pre-line">
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Follow-up question input */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90">
          <form onSubmit={handleSendCustomQuestion} className="flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Ask anything about this event or science concept..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={loading || isAsking}
            />
            <button
              type="submit"
              disabled={loading || isAsking || !customQuestion.trim()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Ask</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 overflow-x-auto pb-1">
            <span className="text-slate-400">Suggested:</span>
            {['How does this work?', 'Why is this significant?', 'Who made this discovery?'].map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCustomQuestion(sug)}
                className="whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] transition-colors cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
