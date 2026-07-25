// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecentCard } from "@/pages/home/components/RecentCard";
import { skills } from "@/store/skills";
import { lang } from "@/store/system";
import { skillFixture } from "../fixtures";
import { cleanup, flush, mount, text } from "../mount";

const NOW = Date.parse("2026-07-22T12:00:00.000Z");

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  lang.value = "en";
  skills.value = [];
  vi.setSystemTime(NOW);
});

const at = (iso: string) => ({ installedAt: iso, updatedAt: null });

describe("RecentCard", () => {
  it("shows the empty note without activity", () => {
    skills.value = [skillFixture("a", ["Codex"], { installedAt: null })];
    const el = mount(<RecentCard />);
    expect(text(el)).toContain("No recent install activity");
  });

  it("counts every event but only lists the newest five", () => {
    skills.value = Array.from({ length: 7 }, (_, i) =>
      skillFixture(`skill-${i}`, ["Codex"], at(`2026-07-${10 + i}T12:00:00.000Z`)),
    );

    const el = mount(<RecentCard />);
    expect(text(el)).toContain("7 EVENTS");
    expect(text(el)).toContain("skill-6");
    expect(text(el)).toContain("skill-2");
    expect(text(el)).not.toContain("skill-1");
    expect(text(el)).toContain("+2 MORE");
  });

  it("formats the timestamp in the active language", () => {
    skills.value = [skillFixture("a", ["Codex"], at("2026-07-22T10:00:00.000Z"))];
    expect(text(mount(<RecentCard />))).toContain("2h ago");

    cleanup();
    lang.value = "es";
    expect(text(mount(<RecentCard />))).toContain("hace 2 h");
  });

  it("refreshes the timestamp as time passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    skills.value = [skillFixture("a", ["Codex"], at("2026-07-22T11:59:00.000Z"))];

    const el = mount(<RecentCard />);
    expect(text(el)).toContain("1m ago");

    vi.setSystemTime(NOW + 5 * 60_000);
    flush(() => vi.advanceTimersByTime(60_000));
    expect(text(el)).toContain("7m ago");
  });
});
