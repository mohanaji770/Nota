const formatter = new Intl.DateTimeFormat("ar-SA", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

export function nowIso() {
  return new Date().toISOString();
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "الآن";
  if (diff < hour) return `قبل ${Math.max(1, Math.round(diff / minute))} د`;
  if (diff < day) return `قبل ${Math.round(diff / hour)} س`;

  return formatter.format(date);
}
