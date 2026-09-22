import { PlayerStats, Badge, LearningCodexItem } from '../types/game';

const STATS_STORAGE_KEY = 'newscade_player_stats_v1';

export const AVAILABLE_BADGES: Omit<Badge, 'unlocked'>[] = [
  {
    id: 'first_quiz',
    title: 'Curiosity Spark',
    icon: '⚡',
    description: 'Played your very first NewsCade challenge.',
    requirement: 'Answer 1 question'
  },
  {
    id: 'streak_3',
    title: 'Daily Reader',
    icon: '🔥',
    description: 'Kept a 3-day learning streak alive.',
    requirement: 'Reach 3-day streak'
  },
  {
    id: 'streak_7',
    title: 'Polymath in Training',
    icon: '🌟',
    description: 'Kept a 7-day learning streak alive.',
    requirement: 'Reach 7-day streak'
  },
  {
    id: 'fof_master',
    title: 'Fact Inspector',
    icon: '🕵️‍♂️',
    description: 'Spotted real news versus AI fiction with eagle eyes.',
    requirement: 'Score 100% on Fact or Fiction round'
  },
  {
    id: 'blitz_ace',
    title: 'News Flash Ace',
    icon: '⚡',
    description: 'Scored over 1,500 points in a single Blitz run.',
    requirement: 'Score 1,500+ points in Blitz'
  },
  {
    id: 'scholar_10',
    title: 'Codex Archivist',
    icon: '📚',
    description: 'Saved 10 mind-expanding news discoveries to your Codex.',
    requirement: 'Collect 10 Codex entries'
  },
  {
    id: 'detective_pro',
    title: 'Headline Sleuth',
    icon: '🔎',
    description: 'Cracked the redacted headline with zero clues used.',
    requirement: 'Solve Detective case on 1st try'
  }
];

const INITIAL_STATS: PlayerStats = {
  xp: 0,
  level: 1,
  streak: 1,
  lastPlayedDate: '',
  coins: 100, // start with 100 curiosity coins for lifelines!
  totalCorrect: 0,
  totalAnswered: 0,
  highScoreBlitz: 0,
  codex: [],
  badges: []
};

export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return INITIAL_STATS;
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return INITIAL_STATS;
    const data = JSON.parse(raw);
    return {
      ...INITIAL_STATS,
      ...data,
      badges: data.badges || [],
      codex: data.codex || []
    };
  } catch (err) {
    console.error('Failed to load player stats:', err);
    return INITIAL_STATS;
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save player stats:', err);
  }
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number; title: string } {
  // Level threshold: Level 1 (0-200), Level 2 (200-500), Level 3 (500-900), etc.
  let level = 1;
  let prevThreshold = 0;
  let threshold = 200;

  const titles = [
    'Curious Novice',
    'Morning Scroller',
    'Headline Sleuth',
    'Fact Inspector',
    'Informed Citizen',
    'Trend Analyst',
    'Deep Dive Scholar',
    'Grand Polymath',
    'Omniscient Master'
  ];

  while (xp >= threshold) {
    prevThreshold = threshold;
    level++;
    threshold = Math.floor(threshold + 250 * Math.pow(1.2, level - 1));
  }

  const titleIndex = Math.min(level - 1, titles.length - 1);

  return {
    level,
    currentXp: xp - prevThreshold,
    nextLevelXp: threshold - prevThreshold,
    title: titles[titleIndex]
  };
}

export function updateDailyStreak(stats: PlayerStats): PlayerStats {
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastPlayedDate === today) {
    return stats; // Already played today
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = stats.streak;

  if (stats.lastPlayedDate === yesterday) {
    newStreak += 1;
  } else if (!stats.lastPlayedDate) {
    newStreak = 1;
  } else {
    // Missed a day
    newStreak = 1;
  }

  const updated: PlayerStats = {
    ...stats,
    streak: newStreak,
    lastPlayedDate: today,
    coins: stats.coins + 25 // Daily streak reward!
  };

  savePlayerStats(updated);
  return updated;
}

export function addCodexEntry(stats: PlayerStats, entry: LearningCodexItem): PlayerStats {
  // Avoid duplicate headline
  const exists = stats.codex.some(item => item.headline.toLowerCase() === entry.headline.toLowerCase());
  if (exists) return stats;

  const updated: PlayerStats = {
    ...stats,
    codex: [entry, ...stats.codex]
  };
  savePlayerStats(updated);
  return updated;
}
