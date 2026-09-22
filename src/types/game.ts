export interface LearningBite {
  takeaway: string;
  funFact: string;
  whyItMatters: string;
  topicTags: string[];
}

export interface QuizQuestion {
  id: string;
  category: string;
  headline: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  learningBite: LearningBite;
  sourceOrContext: string;
}

export interface FactOrFictionItem {
  id: string;
  headline: string;
  isReal: boolean;
  source: string;
  story: string;
  learningNugget: string;
}

export interface DetectiveCase {
  id: string;
  redactedHeadline: string;
  secretWord: string;
  clues: string[];
  options: string[];
  correctIndex: number;
  fullStory: string;
  knowledgeLesson: string;
}

export interface LearningCodexItem {
  id: string;
  date: string;
  headline: string;
  category: string;
  takeaway: string;
  funFact: string;
  whyItMatters: string;
  source: string;
}

export interface Badge {
  id: string;
  title: string;
  icon: string;
  description: string;
  requirement: string;
  unlocked: boolean;
}

export interface PlayerStats {
  xp: number;
  level: number;
  streak: number;
  lastPlayedDate: string;
  coins: number;
  totalCorrect: number;
  totalAnswered: number;
  highScoreBlitz: number;
  codex: LearningCodexItem[];
  badges: string[]; // unlocked badge ids
}

export type GameMode = 'hub' | 'blitz' | 'fof' | 'detective' | 'codex' | 'custom';
