import type { Transition, Variants } from "framer-motion";
import type { BookO2Step } from "@/hooks/useBookO2Session";

export const bookStepTransition: Transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

const softSpring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 28,
  mass: 0.85,
};

/** Distinct enter/exit personality per booking step. */
export function bookStepVariants(
  step: BookO2Step,
  dir: "rtl" | "ltr",
  goingBack: boolean,
): Variants {
  const start = dir === "rtl" ? 1 : -1;
  const flip = goingBack ? -1 : 1;

  switch (step) {
    case "intent":
      return {
        initial: { opacity: 0, y: 32 * flip, scale: 0.97, filter: "blur(4px)" },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: softSpring,
        },
        exit: {
          opacity: 0,
          y: -20 * flip,
          scale: 0.985,
          filter: "blur(2px)",
          transition: { duration: 0.28, ease: "easeIn" },
        },
      };
    case "branch":
      return {
        initial: { opacity: 0, x: 48 * start * flip },
        animate: { opacity: 1, x: 0, transition: softSpring },
        exit: {
          opacity: 0,
          x: -36 * start * flip,
          transition: { duration: 0.28, ease: "easeIn" },
        },
      };
    case "barber":
      return {
        initial: { opacity: 0, y: 40 * flip, rotate: goingBack ? -1.2 : 1.2 },
        animate: { opacity: 1, y: 0, rotate: 0, transition: softSpring },
        exit: {
          opacity: 0,
          y: -24 * flip,
          rotate: goingBack ? 1 : -1,
          transition: { duration: 0.26, ease: "easeIn" },
        },
      };
    case "services":
      return {
        initial: {
          opacity: 0,
          y: goingBack ? -36 : 48,
          scale: goingBack ? 1.02 : 0.96,
        },
        animate: { opacity: 1, y: 0, scale: 1, transition: softSpring },
        exit: {
          opacity: 0,
          y: goingBack ? 28 : -32,
          scale: goingBack ? 0.98 : 1.02,
          transition: { duration: 0.3, ease: "easeIn" },
        },
      };
    case "schedule":
      return {
        initial: {
          opacity: 0,
          scale: 0.94,
          rotateX: goingBack ? -8 : 10,
          transformPerspective: 900,
        },
        animate: {
          opacity: 1,
          scale: 1,
          rotateX: 0,
          transition: softSpring,
        },
        exit: {
          opacity: 0,
          scale: 0.97,
          rotateX: goingBack ? 6 : -6,
          transition: { duration: 0.28, ease: "easeIn" },
        },
      };
    case "details":
      return {
        initial: { opacity: 0, y: goingBack ? -44 : 56 },
        animate: { opacity: 1, y: 0, transition: softSpring },
        exit: {
          opacity: 0,
          y: goingBack ? 36 : -40,
          transition: { duration: 0.28, ease: "easeIn" },
        },
      };
    case "review":
      return {
        initial: {
          opacity: 0,
          scale: 0.92,
          y: 18 * flip,
          filter: "blur(6px)",
        },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          transition: softSpring,
        },
        exit: {
          opacity: 0,
          scale: 0.96,
          filter: "blur(3px)",
          transition: { duration: 0.26, ease: "easeIn" },
        },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
  }
}

export const STEP_ORDER: BookO2Step[] = [
  "intent",
  "branch",
  "barber",
  "services",
  "schedule",
  "details",
  "review",
];

export function stepOrderIndex(step: BookO2Step): number {
  const i = STEP_ORDER.indexOf(step);
  return i >= 0 ? i : 0;
}
