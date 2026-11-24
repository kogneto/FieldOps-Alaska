import { describe, expect, it } from "vitest";
import { precacheVersion, urlForFile, withCacheHeaders } from "./precache";

describe("urlForFile", () => {
  it("caches pages under the route a technician opens", () => {
    expect(urlForFile("index.html")).toBe("/");
    expect(urlForFile("directory.html")).toBe("/directory");
    expect(urlForFile("operators/op-amhs.html")).toBe("/operators/op-amhs");
    expect(urlForFile("sites\\site-coldfoot.html")).toBe("/sites/site-coldfoot");
    expect(urlForFile("sites/index.html")).toBe("/sites");
  });

  it("caches assets under their own path", () => {
    expect(urlForFile("assets/index-abc.js")).toBe("/assets/index-abc.js");
    expect(urlForFile("assets/hind-latin-400-normal.woff2")).toBe(
      "/assets/hind-latin-400-normal.woff2",
    );
    expect(urlForFile("manifest.webmanifest")).toBe("/manifest.webmanifest");
  });

  it("leaves out files the app never needs offline", () => {
    expect(urlForFile("_headers")).toBeNull();
    expect(urlForFile("sw.js")).toBeNull();
    expect(urlForFile("robots.txt")).toBeNull();
    expect(urlForFile("assets/hind-latin-400-normal.woff")).toBeNull();
  });
});

describe("precacheVersion", () => {
  const file = (path: string, text: string) => ({ path, content: new TextEncoder().encode(text) });

  it("ignores the order files are listed in", () => {
    const a = precacheVersion([file("a.js", "1"), file("b.js", "2")]);
    const b = precacheVersion([file("b.js", "2"), file("a.js", "1")]);
    expect(a).toBe(b);
  });

  it("changes when any file's content or name changes", () => {
    const base = precacheVersion([file("a.js", "1")]);
    expect(precacheVersion([file("a.js", "2")])).not.toBe(base);
    expect(precacheVersion([file("c.js", "1")])).not.toBe(base);
  });
});

describe("withCacheHeaders", () => {
  it("adds the asset and service worker rules to an empty file", () => {
    expect(withCacheHeaders("")).toBe(
      "/assets/*\n  cache-control: public, max-age=31536000, immutable\n" +
        "/sw.js\n  cache-control: no-cache\n",
    );
  });

  it("keeps an existing rule and adds only what is missing, once", () => {
    const once = withCacheHeaders("/assets/*\n  cache-control: immutable");
    expect(once).toBe("/assets/*\n  cache-control: immutable\n/sw.js\n  cache-control: no-cache\n");
    expect(withCacheHeaders(once)).toBe(once);
  });
});
