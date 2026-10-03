# October celebration experience (`/offers/october-333`)

An auto-directed, mobile-first short film for **احتفال أكتوبر من CUT**. The route slug is historical; the campaign is the October celebration, and 333 EGP is only the final price reveal.

## Offer logic shown on the page

- Available from 5 to 31 October 2026.
- Four services: Hair Cut, Beard, Oil Bath, Classic Skin Care. Original value 670 EGP, offer price 333 EGP.
- The customer visits a CUT branch, pays for and activates the offer there, then uses the services during October. They do not have to be used in the same visit.
- No online payment, no online claim, no name/phone collection, no stock counter. The page only drives branch visits, directions and the existing `/book` flow (booking logic is untouched).
- `/offers/october-333/success` (from the earlier claim flow) redirects to the experience so old links never 404.

## How it plays

One press on **ابدأ التجربة** starts a ~42 s film driven by a single master timeline:

| Chapter | Duration | Notes |
| --- | --- | --- |
| Opening | 6 s | Archival dark + radio/rumble → restrained flag reveal with «أكتوبر… حكاية انتصار.» → «وفي CUT… بنحتفل بطريقتنا.» → campaign title as the rumble turns into a clipper buzz |
| 01 Hair Cut | 6 s | Opens on a blade-light split |
| 02 Beard | 5 s | Clipper-blade wipe in, razor sound |
| 03 Oil Bath | 6 s | Oil drop → circular reveal, liquid ambience |
| 04 Classic Skin Care | 6 s | Steam fills and clears the frame |
| Price | 7 s | Services gather → 670 struck → pause → bass impact → gold 333 |
| Offer | — | Dates, steps, branches, `/book`, WhatsApp |

Durations and cue points live in `OCTOBER_CHAPTERS` (`src/config/octoberOffer.ts`).

- **Viewport:** the scenes render on one fixed full-screen stage. Under it sits one 100svh anchor per chapter, and the page scrolls to the next anchor only when the chapter changes. The page is about six screens plus the offer section, so there is no dead scrolling.
- **The visitor is always in charge:** a wheel, swipe, drag, navigation key, manual scroll or ⏸ stops autoplay and sound at once, and the current scene settles into a readable frame. Scrolling manually moves through the chapters scene by scene. **▶ استكمال التجربة** resumes from the current chapter. Tapping 🔊/🔇 never pauses.
- **تخطي** stops sound and autoplay and brings the visitor to the offer section, with no reload.

## Code map

| File | Role |
| --- | --- |
| `src/lib/offers/cinematicTimeline.ts` | Pure, tick-driven master clock (chapters, cues, pause/resume/skip/settle); unit tested |
| `src/components/offers/october-333/useCinematicTimeline.ts` | One `requestAnimationFrame` loop feeding the clock into Framer Motion values |
| `src/components/offers/october-333/OctoberExperience.tsx` | Orchestration: anchors, interruption detection, controls, sound cues, reduced-motion page |
| `src/components/offers/october-333/CinematicStage.tsx` | Fixed stage composing every chapter from the timeline |
| `OpeningScene.tsx`, `StoryStage.tsx`, `PriceReveal.tsx` | Chapter visuals (plus static reduced-motion versions) |
| `Conversion.tsx` | Offer dates, steps, branches and booking CTAs |
| `SceneMedia.tsx`, `SceneArt.tsx` | Lazy video/poster slots and the built-in CSS/SVG art shown until real media exists |
| `src/lib/offers/octoberSound.ts` | Web Audio sound manager with synthesized fallbacks |

Motion uses the existing Framer Motion stack only (transforms, opacity and `clip-path`). GSAP was not needed.

## Adding media

Drop files into `public/media/october-experience/`, then add each filename to `OCTOBER_AVAILABLE_MEDIA` in `src/config/octoberOffer.ts`. Files not listed are never requested, so missing assets cannot produce broken URLs.

```
public/media/october-experience/
  opening.mp4      opening-poster.webp
  haircut.mp4      haircut-poster.webp
  beard.mp4        beard-poster.webp
  oil-bath.mp4     oil-bath-poster.webp
  skincare.mp4     skincare-poster.webp
  sounds/opening.mp3  sounds/clipper.mp3  sounds/razor.mp3
  sounds/oil.mp3      sounds/steam.mp3    sounds/reveal.mp3
```

Video guidance: portrait-first (9:16 crop safe), H.264 MP4, muted, 6–10 s, ≤ 2–3 MB each, plus a WebP poster. The opening video replaces the built-in flag; keep it a dignified tribute (no war footage, explosions or gunfire). Videos load only for the current and adjacent chapters, play only while their chapter is on screen, and are skipped under Save-Data. `oil.mp3` and `steam.mp3` loop as ambience; the others are one-shots. Use only original or properly licensed audio, never historical recordings.

## Sound

- Nothing is created or played before an explicit tap on **ابدأ التجربة** or the 🔊/🔇 toggle. A mute chosen before starting is respected.
- Sounds follow the timeline: the opening radio/rumble → buzz, clipper, razor, oil, steam, and the bass impact on the 333 reveal. Sounds are tied to autoplay, so manual browsing is silent.
- One ambience and one one-shot at most at any time. Audio suspends when the tab is hidden and stops when leaving the page.
- Until real files are added, quiet synthesized stand-ins play for each cue. Missing or failing files fall back silently, and the film is fully understandable muted.

## Accessibility and performance

- `prefers-reduced-motion`: no autoplay and no forced scrolling. Chapters render as still stacked screens with simple fades, and all offer information is visible.
- Low-capability devices (≤ 2 cores, ≤ 2 GB memory, or Save-Data) get reduced parallax depth.
- Only transform, opacity and clip-path are animated; no blur filters and no nested sticky layers. Viewport units use `dvh`/`svh` with safe-area insets.
- Site chrome (MainNav, GlobalMobileNav, Camp Caesar campaign) stays excluded on `/offers/*` via `SiteChrome`.
