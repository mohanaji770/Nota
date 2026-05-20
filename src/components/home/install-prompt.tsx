"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneMode());

    // Check if dismissed less than 24 hours ago
    const dismissedAt = localStorage.getItem("install-prompt-dismissed-at");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }

    const fallbackTimer = window.setTimeout(() => setReady(true), 1200);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setReady(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!ready || installed) return;
    const timer = window.setTimeout(() => {
      setDismissed(true);
      localStorage.setItem("install-prompt-dismissed-at", String(Date.now()));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [ready, installed]);

  const handleInstall = async () => {
    if (!installEvent) {
      window.alert("من متصفح Chrome افتح القائمة ثم اختر تثبيت التطبيق أو Add to Home screen.");
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setInstallEvent(null);
  };

  if (installed || !ready || dismissed) return null;

  return (
    <section
      className="mt-5 rounded-2xl bg-white/[0.05] p-3 ring-1 ring-white/[0.07]"
      aria-label="تثبيت التطبيق"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-accent">
          <Smartphone size={19} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.82rem] font-bold leading-5 text-white/78">ثبّت التطبيق على هاتفك</p>
          <p className="line-clamp-1 text-[0.66rem] font-medium leading-4 text-white/30">
            يعمل كأنه تطبيق Android ويفتح حتى بدون إنترنت
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-black/80 transition duration-200 active:scale-95 dark:bg-[#fafaf6] dark:text-[#111110]"
          aria-label="تثبيت التطبيق"
        >
          <Download size={17} aria-hidden />
        </button>
      </div>
    </section>
  );
}
