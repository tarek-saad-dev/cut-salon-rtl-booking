import { fireEvent, render, screen } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { describe, expect, it, vi } from "vitest";
import { GATE_COPY, OpeningScene, OpeningStatic } from "./OpeningScene";

function renderGate(onStart = vi.fn()) {
  const view = render(
    <OpeningScene
      local={motionValue(0)}
      visibility={motionValue("visible")}
      started={false}
      allowVideo={false}
      onStart={onStart}
    />,
  );
  return { ...view, onStart };
}

describe("October opening gate", () => {
  it("leads with the cinematic headline, CTA and teaser", () => {
    const { onStart } = renderGate();
    expect(screen.getByText(GATE_COPY.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(GATE_COPY.headline)).toBeInTheDocument();
    expect(screen.getByText(GATE_COPY.accent)).toBeInTheDocument();
    expect(screen.getByText("٤ خدمات. تجربة كاملة.")).toBeInTheDocument();
    expect(screen.getByText("واكتشف عرض أكتوبر في نهاية الرحلة.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ابدأ التجربة" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("keeps the price a secret and drops the standalone CUT logo", () => {
    const { container } = renderGate();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/333|٣٣٣/);
    expect(screen.queryByText("CUT", { exact: true })).not.toBeInTheDocument();
  });

  it("reduced-motion opening also carries the teaser and no price", () => {
    const onStart = vi.fn();
    const { container } = render(<OpeningStatic onStart={onStart} />);
    expect(screen.getByText("٤ خدمات. تجربة كاملة.")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/333|٣٣٣/);
    fireEvent.click(screen.getByRole("button", { name: "ابدأ التجربة" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
