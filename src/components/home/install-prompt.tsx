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

  useEffect(() => {
    setInstalled(isStandaloneMode());

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

  if (installed || !ready) return null;

  return (
    <section className="mt-5 rounded-[24px] bg-[#202020] p-3 ring-1 ring-white/[0.07]" aria-label="تثبيت التطبيق">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.075] text-[#ff6f61]">
          <Smartphone size={19} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.82rem] font-bold leading-5 text-white/82">ثبّت التطبيق على هاتفك</p>
          <p className="line-clamp-1 text-[0.66rem] font-medium leading-4 text-white/34">
            يعمل كأنه تطبيق Android ويفتح حتى بدون إنترنت
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f7f7f2] text-[#151515] transition duration-200 active:scale-95"
          aria-label="تثبيت التطبيق"
        >
          <Download size={17} aria-hidden />
        </button>
      </div>
    </section>
  );
}
