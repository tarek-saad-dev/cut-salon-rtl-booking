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

export type OctoberSoundSlot = "intro" | "clipper" | "transition" | "oil" | "steam" | "reveal";

export interface OctoberSoundConfig {
  file: string;
  volume: number;
  /** Looping ambience; only one ambience plays at a time. */
  loop?: boolean;
}

export const OCTOBER_SOUNDS: Record<OctoberSoundSlot, OctoberSoundConfig> = {
  intro: { file: "sounds/intro.mp3", volume: 0.55 },
  clipper: { file: "sounds/clipper.mp3", volume: 0.45 },
  transition: { file: "sounds/transition.mp3", volume: 0.4 },
  oil: { file: "sounds/oil.mp3", volume: 0.3, loop: true },
  steam: { file: "sounds/steam.mp3", volume: 0.28, loop: true },
  reveal: { file: "sounds/reveal.mp3", volume: 0.75 },
};

export type OctoberSceneId = "haircut" | "beard" | "oil-bath" | "skincare";

export interface OctoberScene {
  id: OctoberSceneId;
  number: string;
  title: string;
  /** Arabic service name for screen readers and the progress indicator. */
  label: string;
  line: string;
  video: string;
  poster: string;
  sound: OctoberSoundSlot;
}

export const OCTOBER_SCENES: readonly OctoberScene[] = [
  {
    id: "haircut",
    number: "01",
    title: "HAIR CUT",
    label: "قص الشعر",
    line: "البداية من القصّة.",
    video: "haircut.mp4",
    poster: "haircut-poster.webp",
    sound: "clipper",
  },
  {
    id: "beard",
    number: "02",
    title: "BEARD",
    label: "الذقن",
    line: "التفاصيل هي اللي بتفرق.",
    video: "beard.mp4",
    poster: "beard-poster.webp",
    sound: "transition",
  },
  {
    id: "oil-bath",
    number: "03",
    title: "OIL BATH",
    label: "حمام الزيت",
    line: "راحة. عناية. بداية جديدة.",
    video: "oil-bath.mp4",
    poster: "oil-bath-poster.webp",
    sound: "oil",
  },
  {
    id: "skincare",
    number: "04",
    title: "CLASSIC SKIN CARE",
    label: "العناية الكلاسيكية بالبشرة",
    line: "والنهاية… Clean.",
    video: "skincare.mp4",
    poster: "skincare-poster.webp",
    sound: "steam",
  },
];

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

export const octoberOffer = {
  id: "october-333",
  campaignName: "احتفال أكتوبر من CUT",
  startsOn: "2026-10-05",
  startsLabel: "5 أكتوبر",
  price: 333,
  originalPrice: 670,
  currency: "جنيه",
  intro: { video: "intro.mp4" },
  bookHref: "/book",
  whatsappHref: `https://wa.me/201012126899?text=${encodeURIComponent("أهلاً، عايز أعرف تفاصيل عرض أكتوبر من CUT")}`,
} as const;
