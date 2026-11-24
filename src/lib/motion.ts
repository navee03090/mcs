export const duration = {
  fast: 0.18,
  base: 0.35,
  slow: 0.55,
} as const;

export const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease } },
};

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const press = { scale: 0.98 };
export const hover = { scale: 1.02 };
