"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  BookOpen, Trash, ClockClockwise, Sparkle, Sun, Hash,
  Export, X, CircleNotch, SignIn, Warning, ArrowClockwise
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import { toPng } from "html-to-image";
import { useAuth } from "@/components/AuthProvider";
import { getDbJournalEntries, deleteDbJournalEntry, clearDbJournal } from "@/app/actions/journal";
// Local fallback
import { getJournalEntries, deleteJournalEntry, clearJournal, type JournalEntry } from "@/lib/journal";

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

type DbEntry = {
  id: string;
  type: string;
  title: string;
  content: string;
  theme: string | null;
  cards: any;
  deckImage: string | null;
  numerologyData: any;
  createdAt: string;
  date: string;
};

function formatDate(ts: string | number): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("id-ID", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Shareable Quote Card
function ShareableQuote({ text, onClose }: { text: string; onClose: () => void }) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!quoteRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(quoteRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#09090b",
      });
      const link = document.createElement("a");
      link.download = `tarot-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const quoteMatch = text.match(/>\s*(.+)/);
  const quoteText = quoteMatch
    ? quoteMatch[1].replace(/\*\*/g, "")
    : text.substring(0, 200);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={SPRING}
        className="flex flex-col items-center gap-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={quoteRef}
          className="w-full rounded-3xl p-10 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #18181b 0%, #09090b 50%, #1c1917 100%)" }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
          <div className="absolute top-6 right-6 opacity-10">
            <Sparkle weight="fill" size={48} className="text-rose-500" />
          </div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-rose-500/60 text-6xl font-serif leading-none">&ldquo;</div>
            <p className="text-zinc-200 text-lg md:text-xl leading-relaxed font-medium -mt-4 px-2">
              {quoteText}
            </p>
            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-[0.2em] pt-2 border-t border-white/5">
              <Sparkle weight="fill" size={12} className="text-rose-500" />
              Baca Tarot
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <Export size={16} />}
            {isExporting ? "Mengunduh..." : "Unduh Gambar"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Entry Card (shared between DB and local)
function EntryCard({
  id,
  type,
  title,
  content,
  theme,
  cards,
  deckImage,
  numerologyData,
  date,
  onDelete,
  onShare,
}: {
  id: string;
  type: string;
  title: string;
  content: string;
  theme?: string | null;
  cards?: any;
  deckImage?: string | null;
  numerologyData?: any;
  date: string;
  onDelete: (id: string) => void;
  onShare: (text: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isNumerology = type === "numerology";
  const lifePath = numerologyData?.lifePath;
  const destiny = numerologyData?.destiny;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={SPRING} className="group">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full text-left glass-card rounded-2xl p-6 hover:border-white/10 transition-all"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Deck image or icon */}
            {deckImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deckImage}
                alt="deck"
                className="w-10 h-14 object-cover rounded-lg flex-shrink-0 ring-1 ring-white/10"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isNumerology ? "bg-blue-500/10 text-blue-500" : "bg-rose-500/10 text-rose-500"}`}>
                {isNumerology ? <Hash weight="bold" size={18} /> : <Sparkle weight="fill" size={18} />}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-zinc-200 truncate">{title}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{formatDate(date)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isNumerology && cards?.length && (
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{cards.length} kartu</span>
            )}
            {isNumerology && (
              <div className="flex gap-2">
                {lifePath && (
                  <span className="text-xs font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">LP: {lifePath}</span>
                )}
                {destiny && (
                  <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">D: {destiny}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              {/* Card visual gallery */}
              {!isNumerology && cards && Array.isArray(cards) && (
                <div className="flex flex-wrap gap-4 mb-6">
                  {cards.map((c: any, i: number) => {
                    const cardData = c?.card || c;
                    const img = cardData?.image;
                    const name = cardData?.name || "?";
                    const isReversed = c?.isReversed;

                    return (
                      <div key={i} className="flex flex-col items-center gap-2 group/card">
                        <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-white/10 shadow-lg bg-zinc-900/50 group-hover/card:ring-white/30 transition-all">
                          {img ? (
                            <div className={`relative w-full h-full transition-transform duration-500 group-hover/card:scale-110 ${isReversed ? "rotate-180" : ""}`}>
                              <Image
                                src={img}
                                alt={name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkle size={16} className="text-zinc-700" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter text-center max-w-[80px] leading-tight group-hover/card:text-zinc-300 transition-colors">
                          {name} {isReversed ? "(R)" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {content && (
                <div className="prose prose-invert prose-sm prose-zinc max-w-none prose-p:leading-relaxed prose-blockquote:border-l-rose-500 prose-blockquote:bg-rose-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-strong:text-rose-400 mb-4">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-white/5">
                {content && (
                  <button
                    onClick={() => onShare(content)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                  >
                    <Export size={12} /> Bagikan Kutipan
                  </button>
                )}
                <button
                  onClick={() => onDelete(id)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors uppercase tracking-widest ml-auto"
                >
                  <Trash size={12} /> Hapus
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function JournalView() {
  const { user, loading } = useAuth();
  const [dbEntries, setDbEntries] = useState<DbEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocalEntries(getJournalEntries());
  }, []);

  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const fetchDbEntries = useCallback(async () => {
    if (!user) return;
    setIsFetching(true);
    setFetchError(false);
    setFetchErrorMsg(null);
    try {
      const res = await getDbJournalEntries(user.uid);
      if (res.success) {
        setDbEntries(res.entries as DbEntry[]);
      } else {
        setFetchError(true);
        setFetchErrorMsg((res as any).error || "Gagal mengambil data");
      }
    } catch (err: any) {
      setFetchError(true);
      setFetchErrorMsg(err.message || "Gagal menghubungi server");
    } finally {
      setIsFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchDbEntries();
  }, [user, fetchDbEntries]);

  const handleDeleteDb = async (id: string) => {
    if (!user) return;
    setDbEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteDbJournalEntry(id, user.uid);
  };

  const handleDeleteLocal = (id: string) => {
    deleteJournalEntry(id);
    setLocalEntries(getJournalEntries());
  };

  const handleClearAll = async () => {
    if (!user) return;
    setIsClearing(true);
    await clearDbJournal(user.uid);
    setDbEntries([]);
    setIsClearing(false);
  };

  const handleClearLocal = () => {
    clearJournal();
    setLocalEntries([]);
  };

  if (!mounted) return null;

  const isLoggedIn = !!user;
  const entries = isLoggedIn ? dbEntries : localEntries;
  const isEmpty = entries.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col py-12 px-4 relative z-10 pt-20">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl tracking-tighter leading-none text-white font-medium mb-4 flex items-center justify-center gap-3">
          <BookOpen weight="fill" className="text-emerald-500" /> Jurnal Spiritual
        </h1>
        <p className="text-base text-zinc-400 max-w-[55ch] mx-auto leading-relaxed">
          Kumpulan bacaan dan pesan yang pernah kamu terima. Refleksikan kembali perjalanan spiritualmu.
        </p>
      </div>

      {/* Not logged in */}
      {!loading && !isLoggedIn && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center gap-5 mb-8 border-amber-500/20 bg-amber-500/5"
        >
          <Warning size={36} className="text-amber-400" />
          <div className="text-center">
            <p className="text-zinc-200 font-medium mb-1">Login untuk Jurnal Cloud</p>
            <p className="text-zinc-500 text-sm max-w-[45ch]">
              Bacaan yang kamu simpan saat ini hanya tersimpan di perangkat ini. Login dengan Google agar tersimpan permanen di cloud.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600 uppercase tracking-widest">
            <Sun size={12} /> Menampilkan jurnal lokal di bawah
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isLoggedIn && isFetching && (
        <div className="flex justify-center py-16">
          <CircleNotch size={32} className="text-zinc-600 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {isLoggedIn && fetchError && !isFetching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[300px] glass-card rounded-[2.5rem] p-8 gap-4 mb-8 border-rose-500/20"
        >
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
            <Warning size={32} weight="duotone" />
          </div>
          <h3 className="text-xl font-medium text-zinc-200">Gagal memuat jurnal</h3>
          <p className="text-sm text-zinc-500 leading-relaxed text-center max-w-sm">
            {fetchErrorMsg || "Terjadi kesalahan saat menghubungi server. Pastikan database sudah terhubung."}
          </p>
          <button
            onClick={() => fetchDbEntries()}
            className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-all active:scale-[0.98]"
          >
            <ArrowClockwise size={16} />
            Coba Lagi
          </button>
        </motion.div>
      )}

      {/* Empty state */}
      {!isFetching && !fetchError && isEmpty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px] glass-card rounded-[2.5rem] gap-4"
        >
          <ClockClockwise size={40} className="text-zinc-600" />
          <p className="text-zinc-500 text-center">
            Belum ada catatan.
            <br />
            <span className="text-sm">Mulai bacaan Tarot atau Numerologi untuk menyimpan hasilnya di sini.</span>
          </p>
          {!isLoggedIn && (
            <p className="text-xs text-zinc-600 uppercase tracking-widest flex items-center gap-1.5 mt-2">
              <SignIn size={12} /> Login via menu navigasi untuk jurnal cloud
            </p>
          )}
        </motion.div>
      )}

      {/* Entry list */}
      {!isFetching && !fetchError && !isEmpty && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-600 uppercase tracking-widest">
              {entries.length} catatan {isLoggedIn ? "• Cloud" : "• Lokal"}
            </span>
            <button
              onClick={isLoggedIn ? handleClearAll : handleClearLocal}
              disabled={isClearing}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50"
            >
              {isClearing ? <CircleNotch size={12} className="animate-spin" /> : <Trash size={12} />}
              Hapus Semua
            </button>
          </div>

          <AnimatePresence>
            {isLoggedIn
              ? dbEntries.map((entry, index) => (
                  <motion.div key={entry.id} style={{ "--index": index } as any}>
                    <EntryCard
                      id={entry.id}
                      type={entry.type}
                      title={entry.title}
                      content={entry.content}
                      theme={entry.theme}
                      cards={entry.cards}
                      deckImage={entry.deckImage}
                      numerologyData={entry.numerologyData}
                      date={entry.createdAt}
                      onDelete={handleDeleteDb}
                      onShare={setShareText}
                    />
                  </motion.div>
                ))
              : localEntries.map((entry, index) => (
                  <motion.div key={entry.id} style={{ "--index": index } as any}>
                    <EntryCard
                      id={entry.id}
                      type={entry.type}
                      title={entry.type === "tarot"
                        ? `Bacaan Tarot${entry.theme ? ` · ${entry.theme}` : ""}`
                        : `Numerologi${entry.name ? ` · ${entry.name}` : ""}`}
                      content={entry.summary || entry.reading || ""}
                      theme={entry.theme}
                      cards={entry.cards}
                      numerologyData={entry.lifePath ? { lifePath: entry.lifePath, destiny: entry.destiny } : undefined}
                      date={String(entry.timestamp)}
                      onDelete={handleDeleteLocal}
                      onShare={setShareText}
                    />
                  </motion.div>
                ))}
          </AnimatePresence>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareText && (
          <ShareableQuote text={shareText} onClose={() => setShareText(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
