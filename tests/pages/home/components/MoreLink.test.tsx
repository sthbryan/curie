// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MoreLink } from "@/pages/home/components/MoreLink";
import { lang } from "@/store/system";
import { cleanup, click, mount, text } from "../mount";

afterEach(cleanup);
beforeEach(() => {
  lang.value = "en";
  history.replaceState(null, "", "/");
});

describe("MoreLink", () => {
  it("renders nothing when there is no overflow", () => {
    expect(text(mount(<MoreLink count={0} to="/installed" />))).toBe("");
    cleanup();
    expect(text(mount(<MoreLink count={-3} to="/installed" />))).toBe("");
  });

  it("announces how many rows were hidden", () => {
    expect(text(mount(<MoreLink count={4} to="/installed" />))).toContain("+4 MORE");
  });

  it("navigates to the full list", () => {
    const el = mount(<MoreLink count={4} to="/installed" />);
    click(el.querySelector("button"));
    expect(location.pathname).toBe("/installed");
  });
});
