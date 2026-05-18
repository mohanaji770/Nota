const dayFormatter = new Intl.DateTimeFormat("ar-SA", { weekday: "short" });

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildHabitWeek() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toDateKey(date),
      day: dayFormatter.format(date),
      number: date.getDate(),
      isToday: toDateKey(date) === toDateKey(today)
    };
  });
}
