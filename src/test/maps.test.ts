import { describe, expect, it } from "vitest";
import { mapsUrl, platformFrom } from "@/lib/maps";

describe("platformFrom", () => {
  it("recognises iPhone, iPad and Android", () => {
    expect(platformFrom("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(platformFrom("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe("ios");
    expect(platformFrom("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe("android");
  });

  it("treats a desktop Mac or PC as other", () => {
    expect(platformFrom("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe("other");
    expect(platformFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("other");
  });
});

describe("mapsUrl", () => {
  it("opens the platform's maps app at the coordinates", () => {
    expect(mapsUrl("ios", 67.25, -150.17)).toBe("maps://?ll=67.25,-150.17&q=67.25,-150.17");
    expect(mapsUrl("android", 67.25, -150.17)).toBe("geo:67.25,-150.17?q=67.25,-150.17");
    expect(mapsUrl("other", 67.25, -150.17)).toBe(
      "https://www.google.com/maps/search/?api=1&query=67.25,-150.17",
    );
  });
});
