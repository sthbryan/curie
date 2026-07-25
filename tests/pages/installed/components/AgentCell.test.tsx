// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AgentCell } from "@/pages/installed/components/AgentCell";
import { lang } from "@/store/system";
import { cleanup, mount, text } from "../mount";

afterEach(cleanup);
beforeEach(() => {
  lang.value = "en";
});

describe("AgentCell", () => {
  it("says so when a skill reaches no tool", () => {
    expect(text(mount(<AgentCell agents={[]} />))).toBe("NO TOOLS");
  });

  it("shows both badges when there is nothing to hide", () => {
    const el = mount(<AgentCell agents={["Codex", "Zed"]} />);
    expect(text(el)).toContain("Codex");
    expect(text(el)).toContain("Zed");
    expect(text(el)).not.toContain("+");
  });

  it("keeps two badges and counts the rest", () => {
    const el = mount(<AgentCell agents={["Codex", "Zed", "Cursor", "Pi"]} />);
    expect(el.querySelectorAll("span[class*=border]").length).toBe(2);
    expect(text(el)).toContain("+2");
    expect(text(el)).not.toContain("Cursor");
  });

  it("lists the hidden tools in the title so they stay reachable", () => {
    const el = mount(<AgentCell agents={["Codex", "Zed", "Cursor", "Pi"]} />);
    const more = Array.from(el.querySelectorAll("span")).find((s) => s.textContent === "+2");
    expect(more?.getAttribute("title")).toBe("Cursor, Pi");
  });
});
