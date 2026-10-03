import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OctoberExperience } from "./OctoberExperience";
import { disposeOctoberSound } from "@/lib/offers/octoberSound";
import { OCTOBER_BRANCHES } from "@/config/octoberOffer";

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
  window.scrollTo = vi.fn() as typeof window.scrollTo;
});

afterEach(() => {
  disposeOctoberSound();
  vi.unstubAllGlobals();
});

describe("October cinematic experience", () => {
  it("opens with the October story and a sound-optional start", () => {
    render(<OctoberExperience />);
    expect(screen.getByText("أكتوبر له مكانة خاصة.")).toBeInTheDocument();
    expect(screen.getByText("وفي CUT… بنحتفل بطريقتنا.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "احتفال أكتوبر من CUT" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ابدأ التجربة" })).toBeInTheDocument();
    expect(screen.getByText(/تجربة بالصوت/)).toBeInTheDocument();
  });

  it("never creates audio before an explicit interaction", async () => {
    render(<OctoberExperience />);
    expect(AudioContextSpy).not.toHaveBeenCalled();
    const toggle = screen.getByRole("button", { name: "تشغيل الصوت" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "ابدأ التجربة" }));
    });
    expect(AudioContextSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "إيقاف الصوت" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "إيقاف الصوت" }));
    expect(screen.getByRole("button", { name: "تشغيل الصوت" })).toHaveAttribute("aria-pressed", "false");
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
    const price = screen.getByRole("heading", { name: /333/ });
    expect(price).toHaveTextContent("333جنيه");
    expect(screen.getByText("القيمة الأصلية")).toBeInTheDocument();
    expect(document.querySelector("del")).toHaveTextContent("670 جنيه");
    expect(screen.getByText("أربع خدمات. تجربة كاملة.")).toBeInTheDocument();
  });

  it("explains in-branch activation and flexible October usage", () => {
    render(<OctoberExperience />);
    expect(screen.getByRole("heading", { name: "العرض يبدأ من 5 أكتوبر" })).toBeInTheDocument();
    expect(document.querySelector('time[datetime="2026-10-05"]')).toBeInTheDocument();
    expect(screen.getByText("زور أقرب فرع CUT")).toBeInTheDocument();
    expect(screen.getByText("فعّل العرض وادفع قيمته في الفرع")).toBeInTheDocument();
    expect(screen.getByText("استخدم خدماتك خلال شهر أكتوبر")).toBeInTheDocument();
    expect(screen.getByText("مش لازم تستخدم الأربع خدمات في نفس الزيارة.")).toBeInTheDocument();
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
