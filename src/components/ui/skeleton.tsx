export function SkeletonList() {
  return (
    <div className="space-y-3 px-5 pt-4" aria-label="تحميل الملاحظات">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-[108px] animate-pulse rounded-2xl bg-white/[0.06]"
        />
      ))}
    </div>
  );
}
