import { DrawnCard } from "./tarot-logic";

export type JournalEntry = {
  id: string;
  type: "tarot" | "numerology";
  timestamp: number;
  // Tarot specific
  cards?: DrawnCard[];
  spreadSize?: number;
  summary?: string;
  userStory?: string;
  language?: "id" | "en";
  theme?: string;
  deckImage?: string;
  // Numerology specific
  name?: string;
  birthDate?: string;
  lifePath?: number | null;
  destiny?: number | null;
  reading?: string;
};

const STORAGE_KEY = "tarot-journal";
const DAILY_CARD_KEY = "tarot-daily-card";

// --- Journal CRUD ---

export function getJournalEntries(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJournalEntry(entry: Omit<JournalEntry, "id" | "timestamp">): JournalEntry {
  const entries = getJournalEntries();
  const newEntry: JournalEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  entries.unshift(newEntry); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
}

export function deleteJournalEntry(id: string): void {
  const entries = getJournalEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearJournal(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Daily Card ---

type DailyCardData = {
  date: string; // YYYY-MM-DD
  cardIndex: number;
  isReversed: boolean;
};

export function getDailyCard(): DailyCardData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DAILY_CARD_KEY);
    if (!raw) return null;
    const data: DailyCardData = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (data.date === today) return data;
    return null; // Expired, different day
  } catch {
    return null;
  }
}

export function setDailyCard(cardIndex: number, isReversed: boolean): DailyCardData {
  const today = new Date().toISOString().split("T")[0];
  const data: DailyCardData = { date: today, cardIndex, isReversed };
  localStorage.setItem(DAILY_CARD_KEY, JSON.stringify(data));
  return data;
}
