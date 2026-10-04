import { fireEvent, render } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";
import { OCTOBER_SCENES, resolveSceneFrames } from "@/config/octoberOffer";
import { FinalFrame, SceneGallery, SceneGalleryStill } from "./SceneGallery";

const scene = OCTOBER_SCENES[0];
const allAvailable = new Set(scene.frames.map((frame) => frame.file));

describe("SceneGallery", () => {
  it("renders the two detail frames as images once uploaded", () => {
    const frames = resolveSceneFrames(scene, allAvailable);
    const { container } = render(<SceneGallery sceneId={scene.id} frames={frames} local={motionValue(0.4)} near lite={false} />);
    const images = [...container.querySelectorAll("img")];
    expect(images.map((img) => img.getAttribute("src"))).toEqual([frames[1].src, frames[2].src]);
    expect(container.textContent).toContain(scene.frames[1].caption);
    expect(container.textContent).toContain(scene.frames[2].caption);
  });

  it("falls back to built-in panels without requesting missing files", () => {
    const { container } = render(
      <SceneGallery sceneId={scene.id} frames={resolveSceneFrames(scene)} local={motionValue(0.4)} near lite={false} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelectorAll("[data-fallback]")).toHaveLength(2);
    expect(container.textContent).toContain(scene.frames[1].caption);
  });

  it("swaps a broken image for its panel", () => {
    const frames = resolveSceneFrames(scene, allAvailable);
    const { container } = render(<SceneGallery sceneId={scene.id} frames={frames} local={motionValue(0.4)} near lite={false} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(container.querySelectorAll("[data-fallback]")).toHaveLength(1);
  });

  it("does not load images for distant chapters, and lite devices get one card", () => {
    const frames = resolveSceneFrames(scene, allAvailable);
    const far = render(<SceneGallery sceneId={scene.id} frames={frames} local={motionValue(-1)} near={false} lite={false} />);
    expect(far.container.querySelector("img")).toBeNull();
    const lite = render(<SceneGallery sceneId={scene.id} frames={frames} local={motionValue(0.4)} near lite />);
    expect(lite.container.querySelectorAll("figure")).toHaveLength(1);
  });

  it("settles on the final hero frame only when it exists", () => {
    const frames = resolveSceneFrames(scene, allAvailable);
    const withFinal = render(<FinalFrame frame={frames[3]} local={motionValue(0.9)} near />);
    expect(withFinal.container.querySelector("img")).toHaveAttribute("src", frames[3].src);
    const missing = render(<FinalFrame frame={resolveSceneFrames(scene)[3]} local={motionValue(0.9)} near />);
    expect(missing.container.querySelector("img")).toBeNull();
  });

  it("has a still variant for reduced motion", () => {
    const { container } = render(<SceneGalleryStill sceneId={scene.id} frames={resolveSceneFrames(scene)} />);
    expect(container.querySelectorAll("figure")).toHaveLength(2);
    expect(container.querySelector("[style]")).toBeNull();
  });
});
