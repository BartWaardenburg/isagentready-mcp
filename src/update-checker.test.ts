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

  it("returns true when higher major with lower minor/patch on current", () => {
    expect(isNewerVersion("2.0.0", "1.9.9")).toBe(true);
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

  it("handles missing patch segment on latest", () => {
    expect(isNewerVersion("1.1", "1.0.0")).toBe(true);
  });

  it("handles missing patch segment on current", () => {
    expect(isNewerVersion("1.0.1", "1.0")).toBe(true);
  });

  it("handles equal versions with missing segments", () => {
    expect(isNewerVersion("1.0", "1.0")).toBe(false);
  });

  it("handles both missing patch segments", () => {
    expect(isNewerVersion("1.1", "1.0")).toBe(true);
  });

  it("handles both missing patch segments when equal", () => {
    expect(isNewerVersion("1.0", "1.0")).toBe(false);
  });
});

describe("checkForUpdate", () => {
  const mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes to stderr when update is available", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ version: "2.0.0" }), { status: 200 }),
    );

    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkForUpdate("isagentready-mcp", "1.0.0");

    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain("Update available: 1.0.0 → 2.0.0");
    expect(output).toContain("npm install -g isagentready-mcp@latest");
  });

  it("does not write when already on latest", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ version: "1.0.0" }), { status: 200 }),
    );

    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await checkForUpdate("isagentready-mcp", "1.0.0");

    expect(spy).not.toHaveBeenCalled();
  });

  it("silently handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(checkForUpdate("isagentready-mcp", "1.0.0")).resolves.toBeUndefined();
  });

  it("silently handles non-ok responses", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(checkForUpdate("isagentready-mcp", "1.0.0")).resolves.toBeUndefined();
  });
});
