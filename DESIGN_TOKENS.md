# Nota Design Tokens

Read this file before UI changes.

## Colors
- Canvas dark: `#151515`
- Canvas light: `#f7f7f2`
- Surface dark: `#202020`
- Text dark mode: `#f7f7f2`
- Text light mode: `#151515`
- Accent: `#ff6f61`
- Success: `#2f8f56`
- Violet: `#7c4dff`

## Layout
- Mobile max width: `430px` for home/settings/habits.
- Editor max width: `620px`.
- Page horizontal padding: `20px` to `24px`.
- Bottom nav reserved space: `92px + safe bottom`.
- Prefer full-screen app surfaces, not nested cards.

## Radius
- Small controls: `14px`
- Menu/buttons: `18px`
- Panels: `24px`
- Floating buttons: pill / circle.

## Typography
- Default font: Cairo.
- Optional reading font: Amiri Quran.
- Note font scale range: `0.85` to `1.25`.
- Note line-height scale range: `0.9` to `1.25`.

## Interaction
- Press feedback: `active:scale-[0.98]` or `active:scale-95`.
- Keep transitions under `200ms`.
- Navigation controls should prefetch target routes when possible.

## Theme
- All new UI must work in light and dark mode.
- Avoid hard-coded `text-white` without checking light mode behavior.
- Use `dark:` variants for dark-only surfaces.
