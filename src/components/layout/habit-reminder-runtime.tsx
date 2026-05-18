"use client";

import { useEffect } from "react";
import { getNextReminderDelay, showHabitReminder, supportsHabitNotifications } from "@/services/habit-reminders";
import { useNotesStore } from "@/services/notes-store";

const MAX_TIMEOUT = 2_147_483_647;

export function HabitReminderRuntime() {
  const hydrated = useNotesStore((state) => state.hydrated);
  const habits = useNotesStore((state) => state.habits);

  useEffect(() => {
    if (!hydrated || !supportsHabitNotifications()) return;

    const timers: number[] = [];

    habits
      .filter((habit) => habit.reminderTime)
      .forEach((habit) => {
        const scheduleNext = () => {
          if (!habit.reminderTime) return;
          const delay = getNextReminderDelay(habit.reminderTime);
          if (delay === null || delay > MAX_TIMEOUT) return;
          const timer = window.setTimeout(() => {
            void showHabitReminder(habit).finally(scheduleNext);
          }, delay);
          timers.push(timer);
        };

        scheduleNext();
      });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [habits, hydrated]);

  return null;
}
