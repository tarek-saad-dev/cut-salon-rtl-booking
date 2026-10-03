# October celebration experience (`/offers/october-333`)

A mobile-first, scroll-driven cinematic story for **احتفال أكتوبر من CUT**. The route slug is historical; the campaign is the October celebration, and 333 EGP is only the final price reveal.

## Offer logic shown on the page

- Starts 5 October 2026.
- Four services: Hair Cut, Beard, Oil Bath, Classic Skin Care. Original value 670 EGP, offer price 333 EGP.
- The customer visits a CUT branch, pays for and activates the offer there, then uses the services during October. They do not have to be used in the same visit.
- No online payment, no online claim, no name/phone collection, no stock counter. The page only drives branch visits, directions and the existing `/book` flow (booking logic is untouched).
- `/offers/october-333/success` (from the earlier claim flow) redirects to the experience so old links never 404.

## Structure

`Intro → 01 Hair Cut → 02 Beard → 03 Oil Bath → 04 Classic Skin Care → Price reveal → How it works → Branches`

| File | Role |
| --- | --- |
| `src/config/octoberOffer.ts` | Copy, prices, scenes, branches, media manifest, sound slots |
| `src/components/offers/october-333/OctoberExperience.tsx` | Page composition, intro, sound toggle, how-it-works, branch CTA |
| `src/components/offers/october-333/StoryStage.tsx` | One sticky stage for the four scenes, scene transitions, progress indicator, reduced-motion fallback |
| `src/components/offers/october-333/PriceReveal.tsx` | Pinned 670 → 333 reveal (and static fallback) |
| `src/components/offers/october-333/SceneMedia.tsx` | Lazy video/poster slot with graceful fallback |
| `src/components/offers/october-333/SceneArt.tsx` | Built-in CSS/SVG art shown until real media exists |
| `src/lib/offers/octoberSound.ts` | Web Audio sound manager |

Motion uses the existing Framer Motion stack only (`useScroll`/`useTransform` driving transforms, opacity and `clip-path`). GSAP was not needed.

Transitions: a clipper-blade light wipe (01 → 02), an oil drop that opens into a circular reveal (02 → 03), steam that fills and clears the frame (03 → 04), then a fade to black into the price reveal.

## Adding media

Drop files into `public/media/october-experience/`, then add each filename to `OCTOBER_AVAILABLE_MEDIA` in `src/config/octoberOffer.ts`. Files not listed are never requested, so missing assets cannot produce broken URLs.

```
public/media/october-experience/
  intro.mp4
  haircut.mp4      haircut-poster.webp
  beard.mp4        beard-poster.webp
  oil-bath.mp4     oil-bath-poster.webp
  skincare.mp4     skincare-poster.webp
  sounds/intro.mp3  sounds/clipper.mp3  sounds/transition.mp3
  sounds/oil.mp3    sounds/steam.mp3    sounds/reveal.mp3
```

Video guidance: portrait-first (9:16 crop safe), H.264 MP4, muted, short seamless loops (6–10 s), ≤ 2–3 MB each, plus a WebP poster. Videos load only for the current and adjacent scenes, play only while on screen, and are skipped when the browser requests Save-Data. `oil.mp3` and `steam.mp3` loop as ambience; the others are one-shots.

## Sound

- Nothing is created or played before an explicit tap on **ابدأ التجربة** or the 🔊/🔇 toggle.
- The toggle preference is kept in `sessionStorage` for the session; a returning opt-in still waits for a fresh tap before audio resumes.
- One ambience and one one-shot at most at any time. Audio suspends when the tab is hidden and stops when leaving the page.
- Until real sound files are added, quiet synthesized stand-ins play for each cue. Missing or failing files fall back silently; the experience is fully understandable muted.

## Accessibility and performance

- `prefers-reduced-motion`: scenes render as still, stacked screens with simple crossfades, and the price reveal is shown complete without pinning.
- Low-capability devices (≤ 2 cores, ≤ 2 GB memory, or Save-Data) get reduced parallax depth.
- Only transform, opacity and clip-path are animated; no blur filters. Viewport units use `100dvh` with safe-area insets.
- The route adds `cut-cinematic-route` to `<html>` so `overflow-x: clip` replaces the global `overflow-x: hidden`, which would otherwise break `position: sticky`.
- Site chrome (MainNav, GlobalMobileNav, Camp Caesar campaign) stays excluded on `/offers/*` via `SiteChrome`.
