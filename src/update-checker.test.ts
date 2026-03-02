import { describe, it, expect, vi, afterEach } from "vitest";
import { isNewerVersion, checkForUpdate } from "./update-checker.js";

describe("isNewerVersion", () => {
  it("returns true when latest is higher major", () => {
    expect(isNewerVersion("2.0.0", "1.0.0")).toBe(true);
  });

  it("returns true when latest is higher minor", () => {
    expect(isNewerVersion("1.1.0", "1.0.0")).toBe(true);
  });

  it("returns true when latest is higher patch", () => {
    expect(isNewerVersion("1.0.1", "1.0.0")).toBe(true);
  });

  it("returns false when same version", () => {
    expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false);
  });

  it("returns false when current is higher", () => {
    expect(isNewerVersion("1.0.0", "2.0.0")).toBe(false);
  });

  it("returns false when latest minor is lower despite higher patch", () => {
    expect(isNewerVersion("1.0.9", "1.1.0")).toBe(false);
  });
});

describe("checkForUpdate", () => {
  const mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes to stderr when update is available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: "2.0.0" }),
    });

    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkForUpdate("test-pkg", "1.0.0");

    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("2.0.0");
    expect(output).toContain("test-pkg");
  });

  it("does not write when already on latest", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: "1.0.0" }),
    });

    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkForUpdate("test-pkg", "1.0.0");

    expect(spy).not.toHaveBeenCalled();
  });

  it("silently handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(checkForUpdate("test-pkg", "1.0.0")).resolves.toBeUndefined();
  });

  it("silently handles non-ok responses", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    await expect(checkForUpdate("test-pkg", "1.0.0")).resolves.toBeUndefined();
  });
});
