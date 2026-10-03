import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OctoberExperience } from "./OctoberExperience";
import { disposeOctoberSound } from "@/lib/offers/octoberSound";
import { MUSIC_END_FADE_MS, OCTOBER_BRANCHES, OCTOBER_CHAPTERS, OCTOBER_MUSIC } from "@/config/octoberOffer";

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
      expect(screen.getByRole("heading", { name: "العرض متاح من 5 أكتوبر حتى 31 أكتوبر" })).toBeVisible();
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
    expect(screen.getByRole("heading", { name: "العرض متاح من 5 أكتوبر حتى 31 أكتوبر" })).toBeInTheDocument();
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

  it("fades the music out and stops it on skip", async () => {
    render(<OctoberExperience />);
    await startExperience();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "تخطي" }));
    });
    expect(music().paused).toBe(false);
    await waitFor(() => expect(music().paused).toBe(true), { timeout: 1500 });
    expect(music().volume).toBe(0);
  });

  it("lets the music fade out as the film lands on the offer", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    });
    try {
      render(<OctoberExperience />);
      await startExperience();
      const filmMs = OCTOBER_CHAPTERS.reduce((sum, chapter) => sum + chapter.duration, 0);
      act(() => {
        vi.advanceTimersByTime(filmMs - MUSIC_END_FADE_MS - 500);
      });
      expect(music().paused).toBe(false);
      act(() => {
        vi.advanceTimersByTime(MUSIC_END_FADE_MS + 1500);
      });
      expect(window.scrollTo).toHaveBeenLastCalledWith({ top: OFFER_TOP, behavior: "smooth" });
      expect(music().paused).toBe(true);
      expect(music().volume).toBe(0);
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
