"use client";

import { ArrowRight, Bell, Check, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { buildHabitWeek } from "@/lib/habits";
import { useNotesStore } from "@/services/notes-store";

export function HabitsScreen() {
  const router = useRouter();
  const habits = useNotesStore((state) => state.habits);
  const createHabit = useNotesStore((state) => state.createHabit);
  const updateHabit = useNotesStore((state) => state.updateHabit);
  const deleteHabit = useNotesStore((state) => state.deleteHabit);
  const toggleHabitDate = useNotesStore((state) => state.toggleHabitDate);
  const [title, setTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const week = useMemo(() => buildHabitWeek(), []);

  const handleCreate = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    await createHabit({ title: nextTitle, reminderTime });
    setTitle("");
  };

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-[#f7f7f2] px-5 pb-[calc(30px+var(--safe-bottom))] pt-[calc(10px+var(--safe-top))] text-[#151515] dark:bg-[#151515] dark:text-[#f7f7f2]">
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

      <section className="mt-4 rounded-[24px] bg-white/[0.055] p-3 ring-1 ring-white/[0.07]">
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

      <section className="mt-5 space-y-2" aria-label="قائمة العادات">
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
            <article key={habit.id} className="border-b border-dashed border-white/[0.055] py-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    value={habit.title}
                    onChange={(event) => updateHabit({ ...habit, title: event.target.value })}
                    className="w-full bg-transparent text-[0.95rem] font-bold leading-6 text-white/84 outline-none"
                    aria-label="عنوان العادة"
                  />
                  <label className="mt-1 flex w-fit items-center gap-1 text-[0.66rem] font-medium text-white/35">
                    <Bell size={12} />
                    <input
                      type="time"
                      value={habit.reminderTime || ""}
                      onChange={(event) => updateHabit({ ...habit, reminderTime: event.target.value || null })}
                      className="bg-transparent outline-none"
                      aria-label="وقت التذكير"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => deleteHabit(habit.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.055] text-white/38 transition active:scale-95"
                  aria-label="حذف العادة"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const done = habit.completedDates.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleHabitDate(habit.id, day.key)}
                      className={`min-h-[54px] rounded-[14px] px-1 text-center transition active:scale-[0.98] ${
                        done
                          ? "bg-[#2f8f56] text-white"
                          : day.isToday
                            ? "bg-[#ff6f61]/16 text-[#ff6f61] ring-1 ring-[#ff6f61]/25"
                            : "bg-white/[0.045] text-white/38"
                      }`}
                      aria-label={`${habit.title} ${day.key}`}
                    >
                      <span className="block text-[0.8rem] font-bold leading-5">{day.number}</span>
                      <span className="block text-[0.52rem] font-bold leading-4">{day.day}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
