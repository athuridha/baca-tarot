"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, SignIn, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/components/AuthProvider";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const links = [
  { href: "/", label: "Tarot" },
  { href: "/kartu-harian", label: "Kartu Harian" },
  { href: "/numerologi", label: "Numerologi" },
  { href: "/jurnal", label: "Jurnal" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className="fixed top-6 left-0 right-0 z-50 hidden md:flex justify-center pointer-events-none px-4"
      >
        <nav className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
          
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          
          {!loading && (
            user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <SignOut size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <SignIn size={16} />
                <span>Login</span>
              </button>
            )
          )}
        </nav>
      </motion.div>

      {/* Mobile Navigation Trigger */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setMobileOpen(true)}
        className="fixed top-5 right-5 z-50 md:hidden w-10 h-10 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
      >
        <List weight="bold" size={18} />
      </motion.button>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className="absolute top-0 right-0 w-[280px] h-full bg-zinc-900/95 backdrop-blur-xl border-l border-white/5 flex flex-col p-6 pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X weight="bold" size={18} />
              </button>

              <div className="flex flex-col gap-2">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`relative px-5 py-3.5 rounded-2xl text-base font-medium transition-all ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-2 border-t border-white/5 pt-6">
                {!loading && (
                  user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 px-2">
                        {user.photoURL && (
                          <img src={user.photoURL} alt="User avatar" className="w-8 h-8 rounded-full border border-white/10" />
                        )}
                        <span className="text-sm font-medium text-zinc-300 truncate">{user.displayName || user.email}</span>
                      </div>
                      <button
                        onClick={() => { handleLogout(); setMobileOpen(false); }}
                        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all w-full text-left"
                      >
                        <SignOut size={20} />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { handleLogin(); setMobileOpen(false); }}
                      className="flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl text-base font-medium bg-white/10 text-white hover:bg-white/20 transition-all w-full"
                    >
                      <SignIn size={20} />
                      Login with Google
                    </button>
                  )
                )}
              </div>

              <div className="mt-auto text-[10px] text-zinc-600 uppercase tracking-[0.2em] text-center">
                Baca Tarot v1.0
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
