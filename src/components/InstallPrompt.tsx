import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLaunchingPrompt, setIsLaunchingPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled || isDismissed) {
    return null;
  }

  const showIOSHint = isIOS() && !deferredPrompt;

  if (!deferredPrompt && !showIOSHint) {
    return null;
  }

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsLaunchingPrompt(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setIsLaunchingPrompt(false);
    setDeferredPrompt(null);

    if (result.outcome !== "accepted") {
      setIsDismissed(true);
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:w-[360px]">
      <div className="rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.96))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.38)] backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent">Install RolePrep</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {showIOSHint
                ? "Open this app from your home screen for the full-screen experience."
                : "Install RolePrep directly from the browser for a faster, app-like experience."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-slate-300 transition hover:bg-white/10"
            aria-label="Dismiss install prompt"
          >
            <X size={14} />
          </button>
        </div>

        {showIOSHint ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-slate-300">
            Tap <span className="inline-flex items-center gap-1 font-medium text-slate-100"><Share2 size={14} /> Share</span> in Safari, then choose{" "}
            <span className="font-medium text-slate-100">Add to Home Screen</span>.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={isLaunchingPrompt}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-4 py-3 text-sm font-mono uppercase tracking-[0.2em] text-[#07110c] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download size={16} />
            {isLaunchingPrompt ? "Opening Prompt" : "Install App"}
          </button>
        )}
      </div>
    </div>
  );
}
