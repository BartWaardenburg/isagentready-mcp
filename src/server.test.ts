import { describe, it, expect } from "vitest";
import { createServer, parseToolsets } from "./server.js";
import type { IsAgentReadyClient } from "./client.js";

const mockClient = {} as IsAgentReadyClient;

type RegisteredTool = { annotations?: Record<string, unknown> };
type ServerWithTools = { _registeredTools: Record<string, RegisteredTool> };

const getTools = (toolsets?: Set<string>): Record<string, RegisteredTool> =>
  (createServer(mockClient, toolsets as never) as unknown as ServerWithTools)._registeredTools;

describe("createServer", () => {
  it("creates a server", () => {
    const server = createServer(mockClient);
    expect(server).toBeDefined();
  });

  it("registers all 3 tools", () => {
    const tools = getTools();
    expect(Object.keys(tools)).toHaveLength(3);
  });

  it("registers all expected tool names", () => {
    const tools = getTools();

    const expectedTools = [
      "scan_website",
      "get_scan_results",
      "get_rankings",
    ];

    for (const name of expectedTools) {
      expect(name in tools, `Tool "${name}" should be registered`).toBe(true);
    }
  });

  it("all tools have annotations", () => {
    const tools = getTools();

    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.annotations, `Tool "${name}" should have annotations`).toBeDefined();
    }
  });
});

describe("parseToolsets", () => {
  it("returns all toolsets when env is undefined", () => {
    const result = parseToolsets(undefined);
    expect(result.size).toBe(2);
  });

  it("returns all toolsets when env is empty", () => {
    const result = parseToolsets("");
    expect(result.size).toBe(2);
  });

  it("parses a single toolset", () => {
    const result = parseToolsets("scans");
    expect(result).toEqual(new Set(["scans"]));
  });

  it("parses multiple toolsets", () => {
    const result = parseToolsets("scans,rankings");
    expect(result).toEqual(new Set(["scans", "rankings"]));
  });

  it("ignores invalid toolset names", () => {
    const result = parseToolsets("scans,invalid");
    expect(result).toEqual(new Set(["scans"]));
  });

  it("returns all toolsets if all names are invalid", () => {
    const result = parseToolsets("invalid,unknown");
    expect(result.size).toBe(2);
  });

  it("handles whitespace in toolset names", () => {
    const result = parseToolsets(" scans , rankings ");
    expect(result).toEqual(new Set(["scans", "rankings"]));
  });
});

describe("toolset filtering", () => {
  it("registers only scan tools when scans toolset is selected", () => {
    const tools = getTools(new Set(["scans"]) as never);
    expect("scan_website" in tools).toBe(true);
    expect("get_scan_results" in tools).toBe(true);
    expect("get_rankings" in tools).toBe(false);
  });

  it("registers only ranking tools when rankings toolset is selected", () => {
    const tools = getTools(new Set(["rankings"]) as never);
    expect("get_rankings" in tools).toBe(true);
    expect("scan_website" in tools).toBe(false);
    expect("get_scan_results" in tools).toBe(false);
  });
});
