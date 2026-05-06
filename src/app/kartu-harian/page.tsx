import DailyCard from "@/components/DailyCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DailyCardPage() {
  return (
    <main className="relative flex-1 w-full flex flex-col min-h-[100dvh]">
      {/* Subtle Grain Overlay for Premium Texture */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full">
        <ErrorBoundary>
          <DailyCard />
        </ErrorBoundary>
      </div>
    </main>
  );
}
