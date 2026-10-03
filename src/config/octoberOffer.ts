import { CAMP_CAESAR_OPENING_2026 } from "@/config/campaigns";
import { landingCopy } from "@/lib/i18n/landing";

export const OCTOBER_MEDIA_ROOT = "/media/october-experience";

/**
 * Files that actually exist under public/media/october-experience.
 * Add the filename here after uploading it (e.g. "haircut.mp4", "sounds/reveal.mp3").
 * Anything not listed renders the built-in art / synthesized sound, so the page
 * never requests a URL that would 404.
 */
export const OCTOBER_AVAILABLE_MEDIA: ReadonlySet<string> = new Set<string>([]);

export function octoberMediaUrl(file: string | undefined): string | undefined {
  return file && OCTOBER_AVAILABLE_MEDIA.has(file) ? `${OCTOBER_MEDIA_ROOT}/${file}` : undefined;
}

export const OCTOBER_SOUND_SLOTS = [
  "static",
  "swell",
  "fabric",
  "whoosh",
  "swipe",
  "clipper",
  "snip",
  "comb",
  "razor",
  "click",
  "tick",
  "drop",
  "pour",
  "massage",
  "towel",
  "warm-air",
  "steam",
  "foam",
  "spa-air",
  "shimmer",
  "riser",
  "reveal",
] as const;

export type OctoberSoundSlot = (typeof OCTOBER_SOUND_SLOTS)[number];

export interface OctoberSoundConfig {
  file: string;
  volume: number;
  /** Looping ambience; only one ambience plays at a time. */
  loop?: boolean;
  /** Briefly lowers the music so a hero moment reads clearly. */
  duck?: { to: number; holdMs: number };
}

const sound = (slot: OctoberSoundSlot, volume: number, extra: Partial<OctoberSoundConfig> = {}): OctoberSoundConfig => ({
  file: `sounds/${slot}.mp3`,
  volume,
  ...extra,
});

/**
 * Scene effects sit under the campaign music, which stays the main audio bed.
 * Everyday texture is low (0.12–0.2), tactile service cues medium-low (0.2–0.3),
 * and only the 333 impact is a hero moment that ducks the music.
 */
export const OCTOBER_SOUNDS: Record<OctoberSoundSlot, OctoberSoundConfig> = {
  static: sound("static", 0.22),
  swell: sound("swell", 0.24),
  fabric: sound("fabric", 0.18),
  whoosh: sound("whoosh", 0.2),
  swipe: sound("swipe", 0.22),
  clipper: sound("clipper", 0.28),
  snip: sound("snip", 0.24),
  comb: sound("comb", 0.16),
  razor: sound("razor", 0.26),
  click: sound("click", 0.2),
  tick: sound("tick", 0.16),
  drop: sound("drop", 0.26),
  pour: sound("pour", 0.16),
  massage: sound("massage", 0.12),
  towel: sound("towel", 0.16),
  "warm-air": sound("warm-air", 0.12, { loop: true }),
  steam: sound("steam", 0.2),
  foam: sound("foam", 0.14),
  "spa-air": sound("spa-air", 0.12, { loop: true }),
  shimmer: sound("shimmer", 0.18),
  riser: sound("riser", 0.22),
  reveal: sound("reveal", 0.5, { duck: { to: 0.5, holdMs: 1100 } }),
};

/** Campaign soundtrack: one continuous track that follows the master timeline. */
export const OCTOBER_MUSIC = {
  src: "/audio/oct.mp3",
  volume: 0.62,
  /** Quiet bed under the offer section once the film lands. */
  offerVolume: 0.18,
  /** Track position (seconds) that lines up with the start of the film. */
  startAt: 12,
} as const;

export type OctoberSceneId = "haircut" | "beard" | "oil-bath" | "skincare";

export interface OctoberScene {
  id: OctoberSceneId;
  number: string;
  title: string;
  /** Arabic service name: shown under the English title and read out in the progress indicator. */
  label: string;
  video: string;
  poster: string;
  /** Signature cue, used when the reduced-motion page reaches the scene. */
  sound: OctoberSoundSlot;
  /**
   * Still frames, in story order: [hero, detail, detail, final hero].
   * Files live in public/media/october-experience/images and must be listed in
   * OCTOBER_AVAILABLE_MEDIA; missing frames render built-in panels instead.
   */
  frames: readonly OctoberSceneFrame[];
}

export interface OctoberSceneFrame {
  file: string;
  /** Short on-screen caption for the moment. */
  caption: string;
  alt: string;
}

const frames = (id: OctoberSceneId, moments: readonly (readonly [caption: string, alt: string])[]): OctoberSceneFrame[] =>
  moments.map(([caption, alt], i) => ({ file: `images/${id}-${i + 1}.webp`, caption, alt }));

export const OCTOBER_SCENES: readonly OctoberScene[] = [
  {
    id: "haircut",
    number: "01",
    title: "HAIR CUT",
    label: "قص الشعر",
    video: "haircut.mp4",
    poster: "haircut-poster.webp",
    sound: "clipper",
    frames: frames("haircut", [
      ["الماكينة", "لقطة قريبة لماكينة الحلاقة أثناء القص"],
      ["تدرّج الفيد", "تفاصيل تدرّج الفيد على جانب الرأس"],
      ["لمسة المقص", "المقص وهو بيظبط أطراف الشعر"],
      ["الشكل النهائي", "صورة جانبية للقصة بعد التشطيب"],
    ]),
  },
  {
    id: "beard",
    number: "02",
    title: "BEARD",
    label: "تحديد وتهذيب الذقن",
    video: "beard.mp4",
    poster: "beard-poster.webp",
    sound: "razor",
    frames: frames("beard", [
      ["خط الذقن", "تفاصيل خط الذقن على الخد"],
      ["الماكينة", "لقطة قريبة لماكينة تحديد الذقن"],
      ["تحديد الأطراف", "تحديد أطراف الذقن عند الخد"],
      ["النتيجة", "بورتريه للذقن بعد التحديد"],
    ]),
  },
  {
    id: "oil-bath",
    number: "03",
    title: "OIL BATH",
    label: "حمام زيت",
    video: "oil-bath.mp4",
    poster: "oil-bath-poster.webp",
    sound: "drop",
    frames: frames("oil-bath", [
      ["قطرة الزيت", "زجاجة زيت وقطرة بتنزل منها"],
      ["على فروة الراس", "توزيع الزيت على فروة الراس"],
      ["مساج", "لقطة قريبة للمساج"],
      ["فوطة دافية", "فوطة دافية حوالين الشعر"],
    ]),
  },
  {
    id: "skincare",
    number: "04",
    title: "CLASSIC SKIN CARE",
    label: "تنظيف البشرة الكلاسيكي",
    video: "skincare.mp4",
    poster: "skincare-poster.webp",
    sound: "steam",
    frames: frames("skincare", [
      ["البخار", "بخار دافي لتجهيز البشرة"],
      ["الكريم", "كريم التنظيف على الإيد"],
      ["العناية", "لقطة قريبة لعناية البشرة"],
      ["بشرة نضيفة", "وش بعد العناية ببشرة نضيفة"],
    ]),
  },
];

export interface ResolvedSceneFrame extends OctoberSceneFrame {
  /** Present only when the file is listed as available. */
  src?: string;
}

export function resolveSceneFrames(
  scene: Pick<OctoberScene, "frames">,
  available: ReadonlySet<string> = OCTOBER_AVAILABLE_MEDIA,
): ResolvedSceneFrame[] {
  return scene.frames.map((frame) => ({
    ...frame,
    src: available.has(frame.file) ? `${OCTOBER_MEDIA_ROOT}/${frame.file}` : undefined,
  }));
}

export interface OctoberBranch {
  code: "GLEEM" | "CAMP_CAESAR";
  name: string;
  tag: string;
  address: string;
  mapUrl: string;
  bookHref: string;
}

const footer = landingCopy.footer;

export const OCTOBER_BRANCHES: readonly OctoberBranch[] = [
  {
    code: "GLEEM",
    name: footer.branchName.ar,
    tag: "الفرع الرئيسي",
    address: footer.branchAddress.ar,
    mapUrl: "https://share.google/F4o7oOQVs3EJSgxaw",
    bookHref: "/book?mode=nearest&branch=GLEEM",
  },
  {
    code: "CAMP_CAESAR",
    name: footer.campBranchName.ar,
    tag: "الفرع الجديد",
    address: footer.campBranchAddress.ar,
    mapUrl: CAMP_CAESAR_OPENING_2026.locationUrl,
    bookHref: `/book?mode=nearest&branch=${CAMP_CAESAR_OPENING_2026.branchCode}`,
  },
];

export type OctoberChapterId = "opening" | OctoberSceneId | "price" | "offer";

/** Chapter progress at which the 333 lands. */
export const PRICE_IMPACT_AT = 0.64;

const PRICE_DURATION_MS = 7000;
/** The soundtrack settles to its offer level over the last part of the price chapter (and on skip). */
export const MUSIC_END_FADE_MS = 1800;
export const MUSIC_FADE_CUE = "music-fade";

export interface OctoberSoundCue {
  /** Chapter progress (0 < at < 1) at which the cue fires during autoplay. */
  at: number;
  sound: OctoberSoundSlot;
}

/**
 * Effect timing per chapter, aligned to the visuals (chapter progress, not seconds).
 * Gallery detail cards enter at ~0.24 and ~0.40, the final hero frame at ~0.66;
 * price services appear at 0.08 + i·0.07, the strike at 0.50 and the 333 at PRICE_IMPACT_AT.
 */
export const OCTOBER_SOUND_CUES: Record<OctoberChapterId, readonly OctoberSoundCue[]> = {
  opening: [
    { at: 0.03, sound: "static" },
    { at: 0.28, sound: "swell" },
    { at: 0.36, sound: "fabric" },
    { at: 0.63, sound: "whoosh" },
  ],
  haircut: [
    { at: 0.015, sound: "clipper" },
    { at: 0.17, sound: "whoosh" },
    { at: 0.25, sound: "snip" },
    { at: 0.3, sound: "snip" },
    { at: 0.41, sound: "comb" },
    { at: 0.66, sound: "snip" },
    { at: 0.94, sound: "swipe" },
  ],
  beard: [
    { at: 0.015, sound: "razor" },
    { at: 0.17, sound: "whoosh" },
    { at: 0.25, sound: "click" },
    { at: 0.41, sound: "tick" },
    { at: 0.56, sound: "razor" },
    { at: 0.68, sound: "tick" },
    { at: 0.94, sound: "swipe" },
  ],
  "oil-bath": [
    { at: 0.015, sound: "drop" },
    { at: 0.14, sound: "warm-air" },
    { at: 0.27, sound: "pour" },
    { at: 0.42, sound: "massage" },
    { at: 0.67, sound: "towel" },
  ],
  skincare: [
    { at: 0.015, sound: "steam" },
    { at: 0.2, sound: "spa-air" },
    { at: 0.4, sound: "foam" },
    { at: 0.6, sound: "towel" },
    { at: 0.8, sound: "shimmer" },
  ],
  price: [
    { at: 0.085, sound: "tick" },
    { at: 0.155, sound: "tick" },
    { at: 0.225, sound: "tick" },
    { at: 0.295, sound: "tick" },
    { at: 0.4, sound: "riser" },
    { at: 0.5, sound: "swipe" },
    { at: PRICE_IMPACT_AT, sound: "reveal" },
    { at: PRICE_IMPACT_AT + 0.03, sound: "shimmer" },
  ],
  offer: [],
};

/** The only loop allowed in each chapter; any other ambience stops when the chapter is entered. */
export const OCTOBER_CHAPTER_AMBIENCE: Partial<Record<OctoberChapterId, OctoberSoundSlot>> = {
  "oil-bath": "warm-air",
  skincare: "spa-air",
};

const SOUND_CUE_PREFIX = "sfx:";

export function soundCueId(slot: OctoberSoundSlot) {
  return `${SOUND_CUE_PREFIX}${slot}`;
}

/** The sound slot a timeline cue id refers to, or null for non-sound cues. */
export function soundFromCue(id: string): OctoberSoundSlot | null {
  if (!id.startsWith(SOUND_CUE_PREFIX)) return null;
  const slot = id.slice(SOUND_CUE_PREFIX.length);
  return (OCTOBER_SOUND_SLOTS as readonly string[]).includes(slot) ? (slot as OctoberSoundSlot) : null;
}

function chapterCues(id: OctoberChapterId, extra: readonly { at: number; id: string }[] = []) {
  return [...OCTOBER_SOUND_CUES[id].map((cue) => ({ at: cue.at, id: soundCueId(cue.sound) })), ...extra].sort((a, b) => a.at - b.at);
}

/** Master timeline (~36 s from the start tap to the offer section). */
export const OCTOBER_CHAPTERS: readonly { id: OctoberChapterId; duration: number; settleAt?: number; cues?: readonly { at: number; id: string }[] }[] = [
  { id: "opening", duration: 6000, settleAt: 1, cues: chapterCues("opening") },
  { id: "haircut", duration: 6000, settleAt: 0.6, cues: chapterCues("haircut") },
  { id: "beard", duration: 5000, settleAt: 0.6, cues: chapterCues("beard") },
  { id: "oil-bath", duration: 6000, settleAt: 0.6, cues: chapterCues("oil-bath") },
  { id: "skincare", duration: 6000, settleAt: 0.65, cues: chapterCues("skincare") },
  {
    id: "price",
    duration: PRICE_DURATION_MS,
    settleAt: 1,
    cues: chapterCues("price", [{ at: 1 - MUSIC_END_FADE_MS / PRICE_DURATION_MS, id: MUSIC_FADE_CUE }]),
  },
  { id: "offer", duration: 0 },
];

export const octoberOffer = {
  id: "october-333",
  campaignName: "احتفال أكتوبر من CUT",
  startsOn: "2026-10-05",
  startsLabel: "5 أكتوبر",
  endsOn: "2026-10-31",
  endsLabel: "31 أكتوبر",
  price: 333,
  originalPrice: 670,
  currency: "جنيه",
  opening: { video: "opening.mp4", poster: "opening-poster.webp" },
  bookHref: "/book",
  whatsappHref: `https://wa.me/201012126899?text=${encodeURIComponent("أهلاً، عايز أعرف تفاصيل عرض أكتوبر من CUT")}`,
} as const;
