import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { McpConnector } from "../src/mcp/connector.js";
import * as util from "../src/util.js";

// Mock the MCP Client SDK classes
const mockCallTool = vi.fn(async (opts) => {
  if (opts.name === "failing_tool") {
    return { isError: true, content: [{ text: "Tool execution failed" }] };
  }
  return { content: [{ text: `Result of tool ${opts.name}` }] };
});

const mockListTools = vi.fn(async () => {
  return {
    tools: [
      { name: "generate_video_shot", description: "generates a video shot" },
    ],
  };
});

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => {
  return {
    Client: vi.fn().mockImplementation(() => {
      return {
        connect: vi.fn(async () => {}),
        callTool: mockCallTool,
        listTools: mockListTools,
      };
    }),
  };
});

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => {
  return {
    StdioClientTransport: vi.fn().mockImplementation(() => {
      return {
        close: vi.fn(async () => {}),
      };
    }),
  };
});

describe("McpConnector Client Manager", () => {
  const connector = McpConnector.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await connector.shutdown();
  });

  it("should load configuration from files correctly", async () => {
    // Spy on pathExists and readJson to return a mock configuration
    vi.spyOn(util, "pathExists").mockResolvedValue(true);
    vi.spyOn(util, "readJson").mockResolvedValue({
      mcpServers: {
        testServer: {
          command: "node",
          args: ["dummy.js"],
          disabled: false,
        },
        disabledServer: {
          command: "node",
          disabled: true,
        },
      },
    });

    const config = await connector.findServerConfig("testServer");
    expect(config).not.toBeNull();
    expect(config?.command).toBe("node");
    expect(config?.args).toEqual(["dummy.js"]);

    const disabledConfig = await connector.findServerConfig("disabledServer");
    expect(disabledConfig).toBeNull();
  });

  it("should establish standard stdio transport connection", async () => {
    vi.spyOn(util, "pathExists").mockResolvedValue(true);
    vi.spyOn(util, "readJson").mockResolvedValue({
      mcpServers: {
        unityMCP: {
          command: "uvx",
          args: ["mcp-for-unity"],
        },
      },
    });

    const client = await connector.connect("unityMCP");
    expect(client).not.toBeNull();

    // Secondary connection request should return cached instance
    const clientCached = await connector.connect("unityMCP");
    expect(clientCached).toBe(client);
  });

  it("should execute client-side tool execution calls", async () => {
    vi.spyOn(util, "pathExists").mockResolvedValue(true);
    vi.spyOn(util, "readJson").mockResolvedValue({
      mcpServers: {
        unityMCP: {
          command: "uvx",
        },
      },
    });

    const result = await connector.callTool("unityMCP", "manage_vfx", { action: "vfx_create" });
    expect(result).toBeDefined();
    expect(result.content[0].text).toContain("Result of tool manage_vfx");
    expect(mockCallTool).toHaveBeenCalledWith({
      name: "manage_vfx",
      arguments: { action: "vfx_create" },
    });
  });

  it("should propagate tool errors correctly", async () => {
    vi.spyOn(util, "pathExists").mockResolvedValue(true);
    vi.spyOn(util, "readJson").mockResolvedValue({
      mcpServers: {
        unityMCP: {
          command: "uvx",
        },
      },
    });

    await expect(
      connector.callTool("unityMCP", "failing_tool", {})
    ).rejects.toThrow("Tool execution failed");
  });
});
