"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

type UpdateReadyEvent = CustomEvent<{ worker: ServiceWorker }>;

export function PwaUpdatePrompt() {
  const [worker, setWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      setWorker((event as UpdateReadyEvent).detail.worker);
    };

    const handleControllerChange = () => {
      window.location.reload();
    };

    window.addEventListener("nota:update-ready", handleUpdate);
    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    return () => {
      window.removeEventListener("nota:update-ready", handleUpdate);
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  if (!worker) return null;

  return (
    <div className="fixed left-1/2 top-[calc(12px+var(--safe-top))] z-50 w-[min(360px,calc(100vw-32px))] -translate-x-1/2 rounded-[22px] bg-[#f7f7f2] p-2 text-[#151515] shadow-2xl ring-1 ring-black/10 dark:bg-[#202020] dark:text-white dark:ring-white/[0.08]">
      <button
        type="button"
        onClick={() => worker.postMessage({ type: "SKIP_WAITING" })}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] text-[0.82rem] font-bold transition active:scale-[0.98]"
      >
        <RefreshCw size={16} />
        تحديث التطبيق الآن
      </button>
    </div>
  );
}
