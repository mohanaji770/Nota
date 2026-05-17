# ملاحظات أندرويد PWA

تطبيق ملاحظات عربي RTL مبني بـ Next.js App Router وTypeScript وTailwind CSS. التخزين الأساسي Offline First عبر IndexedDB، مع طبقة مزامنة اختيارية إلى Supabase عند توفر مفاتيح البيئة.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح `http://localhost:3000`.

## البناء والنشر على Vercel

```bash
npm run build
```

على Vercel لا تحتاج إعدادات خاصة. الملف `vercel.json` يضبط ترويسات `sw.js` و`manifest.webmanifest`.

متغيرات Supabase اختيارية:

```bash
SUPABASE_URL="https://PROJECT.supabase.co"
SUPABASE_ANON_KEY="..."
```

يمكن أيضًا استخدام:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

إذا لم تُضبط هذه المفاتيح يعمل التطبيق محليًا بالكامل بدون أخطاء.

## البنية

```text
src/app                 صفحات App Router وملفات PWA metadata
src/components/home     الصفحة الرئيسية، البحث، التصنيفات، البطاقات
src/components/editor   محرر الملاحظة والسحب لإعادة ترتيب العناصر
src/components/layout   تسجيل Service Worker وإدارة الثيم
src/components/ui       عناصر واجهة صغيرة قابلة لإعادة الاستخدام
src/hooks               Hooks للأداء وتجربة الكتابة
src/lib                 أدوات التاريخ والمعرفات وMarkdown الخفيف
src/storage             IndexedDB والمستودع المحلي
src/services            Zustand وطبقة sync
src/types               أنواع البيانات
public                  manifest وservice worker وأيقونات PWA
```

## PWA

الملفات الأساسية:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-512.png`

الـ Service Worker يستخدم:

- Cache-first للأصول الثابتة وأيقونات التطبيق.
- Network-first للصفحات مع fallback إلى `offline.html`.
- وضع standalone وmanifest مناسب للتثبيت على Android.

## التخزين المحلي

IndexedDB هي مصدر الحقيقة الأساسي. قاعدة البيانات `android-notes-db` تحتوي:

- `notes`: الملاحظات، البلوكات، حالة التثبيت، الأرشفة، والحذف الناعم.
- `folders`: التصنيفات.
- `outbox`: طابور عمليات المزامنة.
- `settings`: تفضيلات الثيم، معرف الجهاز، وآخر مزامنة.

## Supabase Sync

المزامنة اختيارية وتعمل عند توفر مفاتيح Supabase في بيئة البناء. هذا مثال جدول مناسب:

```sql
create table if not exists public.notes (
  id text primary key,
  owner_id text not null,
  title text not null,
  blocks jsonb not null default '[]'::jsonb,
  folder_id text not null default 'inbox',
  pinned boolean not null default false,
  archived boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists notes_owner_updated_idx
on public.notes (owner_id, updated_at desc);
```

لمنتج متعدد المستخدمين، أضف Supabase Auth وRLS حسب نموذج الحسابات لديك. التطبيق الحالي يستخدم `owner_id` المحلي كمثال مزامنة اختياري خفيف.

## ملاحظات UX

- RTL كامل وواجهة عربية.
- تصميم Mobile First ومقاسات لمس لا تقل عن 48dp.
- FAB لإنشاء الملاحظات وفق نمط Android.
- حفظ تلقائي سريع.
- Markdown خفيف: `# ` للعناوين، `- ` للقوائم، و`- [ ] ` أو `- [x] ` لقوائم المهام.
- سحب بطاقة الملاحظة يمينًا للأرشفة ويسارًا للحذف.
- سحب عناصر المحرر من المقبض لتغيير الترتيب.
- الثيم يدعم `system` و`light` و`dark` ويحفظ في IndexedDB.
