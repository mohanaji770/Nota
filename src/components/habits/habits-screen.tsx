"use client";

import { ArrowRight, Bell, Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { buildHabitWeek } from "@/lib/habits";
import { cn } from "@/lib/cn";
import { getHabitNotificationPermission, requestHabitNotificationPermission } from "@/services/habit-reminders";
import { useNotesStore } from "@/services/notes-store";
import type { Habit } from "@/types/notes";

export function HabitsScreen() {
  const router = useRouter();
  const habits = useNotesStore((state) => state.habits);
  const createHabit = useNotesStore((state) => state.createHabit);
  const updateHabit = useNotesStore((state) => state.updateHabit);
  const deleteHabit = useNotesStore((state) => state.deleteHabit);
  const restoreHabit = useNotesStore((state) => state.restoreHabit);
  const toggleHabitDate = useNotesStore((state) => state.toggleHabitDate);
  const [title, setTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [notificationPermission, setNotificationPermission] = useState("unsupported");
  const [deletedHabit, setDeletedHabit] = useState<Habit | null>(null);
  const undoTimer = useRef<number | null>(null);
  const week = useMemo(() => buildHabitWeek(), []);

  useEffect(() => {
    setNotificationPermission(getHabitNotificationPermission());
    return () => {
      if (undoTimer.current) window.clearTimeout(undoTimer.current);
    };
  }, []);

  const handleCreate = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    try {
      await createHabit({ title: nextTitle, reminderTime });
      setTitle("");
    } catch {
      // The global status toast displays the storage failure.
    }
  };

  const handleEnableNotifications = async () => {
    const permission = await requestHabitNotificationPermission();
    setNotificationPermission(permission);
  };

  const handleDelete = async (habit: Habit) => {
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setDeletedHabit(habit);
    await deleteHabit(habit.id);
    undoTimer.current = window.setTimeout(() => setDeletedHabit(null), 6000);
  };

  const handleUndoDelete = async () => {
    if (!deletedHabit) return;
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    await restoreHabit(deletedHabit);
    setDeletedHabit(null);
  };

  return (
    <main className="adaptive-tonal mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#f7f7f2] px-5 pb-[calc(30px+var(--safe-bottom))] pt-[calc(10px+var(--safe-top))] text-[#151515] dark:bg-[#151515] dark:text-[#f7f7f2]">
      <header className="sticky top-0 z-20 -mx-5 bg-[#f7f7f2]/92 px-3 pt-[calc(6px+var(--safe-top))] backdrop-blur-xl dark:bg-[#151515]/92">
        <div className="flex min-h-14 items-center gap-2">
          <IconButton label="رجوع" onClick={() => router.push("/")} className="text-white/58">
            <ArrowRight size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.55rem] font-bold leading-8 text-white/90">العادات</h1>
            <p className="text-[0.72rem] font-medium leading-4 text-white/35">تابع آخر 7 أيام بهدوء</p>
          </div>
        </div>
      </header>

      <section className="mt-4 rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
        {notificationPermission !== "granted" ? (
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={notificationPermission === "unsupported" || notificationPermission === "denied"}
            className="mb-3 flex min-h-11 w-full items-center gap-2 rounded-2xl bg-[#ff6f61]/14 px-3 text-right text-[0.74rem] font-bold leading-5 text-[#ff6f61] ring-1 ring-[#ff6f61]/20 transition active:scale-[0.98] disabled:opacity-55"
          >
            <Bell size={16} />
            {notificationPermission === "denied"
              ? "الإشعارات موقوفة من إعدادات المتصفح"
              : notificationPermission === "unsupported"
                ? "الإشعارات غير مدعومة في هذا المتصفح"
                : "تفعيل تذكيرات العادات"}
          </button>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-[0.68rem] font-bold text-white/42">عنوان العادة</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً: قراءة، مشي، شرب ماء"
            className="h-11 w-full rounded-2xl bg-black/[0.045] px-3 text-[0.82rem] text-black/80 outline-none ring-1 ring-black/[0.08] placeholder:text-black/25 dark:bg-white/[0.055] dark:text-white/80 dark:ring-white/[0.08] dark:placeholder:text-white/24"
          />
        </label>
        <div className="mt-3 flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[0.68rem] font-bold text-white/42">تذكير يومي</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              className="h-11 w-full rounded-2xl bg-black/[0.045] px-3 text-[0.82rem] text-black/80 outline-none ring-1 ring-black/[0.08] dark:bg-white/[0.055] dark:text-white/80 dark:ring-white/[0.08]"
            />
          </label>
          <button
            type="button"
            onClick={handleCreate}
            className="grid h-11 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff6f61] text-white transition active:scale-95"
            aria-label="إضافة عادة"
          >
            <Plus size={21} />
          </button>
        </div>
      </section>

      <section className="mt-5 space-y-3" aria-label="قائمة العادات">
        {habits.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.055] text-white/55 ring-1 ring-white/[0.06]">
              <Check size={26} />
            </div>
            <h2 className="mt-5 text-[1.1rem] font-bold text-white/86">ابدأ عادة واحدة</h2>
            <p className="mx-auto mt-2 max-w-[270px] text-[0.78rem] font-medium leading-6 text-white/35">
              أضف عادة بسيطة، ثم ظلل الأيام التي أنجزتها خلال الأسبوع.
            </p>
          </div>
        ) : (
          habits.map((habit) => (
            <article key={habit.id} className="rounded-[24px] bg-white/[0.055] p-4 ring-1 ring-white/[0.07]">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    value={habit.title}
                    onChange={(event) => updateHabit({ ...habit, title: event.target.value })}
                    className="w-full bg-transparent text-[0.95rem] font-bold leading-6 text-white/84 outline-none focus:underline focus:decoration-white/20 focus:underline-offset-4"
                    aria-label="عنوان العادة"
                  />
                  <div className="mt-1 flex w-fit items-center gap-1.5 text-[0.66rem] font-medium text-white/35">
                    <Bell size={11} />
                    <input
                      type="time"
                      value={habit.reminderTime || ""}
                      onChange={(event) => updateHabit({ ...habit, reminderTime: event.target.value || null })}
                      className="bg-transparent outline-none"
                      aria-label="وقت التذكير"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(habit)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.055] text-white/38 transition active:scale-95 hover:bg-red-500/10 hover:text-red-400"
                  aria-label="حذف العادة"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {week.map((day) => {
                  const done = habit.completedDates.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleHabitDate(habit.id, day.key)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-2xl py-2.5 text-center transition active:scale-[0.96]",
                        done
                          ? "bg-[#2f8f56] text-white shadow-sm"
                          : day.isToday
                            ? "bg-[#ff6f61]/12 text-[#ff6f61] ring-1 ring-[#ff6f61]/30"
                            : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08]"
                      )}
                      aria-label={`${habit.title} ${day.key}`}
                    >
                      <span className="text-[0.55rem] font-bold uppercase leading-3 opacity-70">{day.day}</span>
                      <span className="mt-0.5 text-[0.9rem] font-bold leading-5">{day.number}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </section>

      {deletedHabit ? (
        <div className="fixed inset-x-4 bottom-[calc(18px+var(--safe-bottom))] z-50 mx-auto flex max-w-[380px] items-center gap-3 rounded-[22px] bg-[#202020] px-4 py-3 text-[0.78rem] font-semibold text-[#f7f7f2] shadow-2xl ring-1 ring-white/[0.08]">
          <p className="min-w-0 flex-1">تم حذف العادة</p>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="rounded-full bg-white/[0.09] px-3 py-2 text-[0.72rem] font-bold text-white transition active:scale-95"
          >
            تراجع
          </button>
        </div>
      ) : null}
    </main>
  );
}
