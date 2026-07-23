import type { Transition } from "motion";

type ReducedMotionProps = {
  shouldReduceMotion: boolean | null;
  transition?: Transition;
};

export function reducedTransition({
  shouldReduceMotion,
  transition,
}: ReducedMotionProps): Transition | undefined {
  if (shouldReduceMotion) return { duration: 0 };
  return transition;
}
