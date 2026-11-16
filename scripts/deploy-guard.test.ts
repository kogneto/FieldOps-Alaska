import { describe, expect, it } from "vitest";
import { deployBlocker, type RepoState } from "./deploy-guard";

const clean: RepoState = {
  uncommitted: "",
  upstream: "origin/main",
  head: "abc123",
  upstreamHead: "abc123",
};

describe("deployBlocker", () => {
  it("allows a deploy when everything is committed and pushed", () => {
    expect(deployBlocker(clean)).toBeNull();
  });

  it("refuses uncommitted or untracked changes", () => {
    expect(deployBlocker({ ...clean, uncommitted: " M src/lib/data.ts\n" })).toMatch(/uncommitted/);
    expect(deployBlocker({ ...clean, uncommitted: "?? notes.txt\n" })).toMatch(/uncommitted/);
  });

  it("refuses a branch that has never been pushed", () => {
    expect(deployBlocker({ ...clean, upstream: null, upstreamHead: null })).toMatch(
      /never been pushed/,
    );
  });

  it("refuses when local and pushed commits differ", () => {
    expect(deployBlocker({ ...clean, upstreamHead: "def456" })).toMatch(
      /doesn't match origin\/main/,
    );
  });
});
