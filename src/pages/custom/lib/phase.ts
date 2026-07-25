import type { DetectionState } from "../hooks/useSkillDetection";
import { classifyTarget } from "./target";

export type InstallPhase =
  | "empty"
  | "invalid"
  | "checking"
  | "ready"
  | "noSkills"
  | "checkFailed"
  | "installing";

export function resolvePhase(
  input: string,
  installing: boolean,
  detection: DetectionState,
): InstallPhase {
  if (installing) return "installing";
  if (!input.trim()) return "empty";
  if (classifyTarget(input) === null) return "invalid";
  if (detection.kind === "ok") return "ready";
  if (detection.kind === "empty") return "noSkills";
  if (detection.kind === "error") return "checkFailed";
  return "checking";
}

export function isPending(phase: InstallPhase): boolean {
  return phase === "checking" || phase === "installing";
}
