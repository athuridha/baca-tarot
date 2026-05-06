"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { tarotCards, TarotCard } from "@/data/tarotData";
import { Sparkle, ShuffleAngular, StarFour, CaretLeft, CaretRight, MagicWand, CalendarBlank, BookOpen, Export, Heart, Briefcase, YinYang, Compass, X, CircleNotch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { drawCards, getCardMeaning, DrawnCard } from "@/lib/tarot-logic";
import { saveJournalEntry } from "@/app/actions/journal";
import { useAuth } from "@/components/AuthProvider";
import { toPng } from "html-to-image";

const SPRING = { type: "spring", stiffness: 100, damping: 20 } as const;

const THEMES = [
  { id: "general", labelId: "Umum", labelEn: "General", icon: Compass, color: "rose" },
  { id: "love", labelId: "Asmara & Cinta", labelEn: "Love & Romance", icon: Heart, color: "pink" },
  { id: "career", labelId: "Karier & Keuangan", labelEn: "Career & Finance", icon: Briefcase, color: "amber" },
  { id: "spirit", labelId: "Jiwa, Raga & Batin", labelEn: "Mind, Body, Spirit", icon: YinYang, color: "emerald" },
] as const;

type ThemeId = typeof THEMES[number]["id"];

// Shareable Quote Card
function ShareQuoteModal({ text, onClose }: { text: string; onClose: () => void }) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!quoteRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(quoteRef.current, { quality: 1, pixelRatio: 2, backgroundColor: "#09090b" });
      const link = document.createElement("a");
      link.download = `tarot-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  const quoteMatch = text.match(/>\s*(.+)/);
  const quoteText = quoteMatch ? quoteMatch[1].replace(/\*\*/g, "") : text.substring(0, 200);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={SPRING} className="flex flex-col items-center gap-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}
      >
        <div ref={quoteRef} className="w-full rounded-3xl p-10 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #18181b 0%, #09090b 50%, #1c1917 100%)" }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
          <div className="absolute top-6 right-6 opacity-10"><Sparkle weight="fill" size={48} className="text-rose-500" /></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div className="text-rose-500/60 text-6xl font-serif leading-none">&ldquo;</div>
            <p className="text-zinc-200 text-lg md:text-xl leading-relaxed font-medium -mt-4 px-2">{quoteText}</p>
            <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-[0.2em] pt-2 border-t border-white/5">
              <Sparkle weight="fill" size={12} className="text-rose-500" /> Baca Tarot
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <Export size={16} />}
            {isExporting ? "Mengunduh..." : "Unduh Gambar"}
          </button>
          <button onClick={onClose} className="px-4 py-3 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"><X size={16} /></button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TarotReading() {
  const { user } = useAuth();
  const [step, setStep] = useState<"select" | "shuffling" | "reading">("select");
  const [spreadSize, setSpreadSize] = useState<1 | 3 | 6>(3);
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([]);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [userStory, setUserStory] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("general");
  const [isSavedToJournal, setIsSavedToJournal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allRevealed = revealedCards.length > 0 && revealedCards.every(Boolean);

  const generateSummary = async () => {
    setIsGenerating(true);
    const formattedBirthDate = birthDate;

    try {
      const res = await fetch("/api/tarot-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: userStory,
          fullName,
          birthDate: formattedBirthDate,
          cards: drawnCards,
          spreadSize,
          language,
          theme,
        }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary("Maaf, ether sedang terganggu. Tidak bisa mendapatkan ringkasan saat ini.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);
    
    if (val.length >= 5) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    
    setBirthDate(val);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return dateStr;
  };

  const startReading = useCallback(() => {
    setStep("shuffling");
    
    setTimeout(() => {
      const newDrawnCards = drawCards(spreadSize, language);
      setDrawnCards(newDrawnCards);
      setRevealedCards(new Array(spreadSize).fill(false));
      setActiveIndex(0);
      setStep("reading");
    }, 2000);
  }, [spreadSize, language]);

  const revealCard = (index: number) => {
    setRevealedCards((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setActiveIndex(index);
  };

  const resetReading = () => {
    setStep("select");
    setDrawnCards([]);
    setRevealedCards([]);
    setActiveIndex(0);
    setSummary(null);
    setIsGenerating(false);
    setIsSavedToJournal(false);
  };

  const handleSaveToJournal = async () => {
    if (isSavedToJournal) return;
    if (!user) {
      alert(language === "id" ? "Silakan login dengan akun Google terlebih dahulu dari menu navigasi." : "Please sign in with Google from the navigation menu first.");
      return;
    }
    const res = await saveJournalEntry({
      userId: user.uid,
      email: user.email || "",
      name: user.displayName || undefined,
      image: user.photoURL || undefined,
      type: "tarot",
      title: language === "id" ? `Bacaan Tarot: ${THEMES.find(t => t.id === theme)?.labelId || "Umum"}` : `Tarot Reading: ${THEMES.find(t => t.id === theme)?.labelEn || "General"}`,
      content: summary || "",
      cards: drawnCards,
      theme: THEMES.find(t => t.id === theme)?.labelId || "Umum",
      deckImage: drawnCards[0]?.card?.image || undefined,
    });
    if (res.success) {
      setIsSavedToJournal(true);
    } else {
      alert(language === "id" ? "Gagal menyimpan ke jurnal." : "Failed to save to journal.");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 min-h-[100dvh] flex flex-col">
      {/* Header */}
      <div 
        className={cn(
          "mb-8 md:mb-12 text-center space-y-4 pt-10 transition-all duration-700",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"
        )}
      >
        <h1 className="text-4xl md:text-5xl font-sans tracking-tighter leading-none text-zinc-100 font-medium flex items-center justify-center gap-3">
          <StarFour weight="fill" className="text-rose-500 w-8 h-8" />
          Baca <span className="text-rose-500">Tarot</span>
        </h1>
        {step === "select" && (
          <div className="flex flex-col gap-4">
            <p className="text-zinc-400 text-sm md:text-base max-w-[50ch] mx-auto leading-relaxed">
              {language === "id" ? "Fokuskan pikiranmu pada pertanyaan atau area hidup yang ingin kamu ketahui. Pilih tebaran kartumu untuk memulai." : "Focus your mind on a question or an area of your life you want to explore. Select your spread to begin."}
            </p>
            <a 
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 hover:text-rose-500 transition-colors mx-auto flex items-center gap-2"
            >
              <MagicWand size={12} />
              API Documentation (OAS)
            </a>
          </div>
        )}
      </div>

      {/* Select Phase - NO AnimatePresence wrapper, direct conditional render */}
      {step === "select" && (
        <div
          className={cn(
            "flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full gap-8 transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          <div className="flex items-center justify-center gap-3 w-full mb-2">
            <button onClick={() => setLanguage("id")} className={cn("px-6 py-2 rounded-full border text-sm font-medium transition-all", language === "id" ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]" : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-zinc-200")}>Bahasa Indonesia</button>
            <button onClick={() => setLanguage("en")} className={cn("px-6 py-2 rounded-full border text-sm font-medium transition-all", language === "en" ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]" : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-zinc-200")}>English</button>
          </div>

          <div className="w-full flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full flex flex-col gap-2">
                <label className="text-zinc-400 font-medium tracking-wide text-sm px-2">
                  {language === "id" ? "Nama Lengkap (Opsional)" : "Full Name (Optional)"}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-zinc-600"
                />
              </div>
              <div className="w-full flex flex-col gap-2">
                <label className="text-zinc-400 font-medium tracking-wide text-sm px-2">
                  {language === "id" ? "Tanggal Lahir (Opsional)" : "Date of Birth (Optional)"}
                </label>
                <div className="relative group">
                  <CalendarBlank className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-rose-500 transition-colors pointer-events-none w-5 h-5 z-10" />
                  <input
                    type="text"
                    value={birthDate}
                    onChange={handleDateChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-4 pr-12 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <label className="text-zinc-400 font-medium tracking-wide text-sm px-2">
                {language === "id" ? "Ceritakan situasimu (Opsional)" : "Tell your story (Optional)"}
              </label>
              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder={language === "id" ? "Apa yang sedang membebani pikiranmu? Atau apa yang ingin kamu ketahui..." : "What is weighing on your mind? Or what do you want to know..."}
                className="w-full h-32 bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500/50 resize-none transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Theme Selection */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-zinc-400 font-medium tracking-wide text-sm px-2">
                {language === "id" ? "Fokus Bacaan" : "Reading Theme"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-300 text-sm",
                        isSelected
                          ? `bg-${t.color}-500/10 border-${t.color}-500/40 text-${t.color}-500 ring-1 ring-${t.color}-500/30`
                          : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      )}
                      style={isSelected ? { background: `color-mix(in srgb, var(--color-${t.color}-500) 10%, transparent)` } : {}}
                    >
                      <Icon weight={isSelected ? "fill" : "regular"} size={20} />
                      {language === "id" ? t.labelId : t.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <button
              onClick={() => setSpreadSize(1)}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-3 text-left",
                spreadSize === 1 
                  ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)] ring-1 ring-rose-500" 
                  : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50"
              )}
            >
              <div className="text-xl font-medium text-zinc-100">Daily Insight</div>
              <div className="text-sm text-zinc-400">{language === "id" ? "1 Card Spread. Jawaban cepat dan fokus untuk situasi saat ini." : "1 Card Spread. A quick, focused answer for your present moment."}</div>
            </button>
            
            <button
              onClick={() => setSpreadSize(3)}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-3 text-left",
                spreadSize === 3 
                  ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)] ring-1 ring-rose-500" 
                  : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50"
              )}
            >
              <div className="text-xl font-medium text-zinc-100">Past, Present, Future</div>
              <div className="text-sm text-zinc-400">{language === "id" ? "3 Card Spread. Bacaan lebih dalam yang melihat alur waktu dari situasimu." : "3 Card Spread. A deeper reading looking at the timeline of your situation."}</div>
            </button>

            <button
              onClick={() => setSpreadSize(6)}
              className={cn(
                "p-6 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-3 text-left",
                spreadSize === 6 
                  ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)] ring-1 ring-rose-500" 
                  : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50"
              )}
            >
              <div className="text-xl font-medium text-zinc-100">Deep Analysis</div>
              <div className="text-sm text-zinc-400">{language === "id" ? "6 Card Spread. Analisis mendalam termasuk faktor tersembunyi, saran, dan hasil akhir." : "6 Card Spread. Deep analysis including hidden factors, advice, and outcome."}</div>
            </button>
          </div>

          <button
            onClick={startReading}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white transition-all active:scale-[0.98] font-medium tracking-tight"
          >
            <ShuffleAngular weight="bold" className="w-5 h-5" />
            {language === "id" ? "Kocok & Ambil Kartu" : "Shuffle & Draw"}
          </button>
        </div>
      )}

      {/* Shuffling Phase */}
      {step === "shuffling" && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative flex justify-center items-center w-full max-w-[260px] aspect-[2/3] mx-auto mb-10">
            {/* Stack of cards illusion */}
            {[2, 1, 0].map((i) => (
              <motion.div
                key={`deck-card-${i}`}
                animate={{
                  x: [0, i % 2 === 0 ? 40 : -40, 0],
                  y: [0, i % 2 === 0 ? -15 : 15, 0],
                  rotate: [i * 2, i % 2 === 0 ? -10 : 10, i * 2],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.15,
                }}
                className="absolute inset-0 rounded-2xl glass-card flex flex-col items-center justify-center border-rose-500/20"
                style={{ zIndex: i }}
              >
                <StarFour weight="duotone" className="w-12 h-12 text-rose-500/30" />
              </motion.div>
            ))}
          </div>
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-zinc-400 uppercase tracking-[0.3em] text-sm"
          >
            {language === "id" ? "Mengocok kartu..." : "Shuffling the deck..."}
          </motion.p>
        </div>
      )}

      {/* Reading Phase */}
      {step === "reading" && (
        <motion.div
          key="reading-phase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col w-full"
        >
          {/* Cards Display Grid */}
          <div className={cn(
            "grid gap-4 gap-y-8 sm:gap-6 sm:gap-y-10 md:gap-x-10 md:gap-y-14 mb-6 md:mb-10 justify-items-center w-full mx-auto transition-all duration-500",
            spreadSize === 1 ? "grid-cols-1 max-w-[240px] mx-auto" : 
            spreadSize === 3 ? "grid-cols-3 max-w-md sm:max-w-xl md:max-w-2xl mx-auto" : 
            "grid-cols-3 md:grid-cols-3 lg:grid-cols-6 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-none"
          )}>
            {drawnCards.map((drawn, index) => {
              const isRevealed = revealedCards[index];
              const isSelected = activeIndex === index;

              return (
                <div 
                  key={`drawn-wrapper-${index}`} 
                  className={cn(
                    "flex flex-col items-center gap-2 sm:gap-4 w-full transition-all duration-500",
                    spreadSize === 1 ? "max-w-[240px] md:max-w-[280px]" : 
                    "w-full"
                  )}
                >
                  <motion.div
                    key={`drawn-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1, 
                      type: "spring", 
                      stiffness: 100, 
                      damping: 15 
                    }}
                    onClick={() => revealCard(index)}
                    className={cn(
                      "relative w-full aspect-[2/3] rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-500",
                      isSelected && isRevealed ? "-translate-y-4 sm:-translate-y-6 md:-translate-y-8 shadow-[0_30px_60px_-15px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/30 z-20" : "hover:-translate-y-3 hover:shadow-2xl z-10",
                      !isRevealed && "glass-card border-rose-500/20 shadow-xl overflow-hidden"
                    )}
                    style={{ perspective: "1000px" }}
                  >
                    {/* Shimmer Effect for Unrevealed Cards */}
                    {!isRevealed && (
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"
                      />
                    )}
                    
                    {/* Magnetic Inner Glow */}
                    {!isRevealed && (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                    )}

                    {/* Card Content - simplified flip without AnimatePresence for iOS compat */}
                    {!isRevealed ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                        <StarFour weight="duotone" className="w-8 h-8 text-rose-500/40 mb-2" />
                        <span className="text-[10px] uppercase tracking-widest font-medium">Draw</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/10">
                        <div className={cn(
                          "relative w-full h-full transition-transform duration-700",
                          drawn.isReversed && "rotate-180"
                        )}>
                          <Image 
                            src={drawn.card.image}
                            alt={drawn.card.name}
                            fill
                            sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 180px, 200px"
                            className="object-cover"
                            priority
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Position Label - Now in the flow */}
                  <div className="text-center h-8 sm:h-10 flex items-center justify-center px-1 sm:px-2">
                    <span className={cn(
                      "text-[8px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-semibold transition-all duration-300 leading-tight block",
                      isSelected ? "text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-zinc-500"
                    )}>
                      {drawn.positionName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Card Interpretation */}
          <div className="max-w-3xl mx-auto w-full min-h-[200px]">
            {revealedCards[activeIndex] ? (
              <motion.div
                key={`interpretation-${activeIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING}
                className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-rose-500 font-medium tracking-widest uppercase text-sm">
                      <Sparkle weight="fill" />
                      {drawnCards[activeIndex].positionName}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-medium tracking-tighter text-zinc-100 flex items-center gap-3">
                      {drawnCards[activeIndex].card.name}
                      {drawnCards[activeIndex].isReversed && (
                        <span className="text-rose-500/80 text-xl md:text-3xl">(Reversed)</span>
                      )}
                    </h2>
                  </div>
                  
                  <div className="h-px w-16 bg-white/10" />
                  
                  <div className="prose prose-invert prose-zinc max-w-none">
                    <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-line">
                      {getCardMeaning(drawnCards[activeIndex], language)}
                    </p>
                  </div>
                </div>
                
                  {/* Navigation between cards if spread > 1 */}
                  {spreadSize > 1 && (
                    <div className="mt-8 flex justify-between items-center pt-4 border-t border-white/5">
                    <button
                      onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                      disabled={activeIndex === 0}
                      className="flex items-center gap-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                    >
                      <CaretLeft weight="bold" /> Previous
                    </button>
                    <button
                      onClick={() => setActiveIndex(Math.min(spreadSize - 1, activeIndex + 1))}
                      disabled={activeIndex === spreadSize - 1 || !revealedCards[activeIndex + 1]}
                      className="flex items-center gap-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                    >
                      Next <CaretRight weight="bold" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <StarFour weight="duotone" className="w-8 h-8" />
                <p>{language === "id" ? "Klik kartu di atas untuk melihat artinya." : "Click on the card above to reveal its insights."}</p>
              </div>
            )}

            {/* Summary Section */}
            {allRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                {!summary && !isGenerating && (
                  <div className="flex flex-col items-center gap-4 p-8 glass-card rounded-3xl border-rose-500/20 bg-rose-500/5">
                    <p className="text-zinc-300 text-center max-w-lg">
                      {language === "id" ? "Semua kartu telah terbuka. Mari kita lihat pesan di baliknya dan bagaimana ini berhubungan dengan ceritamu." : "All cards have been revealed. Let's explore their message and how it connects to your story."}
                    </p>
                    <button
                      onClick={generateSummary}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-[0.98] font-medium shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]"
                    >
                      <MagicWand weight="fill" className="w-5 h-5" />
                      {language === "id" ? "Sintesis Bacaan Tarot" : "Synthesize Tarot Reading"}
                    </button>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex flex-col items-center justify-center p-12 glass-card rounded-3xl gap-6 border-white/5">
                    <Sparkle weight="fill" className="w-8 h-8 text-rose-500 animate-spin-slow" />
                    <p className="text-zinc-400 animate-pulse tracking-widest uppercase text-sm">{language === "id" ? "Menyelaraskan energi dengan ceritamu..." : "Aligning the energies with your story..."}</p>
                  </div>
                )}

                {summary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden border-rose-500/20"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
                    <div className="flex items-center gap-3 text-rose-500 mb-6">
                      <MagicWand weight="fill" className="w-6 h-6" />
                      <h3 className="text-xl font-medium tracking-tight">{language === "id" ? "Pesan Semesta Untukmu" : "Message from the Universe"}</h3>
                    </div>
                    <div className="prose prose-invert prose-zinc max-w-none prose-p:leading-relaxed prose-headings:font-medium prose-a:text-rose-500 prose-p:my-3 prose-headings:mb-2 prose-headings:mt-6 prose-ul:my-2 prose-li:my-1 prose-blockquote:border-l-rose-500 prose-blockquote:bg-rose-500/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:font-medium prose-blockquote:not-italic prose-blockquote:my-6 prose-strong:text-rose-400">
                      <div className="text-zinc-300 text-lg">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Save & Share Actions */}
                {summary && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={handleSaveToJournal}
                      disabled={isSavedToJournal}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <BookOpen size={16} />
                      {isSavedToJournal ? "Tersimpan di Jurnal" : "Simpan ke Jurnal"}
                    </button>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
                    >
                      <Export size={16} />
                      Bagikan Kutipan
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reset Action */}
            <div className="flex justify-center mt-12">
              <button
                onClick={resetReading}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
              >
                End Reading
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Share Quote Modal */}
      <AnimatePresence>
        {showShareModal && summary && (
          <ShareQuoteModal text={summary} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
