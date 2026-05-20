import { FilePlus2 } from "lucide-react";

export function EmptyState({ folderIsAll, onCreate }: { folderIsAll: boolean; onCreate: () => void }) {
  return (
    <section className="grid flex-1 place-items-center px-2 py-12 text-center">
      <div className="max-w-[260px]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/[0.06] text-white/48 ring-1 ring-white/[0.06]">
          <FilePlus2 size={26} />
        </div>
        <h2 className="mt-5 text-[1.15rem] font-bold leading-7 text-white/82">
          {folderIsAll ? "ابدأ ملاحظتك الأولى" : "لا توجد ملاحظات هنا"}
        </h2>
        <p className="mt-2 text-[0.8rem] font-medium leading-6 text-white/32">
          اكتب ملاحظاتك بسرعة، وثبّت المهم، وكل شيء يبقى محفوظًا بدون اتصال.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 min-h-11 rounded-full bg-white/[0.08] px-5 text-[0.82rem] font-bold text-white/76 ring-1 ring-white/[0.06] transition active:scale-95"
        >
          إنشاء ملاحظة
        </button>
      </div>
    </section>
  );
}
