import { getHabitReminderSentDate, setHabitReminderSentDate } from "@/storage/repository";
import type { Habit } from "@/types/notes";

const NOTIFICATION_ICON = "/icons/icon-192.png";
const NOTIFICATION_BADGE = "/icons/icon-192.png";

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function supportsHabitNotifications() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function getHabitNotificationPermission() {
  if (!supportsHabitNotifications()) return "unsupported";
  return Notification.permission;
}

export async function requestHabitNotificationPermission() {
  if (!supportsHabitNotifications()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getNextReminderDelay(reminderTime: string, now = new Date()) {
  const [hours, minutes] = reminderTime.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

  return next.getTime() - now.getTime();
}

export async function showHabitReminder(habit: Habit) {
  if (!supportsHabitNotifications() || Notification.permission !== "granted") return;

  const dateKey = todayKey();
  const lastSentDate = await getHabitReminderSentDate(habit.id);
  if (lastSentDate === dateKey) return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("نوتة", {
    body: `وقت عادة: ${habit.title}`,
    tag: `habit-${habit.id}-${dateKey}`,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_BADGE,
    data: {
      url: "/habits"
    }
  });
  await setHabitReminderSentDate(habit.id, dateKey);
}
