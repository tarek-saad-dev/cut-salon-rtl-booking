import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OctoberExperience } from "./OctoberExperience";
import { disposeOctoberSound, getOctoberSound } from "@/lib/offers/octoberSound";
import {
  MUSIC_END_FADE_MS,
  OCTOBER_BRANCHES,
  OCTOBER_CHAPTER_AMBIENCE,
  OCTOBER_CHAPTERS,
  OCTOBER_MUSIC,
  OCTOBER_SOUND_CUES,
} from "@/config/octoberOffer";

const VIEWPORT = 844;
const OFFER_TOP = (OCTOBER_CHAPTERS.length - 1) * VIEWPORT;

const AudioContextSpy = vi.fn(function () {
  return {
    state: "running",
    currentTime: 0,
    destination: {},
    createGain: () => ({ gain: { value: 0 }, connect: vi.fn() }),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  };
});

class FakeAudio {
  static instances: FakeAudio[] = [];
  src = "";
  preload = "";
  currentTime = 0;
  volume = 1;
  muted = false;
  paused = true;
  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
  });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") this.src = "";
  });
  constructor() {
    FakeAudio.instances.push(this);
  }
}

const music = () => FakeAudio.instances[FakeAudio.instances.length - 1];

const offsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop")!;

beforeEach(() => {
  sessionStorage.clear();
  AudioContextSpy.mockClear();
  vi.stubGlobal("AudioContext", AudioContextSpy);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
  vi.stubGlobal("fetch", vi.fn());
  FakeAudio.instances = [];
  vi.stubGlobal("Audio", FakeAudio);
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "offsetTop", {
    configurable: true,
    get(this: HTMLElement) {
      if (this.id === "october-offer") return OFFER_TOP;
      const index = OCTOBER_CHAPTERS.findIndex((chapter) => chapter.id === this.dataset.chapter);
      return index >= 0 ? index * VIEWPORT : 0;
    },
  });
});

afterEach(() => {
  disposeOctoberSound();
  vi.unstubAllGlobals();
  Object.defineProperty(HTMLElement.prototype, "offsetTop", offsetTop);
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

async function startExperience() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "ابدأ التجربة" }));
  });
}

describe("October cinematic experience", () => {
  it("opens on a start gate with the October tribute behind it", () => {
    render(<OctoberExperience />);
    expect(screen.getByText("أكتوبر… حكاية انتصار.")).toBeInTheDocument();
    expect(screen.getByText("وفي CUT… بنحتفل بطريقتنا.")).toBeInTheDocument();
    expect(screen.getByText("احتفال أكتوبر من CUT", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ابدأ التجربة" })).toBeInTheDocument();
    expect(screen.getByText(/تجربة بالصوت/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "تخطي" })).not.toBeInTheDocument();
  });

  it("never creates audio before the start press, and mute stays available", async () => {
    render(<OctoberExperience />);
    expect(AudioContextSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "تشغيل الصوت" })).toHaveAttribute("aria-pressed", "false");

    await startExperience();
    expect(AudioContextSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "إيقاف الصوت" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    expect(screen.getByRole("button", { name: "تشغيل الصوت" })).toHaveAttribute("aria-pressed", "false");
  });

  it("starts autoplay with pause and skip controls", async () => {
    render(<OctoberExperience />);
    await startExperience();
    expect(screen.getByRole("button", { name: "إيقاف مؤقت" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تخطي" })).toBeInTheDocument();
  });

  it("stops directing the moment the visitor scrolls, and resumes on request", async () => {
    render(<OctoberExperience />);
    await startExperience();

    act(() => {
      fireEvent.wheel(window, { deltaY: 120 });
    });
    const resume = screen.getByRole("button", { name: "استكمال التجربة" });
    expect(screen.queryByRole("button", { name: "إيقاف مؤقت" })).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(resume);
    });
    expect(screen.getByRole("button", { name: "إيقاف مؤقت" })).toBeInTheDocument();
  });

  it("does not pause when the sound control is tapped", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    });
    expect(screen.getByRole("button", { name: "إيقاف مؤقت" })).toBeInTheDocument();
  });

  it("skips straight to the offer without a reload", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
    });
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: OFFER_TOP, behavior: "smooth" });
    expect(screen.queryByRole("button", { name: "تخطي" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.getElementById("october-offer"));
  });

  it("with reduced motion, never autoplays or forces scrolling and shows everything", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      render(<OctoberExperience />);
      await startExperience();
      expect(screen.queryByRole("button", { name: "إيقاف مؤقت" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "تخطي" })).not.toBeInTheDocument();
      expect(window.scrollTo).not.toHaveBeenCalled();
      for (const title of ["HAIR CUT", "BEARD", "OIL BATH", "CLASSIC SKIN CARE"]) {
        expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
      }
      expect(screen.getByRole("heading", { name: /333/ })).toBeVisible();
      expect(screen.getByRole("heading", { level: 2, name: "عرض أكتوبر" })).toBeVisible();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("tells each service as its own chapter", () => {
    render(<OctoberExperience />);
    for (const title of ["HAIR CUT", "BEARD", "OIL BATH", "CLASSIC SKIN CARE"]) {
      expect(screen.getByText(title, { selector: "h2" })).toBeInTheDocument();
    }
    expect(screen.getByText("البداية من القصّة.")).toBeInTheDocument();
    expect(screen.getByText("التفاصيل هي اللي بتفرق.")).toBeInTheDocument();
    expect(screen.getByText("راحة. عناية. بداية جديدة.")).toBeInTheDocument();
    expect(screen.getByText("والنهاية… Clean.")).toBeInTheDocument();
  });

  it("reveals 333 against the 670 original value", () => {
    render(<OctoberExperience />);
    const price = document.getElementById("october-price")!;
    expect(price).toHaveTextContent("333جنيه");
    expect(screen.getByText("القيمة الأصلية")).toBeInTheDocument();
    expect(price.closest("section")!.querySelector("del")).toHaveTextContent("670 جنيه");
    expect(screen.getByText("أربع خدمات. تجربة كاملة.")).toBeInTheDocument();
  });

  it("states the offer window, in-branch activation and flexible usage", () => {
    render(<OctoberExperience />);
    const offer = document.getElementById("october-offer")!;
    expect(within(offer).getByRole("heading", { level: 2, name: "عرض أكتوبر" })).toBeInTheDocument();
    expect(within(offer).getByText("٤ خدمات. تجربة كاملة.")).toBeInTheDocument();
    expect(within(offer).getByText(/^متاح من/)).toHaveTextContent("متاح من 5 أكتوبر حتى 31 أكتوبر");
    expect(within(offer).getByText("أربع خدمات").closest("p")).toHaveTextContent(/670 جنيه.*333 جنيه/);
    expect(document.querySelector('time[datetime="2026-10-05"]')).toBeInTheDocument();
    expect(document.querySelector('time[datetime="2026-10-31"]')).toBeInTheDocument();
    expect(screen.getByText("زور أقرب فرع CUT")).toBeInTheDocument();
    expect(screen.getByText("فعّل العرض وادفع قيمته في الفرع")).toBeInTheDocument();
    expect(screen.getByText("استخدم خدماتك خلال شهر أكتوبر")).toBeInTheDocument();
    expect(screen.getByText("مش لازم تستخدم الأربع خدمات في نفس الزيارة.")).toBeInTheDocument();
    expect(screen.getByText("لا يوجد دفع أو شراء للعرض أونلاين.")).toBeInTheDocument();
  });

  it("has no claim form, personal-data inputs, stock counter or claim API calls", () => {
    const { container } = render(<OctoberExperience />);
    expect(container.querySelector("form, input, textarea, select")).toBeNull();
    expect(screen.queryByText(/المتبقي/)).not.toBeInTheDocument();
    expect(screen.queryByText(/أكد عرض/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("drives branch visits and the existing booking flow", () => {
    render(<OctoberExperience />);
    expect(screen.getByRole("heading", { name: "جاهز تبدأ التجربة؟" })).toBeInTheDocument();
    for (const branch of OCTOBER_BRANCHES) {
      const item = screen.getByRole("heading", { level: 3, name: branch.name }).closest("li")!;
      expect(within(item).getByRole("link", { name: "افتح اللوكيشن" })).toHaveAttribute("href", branch.mapUrl);
      expect(within(item).getByRole("link", { name: "احجز في الفرع ده" })).toHaveAttribute("href", branch.bookHref);
    }
    expect(screen.getByRole("link", { name: "احجز زيارتك لـ CUT" })).toHaveAttribute("href", "/book");
    expect(screen.getByRole("link", { name: "اسألنا عن عرض أكتوبر" }).getAttribute("href")).toMatch(/^https:\/\/wa\.me\/201012126899/);
  });

  it("does not request missing media files", () => {
    const { container } = render(<OctoberExperience />);
    expect(container.querySelector("video, img")).toBeNull();
  });

  it("does not brand the campaign around the number", () => {
    const { container } = render(<OctoberExperience />);
    expect(container.textContent).not.toMatch(/Triple Three|333 Campaign|Three Threes/i);
  });
});

describe("October soundtrack", () => {
  it("never plays the music before Start", () => {
    render(<OctoberExperience />);
    for (const audio of FakeAudio.instances) expect(audio.play).not.toHaveBeenCalled();
  });

  it("plays /audio/oct.mp3 from its configured start point when the film starts", async () => {
    render(<OctoberExperience />);
    await startExperience();
    expect(music().src).toBe("/audio/oct.mp3");
    expect(music().play).toHaveBeenCalledTimes(1);
    expect(music().currentTime).toBe(OCTOBER_MUSIC.startAt);
    expect(music().muted).toBe(false);
  });

  it("pauses the music on manual interruption and on the pause button", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.wheel(window, { deltaY: 120 });
    });
    expect(music().paused).toBe(true);

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "استكمال التجربة" }));
    });
    expect(music().paused).toBe(false);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "إيقاف مؤقت" }));
    });
    expect(music().paused).toBe(true);
  });

  it("resumes the music at the film position, not from the top", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.wheel(window, { deltaY: 120 });
    });
    Object.defineProperty(window, "scrollY", { configurable: true, value: VIEWPORT });
    act(() => {
      fireEvent.scroll(window);
    });
    const haircutStart = OCTOBER_MUSIC.startAt + OCTOBER_CHAPTERS[0].duration / 1000;

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "استكمال التجربة" }));
    });
    expect(music().play).toHaveBeenCalledTimes(2);
    expect(music().currentTime).toBeGreaterThanOrEqual(haircutStart);
    expect(music().currentTime).toBeLessThan(haircutStart + 1);
  });

  it("mutes the music without pausing the film", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    });
    expect(music().muted).toBe(true);
    expect(music().paused).toBe(false);
    expect(screen.getByRole("button", { name: "إيقاف مؤقت" })).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تشغيل الصوت" }));
    });
    await waitFor(() => expect(music().muted).toBe(false));
    expect(music().paused).toBe(false);
  });

  it("on skip, lowers the music to the offer level and keeps it playing", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    try {
      render(<OctoberExperience />);
      await startExperience();
      act(() => {
        vi.advanceTimersByTime(400);
      });
      const position = music().currentTime;
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
      });
      act(() => {
        vi.advanceTimersByTime(MUSIC_END_FADE_MS + 200);
      });
      expect(music().paused).toBe(false);
      expect(music().volume).toBeCloseTo(OCTOBER_MUSIC.offerVolume);
      expect(music().currentTime).toBe(position);
      expect(music().play).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the same track playing quietly once an untouched film lands on the offer", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    });
    try {
      render(<OctoberExperience />);
      await startExperience();
      const filmMs = OCTOBER_CHAPTERS.reduce((sum, chapter) => sum + chapter.duration, 0);
      const priceMs = OCTOBER_CHAPTERS.find((chapter) => chapter.id === "price")!.duration;
      act(() => {
        vi.advanceTimersByTime(filmMs - priceMs - 500);
      });
      expect(music().volume).toBeCloseTo(OCTOBER_MUSIC.volume);
      act(() => {
        vi.advanceTimersByTime(priceMs + 2000);
      });
      expect(window.scrollTo).toHaveBeenLastCalledWith({ top: OFFER_TOP, behavior: "smooth" });
      expect(music().paused).toBe(false);
      expect(music().volume).toBeCloseTo(OCTOBER_MUSIC.offerVolume);
      expect(music().play).toHaveBeenCalledTimes(1);

      const position = music().currentTime;
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(music().paused).toBe(false);
      expect(music().volume).toBeCloseTo(OCTOBER_MUSIC.offerVolume);
      expect(music().currentTime).toBe(position);
    } finally {
      vi.useRealTimers();
    }
  });

  it("mutes and unmutes in the offer section without pausing or seeking", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
    });
    const position = music().currentTime;
    const toggle = () => screen.getAllByRole("button", { name: /(إيقاف|تشغيل) الصوت/ })[0];
    act(() => {
      fireEvent.click(toggle());
    });
    expect(music().muted).toBe(true);
    expect(music().paused).toBe(false);
    act(() => {
      fireEvent.click(toggle());
    });
    await waitFor(() => expect(music().muted).toBe(false));
    expect(music().paused).toBe(false);
    expect(music().currentTime).toBe(position);
  });

  it("plays the cue map in film order and never carries ambience into the wrong chapter", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    });
    try {
      const sound = getOctoberSound();
      const log: string[] = [];
      vi.spyOn(sound, "play").mockImplementation((slot) => void log.push(slot));
      vi.spyOn(sound, "stopAmbient").mockImplementation(() => void log.push("stop-ambience"));
      let ambience: string | null = null;
      vi.spyOn(sound, "ambient").mockImplementation(() => ambience as never);

      render(<OctoberExperience />);
      await startExperience();
      for (const chapter of OCTOBER_CHAPTERS) {
        ambience = OCTOBER_CHAPTER_AMBIENCE[chapter.id as keyof typeof OCTOBER_CHAPTER_AMBIENCE] ?? ambience;
        act(() => {
          vi.advanceTimersByTime(chapter.duration);
        });
      }

      const expected = OCTOBER_CHAPTERS.flatMap((chapter) => OCTOBER_SOUND_CUES[chapter.id].map((cue) => cue.sound));
      expect(log.filter((entry) => entry !== "stop-ambience")).toEqual(expected);
      const lastSpa = log.lastIndexOf("spa-air");
      const firstPriceCue = log.indexOf(OCTOBER_SOUND_CUES.price[0].sound, lastSpa);
      expect(log.slice(lastSpa, firstPriceCue)).toContain("stop-ambience");
    } finally {
      vi.useRealTimers();
    }
  });

  it("releases the music when leaving the page", async () => {
    const { unmount } = render(<OctoberExperience />);
    await startExperience();
    const audio = music();
    unmount();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe("");
  });

  it("releases the music when leaving from the offer section", async () => {
    const { unmount } = render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
    });
    const audio = music();
    expect(audio.paused).toBe(false);
    unmount();
    expect(audio.paused).toBe(true);
    expect(audio.src).toBe("");
  });

  it("does not autoplay music in reduced-motion mode", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      render(<OctoberExperience />);
      await startExperience();
      for (const audio of FakeAudio.instances) expect(audio.play).not.toHaveBeenCalled();
    } finally {
      window.matchMedia = matchMedia;
    }
  });
});

describe("Offer discovery drift", () => {
  const FILM_MS = OCTOBER_CHAPTERS.reduce((sum, chapter) => sum + chapter.duration, 0);
  const BLOCK_TOPS: Record<string, number> = { steps: 400, note: 700, branches: 1400 };
  const rect = Object.getOwnPropertyDescriptor(Element.prototype, "getBoundingClientRect")!;
  const scrollHeight = Object.getOwnPropertyDescriptor(document.documentElement, "scrollHeight");
  let scrollY = 0;
  let landingMs = 0;

  const setScrollY = (value: number) => {
    scrollY = value;
    Object.defineProperty(window, "scrollY", { configurable: true, value });
  };
  const driftCalls = () =>
    vi.mocked(window.scrollTo).mock.calls.filter(([arg]) => (arg as ScrollToOptions | undefined)?.behavior === "instant");
  const hint = () => screen.queryByRole("button", { name: "كمّل" });
  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    });
    setScrollY(0);
    landingMs = 0;
    window.scrollTo = vi.fn((arg?: ScrollToOptions | number) => {
      if (typeof arg !== "object" || arg.top === undefined) return;
      const top = arg.top;
      const land = () => {
        setScrollY(top);
        window.dispatchEvent(new Event("scroll"));
      };
      if (landingMs && arg.behavior === "smooth" && top === OFFER_TOP) setTimeout(land, landingMs);
      else land();
    }) as typeof window.scrollTo;
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 20_000 });
    Element.prototype.getBoundingClientRect = function (this: Element) {
      const block = (this as HTMLElement).dataset?.offerBlock;
      const top = block ? OFFER_TOP + BLOCK_TOPS[block] - scrollY : 0;
      return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON() {} } as DOMRect;
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(Element.prototype, "getBoundingClientRect", rect);
    if (scrollHeight) Object.defineProperty(document.documentElement, "scrollHeight", scrollHeight);
    else delete (document.documentElement as { scrollHeight?: number }).scrollHeight;
  });

  async function filmLandsOnOffer() {
    const view = render(<OctoberExperience />);
    await startExperience();
    advance(FILM_MS + 100);
    expect(scrollY).toBe(OFFER_TOP);
    return view;
  }

  async function filmDrifting() {
    const view = await filmLandsOnOffer();
    advance(1500);
    expect(hint()).toBeInTheDocument();
    return view;
  }

  it("starts only after the film completes, after a short pause, creeping downward slowly", async () => {
    render(<OctoberExperience />);
    await startExperience();
    advance(FILM_MS - 1000);
    expect(driftCalls()).toHaveLength(0);
    expect(hint()).not.toBeInTheDocument();

    advance(1100);
    expect(scrollY).toBe(OFFER_TOP);
    advance(1000);
    expect(driftCalls()).toHaveLength(0);
    expect(hint()).not.toBeInTheDocument();

    advance(500);
    expect(hint()).toBeInTheDocument();
    advance(5000);
    const moved = scrollY - OFFER_TOP;
    expect(moved).toBeGreaterThan(5000 * 0.015 * 0.8);
    expect(moved).toBeLessThan(5000 * 0.03);
  });

  it("counts the pause from when the landing scroll settles, not from the film's last frame", async () => {
    landingMs = 800;
    render(<OctoberExperience />);
    await startExperience();
    advance(FILM_MS + 100);
    expect(scrollY).toBeLessThan(OFFER_TOP);
    advance(800);
    expect(scrollY).toBe(OFFER_TOP);
    advance(1000);
    expect(hint()).not.toBeInTheDocument();
    expect(driftCalls()).toHaveLength(0);
    advance(400);
    expect(hint()).toBeInTheDocument();
  });

  it("does not start when the visitor skips to the offer", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
    });
    advance(6000);
    expect(driftCalls()).toHaveLength(0);
    expect(hint()).not.toBeInTheDocument();
  });

  it("wheel stops it permanently and hides the hint", async () => {
    await filmDrifting();
    act(() => {
      fireEvent.wheel(window, { deltaY: 40 });
    });
    expect(hint()).not.toBeInTheDocument();
    const calls = driftCalls().length;
    advance(20_000);
    expect(driftCalls()).toHaveLength(calls);
    expect(hint()).not.toBeInTheDocument();
  });

  it("a touch swipe stops it permanently", async () => {
    await filmDrifting();
    act(() => {
      fireEvent.touchStart(window, { touches: [{ clientX: 100, clientY: 400 }] });
      fireEvent.touchMove(window, { touches: [{ clientX: 100, clientY: 360 }] });
    });
    expect(hint()).not.toBeInTheDocument();
    const calls = driftCalls().length;
    advance(20_000);
    expect(driftCalls()).toHaveLength(calls);
  });

  it.each(["PageDown", "ArrowDown", "ArrowUp", "Home", "End"])("%s stops it permanently", async (key) => {
    await filmDrifting();
    act(() => {
      fireEvent.keyDown(window, { key });
    });
    expect(hint()).not.toBeInTheDocument();
    const calls = driftCalls().length;
    advance(20_000);
    expect(driftCalls()).toHaveLength(calls);
  });

  it("input during the pause means it never starts", async () => {
    await filmLandsOnOffer();
    act(() => {
      fireEvent.wheel(window, { deltaY: 40 });
    });
    advance(10_000);
    expect(driftCalls()).toHaveLength(0);
    expect(hint()).not.toBeInTheDocument();
  });

  it("comes to rest once the branches are in view and hides the hint", async () => {
    await filmDrifting();
    const rest = OFFER_TOP + BLOCK_TOPS.branches - window.innerHeight * 0.6;
    advance(((rest - OFFER_TOP) / 24) * 1000 + 3000);
    expect(scrollY).toBeLessThanOrEqual(Math.ceil(rest));
    expect(scrollY).toBeGreaterThan(rest - 3);
    expect(hint()).not.toBeInTheDocument();
  });

  it("tapping the hint glides to the next block and hands over control", async () => {
    await filmDrifting();
    act(() => {
      fireEvent.click(hint()!);
    });
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: OFFER_TOP + BLOCK_TOPS.steps - 88, behavior: "smooth" });
    expect(hint()).not.toBeInTheDocument();
    const calls = driftCalls().length;
    advance(20_000);
    expect(driftCalls()).toHaveLength(calls);
  });

  it("never starts with reduced motion", async () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ ...matchMedia(query), matches: query.includes("reduce") })) as typeof window.matchMedia;
    try {
      render(<OctoberExperience />);
      await startExperience();
      advance(FILM_MS + 20_000);
      expect(driftCalls()).toHaveLength(0);
      expect(hint()).not.toBeInTheDocument();
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("leaves no listener, timer or frame behind after unmount", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = await filmDrifting();
    const calls = driftCalls().length;
    unmount();
    advance(20_000);
    expect(driftCalls()).toHaveLength(calls);
    expect(vi.getTimerCount()).toBe(0);
    for (const type of ["wheel", "touchstart", "touchmove", "pointerdown", "pointermove", "pointerup", "keydown", "scroll"]) {
      const added = add.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn);
      const removed = new Set(remove.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn));
      expect(added.filter((fn) => !removed.has(fn))).toEqual([]);
    }
  });
});
