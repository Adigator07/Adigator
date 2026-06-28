export type IllustrationAnimation =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right";

type MotionState = {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
};

export const ILLUSTRATION_ENTRANCE: Record<
  IllustrationAnimation,
  { hidden: MotionState; visible: MotionState }
> = {
  fade: {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1 },
  },
  "fade-up": {
    hidden: { opacity: 0, y: 44, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -44, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: 48, scale: 0.97 },
    visible: { opacity: 1, x: 0, scale: 1 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: -48, scale: 0.97 },
    visible: { opacity: 1, x: 0, scale: 1 },
  },
};

export const ILLUSTRATION_ENTRANCE_REDUCED = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const ILLUSTRATION_ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
