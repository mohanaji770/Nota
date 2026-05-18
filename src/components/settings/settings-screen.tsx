"use client";

import { ArrowRight, ChevronDown, Download, RotateCw, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { useNotesStore } from "@/services/notes-store";
import type { AppFontFamily, NotesExport, ThemePreference } from "@/types/notes";

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: "system", label: "النظام" },
  { value: "dark", label: "داكن" },
  { value: "light", label: "فاتح" }
];

const fontOptions: Array<{ value: AppFontFamily; label: string; hint: string }> = [
  { value: "cairo", label: "Cairo", hint: "مناسب للواجهة والكتابة اليومية" },
  { value: "amiri", label: "Amiri Quran", hint: "خط عربي كلاسيكي للقراءة الهادئة" }
];

export function SettingsScreen() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const theme = useNotesStore((state) => state.theme);
  const setTheme = useNotesStore((state) => state.setTheme);
  const settings = useNotesStore((state) => state.settings);
  const setAppSettings = useNotesStore((state) => state.setAppSettings);
  const syncStatus = useNotesStore((state) => state.syncStatus);
  const syncNow = useNotesStore((state) => state.syncNow);
  const exportAll = useNotesStore((state) => state.exportAll);
  const importAll = useNotesStore((state) => state.importAll);

  const handleExport = async () => {
    const payload = await exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nota-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text) as NotesExport;
    await importAll(payload);
  };

  return (
    <main className="adaptive-tonal mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#f7f7f2] px-5 pb-[calc(28px+var(--safe-bottom))] pt-[calc(10px+var(--safe-top))] text-[#151515] dark:bg-[#151515] dark:text-[#f7f7f2]">
      <header className="sticky top-0 z-20 -mx-5 bg-[#f7f7f2]/92 px-3 pt-[calc(6px+var(--safe-top))] backdrop-blur-xl dark:bg-[#151515]/92">
        <div className="flex min-h-14 items-center gap-2">
          <IconButton label="رجوع" onClick={() => router.push("/")} className="text-white/58">
            <ArrowRight size={22} />
          </IconButton>
          <div>
            <h1 className="text-[1.15rem] font-bold leading-6 text-white/90">إعدادات نوتة</h1>
            <p className="text-[0.7rem] font-medium leading-4 text-white/35">المظهر، الخط، والمزامنة</p>
          </div>
        </div>
      </header>

      <section className="mt-4 space-y-5">
        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <h2 className="text-[0.86rem] font-bold text-white/82">المظهر</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`min-h-10 rounded-2xl text-[0.76rem] font-bold transition active:scale-[0.98] ${
                  theme === option.value ? "bg-white text-[#151515]" : "bg-white/[0.055] text-white/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[0.86rem] font-bold text-white/82">تباعد أسطر الملاحظات</h2>
              <p className="mt-1 text-[0.68rem] font-medium text-white/32">
                {Math.round(settings.noteLineHeightScale * 100)}%
              </p>
            </div>
          </div>
          <input
            type="range"
            min="0.9"
            max="1.25"
            step="0.05"
            value={settings.noteLineHeightScale}
            onChange={(event) => setAppSettings({ noteLineHeightScale: Number(event.target.value) })}
            className="mt-4 w-full accent-[#ff6f61]"
            aria-label="تباعد أسطر الملاحظات"
          />
        </div>

        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[0.86rem] font-bold text-white/82">حجم خط الملاحظات</h2>
              <p className="mt-1 text-[0.68rem] font-medium text-white/32">
                {Math.round(settings.noteFontScale * 100)}%
              </p>
            </div>
          </div>
          <input
            type="range"
            min="0.85"
            max="1.25"
            step="0.05"
            value={settings.noteFontScale}
            onChange={(event) => setAppSettings({ noteFontScale: Number(event.target.value) })}
            className="mt-4 w-full accent-[#ff6f61]"
            aria-label="حجم خط الملاحظات"
          />
        </div>

        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <h2 className="text-[0.86rem] font-bold text-white/82">نوع الخط</h2>
          <div className="mt-3 space-y-2">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setAppSettings({ fontFamily: option.value })}
                className={`flex min-h-14 w-full items-center justify-between rounded-2xl px-3 text-right transition active:scale-[0.99] ${
                  settings.fontFamily === option.value ? "bg-white text-[#151515]" : "bg-white/[0.055] text-white/62"
                }`}
              >
                <span>
                  <span className="block text-[0.84rem] font-bold">{option.label}</span>
                  <span className="block text-[0.65rem] opacity-55">{option.hint}</span>
                </span>
                <span className="text-[1.25rem]" style={{ fontFamily: option.value === "amiri" ? "Amiri Quran" : "Cairo" }}>
                  أبجد
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <button
            type="button"
            onClick={() => setSupabaseOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 text-right"
            aria-expanded={supabaseOpen}
          >
            <span>
              <span className="block text-[0.86rem] font-bold text-white/82">Supabase</span>
              <span className="mt-1 block text-[0.68rem] font-medium leading-5 text-white/32">
                اختياري. يعمل التطبيق محليًا إذا تركته فارغًا.
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-white/45 transition ${supabaseOpen ? "rotate-180" : ""}`}
            />
          </button>
          {supabaseOpen ? (
            <>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-bold text-white/42">SUPABASE_URL</span>
                  <input
                    value={settings.supabaseUrl}
                    onChange={(event) => setAppSettings({ supabaseUrl: event.target.value })}
                    placeholder="https://xxxxx.supabase.co"
                    dir="ltr"
                    className="h-11 w-full rounded-2xl bg-black/[0.045] px-3 text-left text-[0.76rem] text-black/80 outline-none ring-1 ring-black/[0.08] placeholder:text-black/25 dark:bg-[#151515] dark:text-white/80 dark:ring-white/[0.08] dark:placeholder:text-white/22"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[0.68rem] font-bold text-white/42">SUPABASE_ANON_KEY</span>
                  <input
                    value={settings.supabaseAnonKey}
                    onChange={(event) => setAppSettings({ supabaseAnonKey: event.target.value })}
                    placeholder="eyJ..."
                    dir="ltr"
                    className="h-11 w-full rounded-2xl bg-black/[0.045] px-3 text-left text-[0.76rem] text-black/80 outline-none ring-1 ring-black/[0.08] placeholder:text-black/25 dark:bg-[#151515] dark:text-white/80 dark:ring-white/[0.08] dark:placeholder:text-white/22"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={syncNow}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[0.8rem] font-bold text-[#151515] transition active:scale-[0.98]"
              >
                <RotateCw size={16} />
                مزامنة الآن
              </button>
              <p className="mt-2 text-center text-[0.66rem] font-medium text-white/32">الحالة: {syncStatus}</p>
            </>
          ) : null}
        </div>

        <div className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
          <h2 className="text-[0.86rem] font-bold text-white/82">النسخ الاحتياطي</h2>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => handleImport(event.target.files?.[0])}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.07] text-[0.78rem] font-bold text-white/66 transition active:scale-[0.98]"
            >
              <Upload size={15} />
              استيراد
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.07] text-[0.78rem] font-bold text-white/66 transition active:scale-[0.98]"
            >
              <Download size={15} />
              تصدير
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
