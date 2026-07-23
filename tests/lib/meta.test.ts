import { describe, expect, it } from "vitest";
import { APP_NAME, APP_VERSION, APP_VERSION_LABEL } from "@/lib/meta";

describe("meta", () => {
  it("exposes the app name from the build define", () => {
    expect(APP_NAME).toBe("Curie");
  });

  it("builds a v-prefixed version label from the app version", () => {
    expect(APP_VERSION_LABEL).toBe(`v${APP_VERSION}`);
    expect(APP_VERSION_LABEL.startsWith("v")).toBe(true);
  });
});
