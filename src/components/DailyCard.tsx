"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, ArrowClockwise, Sparkle, BookOpen } from "@phosphor-icons/react";
import { tarotCards } from "@/data/tarotData";
import { getDailyCard, setDailyCard, saveJournalEntry } from "@/lib/journal";
import { saveJournalEntry as saveJournalEntryAction } from "@/app/actions/journal";
import { getCardMeaning, type DrawnCard } from "@/lib/tarot-logic";
import { useAuth } from "./AuthProvider";

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function DailyCardDraw() {
  const [drawn, setDrawn] = useState<DrawnCard | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getDailyCard();
    if (existing) {
      const card = tarotCards[existing.cardIndex];
      if (card) {
        setDrawn({
          card,
          isReversed: existing.isReversed,
          positionName: "Fokus Hari Ini",
        });
        setIsRevealed(true);
      }
    }
  }, []);

  const drawDailyCard = () => {
    const randomIndex = Math.floor(Math.random() * tarotCards.length);
    const isReversed = Math.random() > 0.7;
    const card = tarotCards[randomIndex];

    setDailyCard(randomIndex, isReversed);

    setDrawn({
      card,
      isReversed,
      positionName: "Fokus Hari Ini",
    });

    // Animate: show card back first, then reveal after a short delay
    setIsRevealed(false);
    setTimeout(() => setIsRevealed(true), 800);
  };

  const { user } = useAuth();

  const saveToJournal = async () => {
    if (!drawn || isSaved) return;

    if (user) {
      // Cloud save
      const res = await saveJournalEntryAction({
        userId: user.uid,
        email: user.email || "",
        name: user.displayName || undefined,
        image: user.photoURL || undefined,
        type: "tarot",
        title: "Kartu Hari Ini",
        content: getCardMeaning(drawn, "id"),
        cards: [drawn],
        deckImage: drawn.card.image,
      });
      if (res.success) setIsSaved(true);
    } else {
      // Local save
      saveJournalEntry({
        type: "tarot",
        cards: [drawn],
        spreadSize: 1,
        summary: getCardMeaning(drawn, "id"),
        language: "id",
        deckImage: drawn.card.image,
      });
      setIsSaved(true);
    }
  };

  if (!mounted) return null;

  const todayDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-12 px-4 relative z-10 pt-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl tracking-tighter leading-none text-white font-medium mb-4 flex items-center justify-center gap-3">
          <Sun weight="fill" className="text-amber-500" /> Kartu Hari Ini
        </h1>
        <p className="text-base text-zinc-400 max-w-[50ch] mx-auto leading-relaxed">
          {todayDate}
        </p>
        <p className="text-sm text-zinc-500 mt-2 max-w-[55ch] mx-auto">
          Tarik satu kartu setiap hari sebagai fokus dan pengingat untukmu. Kartu ini akan direset setiap pagi.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!drawn ? (
          <motion.div
            key="draw-prompt"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING}
            className="flex flex-col items-center gap-8"
          >
            {/* Big draw button - card-shaped */}
            <motion.button
              onClick={drawDailyCard}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative w-[220px] aspect-[2/3] rounded-3xl glass-card border-amber-500/20 flex flex-col items-center justify-center gap-4 cursor-pointer group overflow-hidden"
            >
              {/* Shimmer */}
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent skew-x-12 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              <Sun weight="duotone" className="w-12 h-12 text-amber-500/40 group-hover:text-amber-500/70 transition-colors" />
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-400 group-hover:text-amber-500 transition-colors font-medium">
                Tarik Kartu
              </span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="card-display"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-col items-center gap-8 w-full max-w-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 w-full items-start">
              {/* Card visual */}
              <div className="md:col-span-2 flex justify-center">
                <motion.div
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: isRevealed ? 0 : 180 }}
                  transition={{ duration: 0.7, type: "spring", stiffness: 80, damping: 15 }}
                  className="relative w-[200px] aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
                  style={{ perspective: 1000 }}
                >
                  {isRevealed ? (
                    <div className={`relative w-full h-full ${drawn.isReversed ? "rotate-180" : ""}`}>
                      <Image
                        src={drawn.card.image}
                        alt={drawn.card.name}
                        fill
                        sizes="200px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 glass-card flex items-center justify-center">
                      <Sparkle weight="duotone" className="w-10 h-10 text-amber-500/40" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Card info */}
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, ...SPRING }}
                  className="md:col-span-3 flex flex-col gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-500 font-medium tracking-widest uppercase text-xs">
                      <Sun weight="fill" size={14} />
                      Fokus Hari Ini
                    </div>
                    <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-zinc-100">
                      {drawn.card.name}
                      {drawn.isReversed && (
                        <span className="text-amber-500/80 text-lg ml-2">(Reversed)</span>
                      )}
                    </h2>
                  </div>

                  <div className="h-px w-12 bg-white/10" />

                  <p className="text-zinc-300 leading-relaxed">
                    {getCardMeaning(drawn, "id")}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <button
                      onClick={saveToJournal}
                      disabled={isSaved}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <BookOpen size={16} />
                      {isSaved ? "Tersimpan di Jurnal" : "Simpan ke Jurnal"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
