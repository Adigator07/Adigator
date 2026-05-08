export const motionTokens = {
  duration: {
    fast: 0.25,
    base: 0.5,
    slow: 0.7,
    hero: 0.85,
  },
  delay: {
    none: 0,
    short: 0.08,
    medium: 0.15,
    long: 0.24,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1] as const,
    soft: [0.25, 1, 0.5, 1] as const,
  },
};

export const transitions = {
  reveal: {
    duration: motionTokens.duration.slow,
    ease: motionTokens.ease.standard,
  },
  card: {
    duration: motionTokens.duration.base,
    ease: motionTokens.ease.standard,
  },
  hero: {
    duration: motionTokens.duration.hero,
    ease: motionTokens.ease.standard,
  },
};
