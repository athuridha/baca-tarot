"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Fingerprint, Calendar, ArrowRight, CircleNotch, BookOpen, Export, X } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveJournalEntry } from "@/app/actions/journal";
import { useAuth } from "@/components/AuthProvider";
import { toPng } from "html-to-image";

export default function NumerologyCalculator() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    lifePath: number | null;
    destiny: number | null;
    reading: string;
  } | null>(null);
  const [isSavedToJournal, setIsSavedToJournal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !birthDate) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/numerology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, birthDate }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsSavedToJournal(false);
    }
  };

  const handleSaveToJournal = async () => {
    if (!result || isSavedToJournal) return;
    if (!user) {
      alert("Silakan login dengan akun Google terlebih dahulu dari menu navigasi.");
      return;
    }
    const res = await saveJournalEntry({
      userId: user.uid,
      email: user.email || "",
      name: user.displayName || undefined,
      image: user.photoURL || undefined,
      type: "numerology",
      title: `Bacaan Numerologi: ${name || "Anonim"}`,
      content: result.reading,
      numerologyData: {
        name: name || undefined,
        birthDate: birthDate || undefined,
        lifePath: result.lifePath,
        destiny: result.destiny,
      }
    });
    if (res.success) {
      setIsSavedToJournal(true);
    } else {
      alert("Gagal menyimpan ke jurnal.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-12 px-4 relative z-10">
      
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl tracking-tighter leading-none text-zinc-900 dark:text-white font-medium mb-4 flex items-center justify-center gap-3">
          <Sparkle weight="fill" className="text-rose-500" /> Numerology
        </h1>
        <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-[65ch] mx-auto leading-relaxed">
          Temukan makna di balik namamu dan tanggal lahirmu. Biarkan AI merajut angka-angkamu menjadi sebuah pesan spiritual yang mendalam.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
        {/* Form Section */}
        <motion.div 
          layout
          className="md:col-span-5 bg-white/5 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] h-fit"
        >
          <form onSubmit={handleCalculate} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Fingerprint size={16} className="text-rose-500" />
                Nama Lengkap (Sesuai Akte)
              </label>
              <input
                id="name"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="birthDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <Calendar size={16} className="text-rose-500" />
                Tanggal Lahir
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={isLoading}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-sm sm:text-base [&::-webkit-calendar-picker-indicator]:dark:invert disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={(!name && !birthDate) || isLoading}
              className="mt-4 w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl py-4 font-medium flex items-center justify-center gap-2 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" /> Sedang Menyelaraskan...
                </>
              ) : (
                <>
                  Hitung Angkaku <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:col-span-7 flex flex-col items-center justify-center h-full min-h-[400px] bg-white/2 dark:bg-zinc-900/20 backdrop-blur-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]"
            >
              <CircleNotch size={48} className="text-rose-500 animate-spin mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 animate-pulse">Menghitung takdir dan jalan hidupmu...</p>
            </motion.div>
          )}

          {!isLoading && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="md:col-span-7 flex flex-col gap-6"
            >
              {/* Numbers Showcase */}
              <div className="flex gap-4">
                {result.lifePath && (
                  <div className="flex-1 bg-white/5 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group">
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
                     <span className="text-sm tracking-widest text-zinc-500 uppercase font-medium relative z-10">Life Path</span>
                     <span className="text-4xl font-mono text-rose-500 relative z-10">{result.lifePath}</span>
                  </div>
                )}
                {result.destiny && (
                  <div className="flex-1 bg-white/5 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group">
                     <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                     <span className="text-sm tracking-widest text-zinc-500 uppercase font-medium relative z-10">Destiny</span>
                     <span className="text-4xl font-mono text-blue-500 relative z-10">{result.destiny}</span>
                  </div>
                )}
              </div>

              {/* AI Reading */}
              <div className="bg-white/5 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 rounded-[2.5rem] p-8 relative">
                <div className="prose prose-zinc dark:prose-invert max-w-none 
                  prose-headings:font-medium prose-headings:tracking-tight 
                  prose-h3:text-2xl prose-h3:text-rose-500
                  prose-p:leading-relaxed prose-p:text-zinc-600 dark:prose-p:text-zinc-300
                  prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-semibold
                  prose-blockquote:border-l-rose-500 prose-blockquote:bg-rose-50/50 dark:prose-blockquote:bg-rose-500/10 
                  prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl
                  prose-blockquote:not-italic prose-blockquote:text-zinc-800 dark:prose-blockquote:text-zinc-200
                  prose-blockquote:font-medium"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.reading}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  onClick={handleSaveToJournal}
                  disabled={isSavedToJournal}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-[0.98] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <BookOpen size={14} />
                  {isSavedToJournal ? "Tersimpan" : "Simpan ke Jurnal"}
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-[0.98] bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white"
                >
                  <Export size={14} /> Bagikan
                </button>
              </div>
            </motion.div>
          )}

          {!isLoading && !result && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-7 flex items-center justify-center h-full min-h-[400px] bg-white/2 dark:bg-zinc-900/20 backdrop-blur-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]"
            >
              <div className="text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center gap-4">
                <Sparkle size={32} weight="duotone" className="opacity-50" />
                <p className="text-sm">Masukkan data di samping untuk <br/>melihat pesan numerologimu.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && result?.reading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }} className="flex flex-col items-center gap-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}
            >
              <ShareableNumerologyCard text={result.reading} onClose={() => setShowShareModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareableNumerologyCard({ text, onClose }: { text: string; onClose: () => void }) {
  const quoteRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!quoteRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(quoteRef.current, { quality: 1, pixelRatio: 2, backgroundColor: "#09090b" });
      const link = document.createElement("a");
      link.download = `numerology-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); } finally { setIsExporting(false); }
  };

  const quoteMatch = text.match(/>\s*(.+)/);
  const quoteText = quoteMatch ? quoteMatch[1].replace(/\*\*/g, "") : text.substring(0, 200);

  return (
    <>
      <div ref={quoteRef} className="w-full rounded-3xl p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #18181b 0%, #09090b 50%, #1c1917 100%)" }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />
        <div className="absolute top-6 right-6 opacity-10"><Sparkle weight="fill" size={48} className="text-blue-500" /></div>
        <div className="relative z-10 flex flex-col gap-6">
          <div className="text-blue-500/60 text-6xl font-serif leading-none">&ldquo;</div>
          <p className="text-zinc-200 text-lg md:text-xl leading-relaxed font-medium -mt-4 px-2">{quoteText}</p>
          <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-[0.2em] pt-2 border-t border-white/5">
            <Sparkle weight="fill" size={12} className="text-blue-500" /> Numerologi
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleExport} disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? <CircleNotch size={16} className="animate-spin" /> : <Export size={16} />}
          {isExporting ? "Mengunduh..." : "Unduh Gambar"}
        </button>
        <button onClick={onClose} className="px-4 py-3 rounded-full text-zinc-400 hover:text-white transition-colors border border-white/10"><X size={16} /></button>
      </div>
    </>
  );
}
