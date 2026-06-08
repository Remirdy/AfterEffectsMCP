import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { OpLog, pathExists, readJson } from "../util.js";

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export class McpConnector {
  private static instance: McpConnector | null = null;
  private clients = new Map<string, Client>();
  private transports = new Map<string, StdioClientTransport>();
  private log: OpLog;

  private constructor() {
    this.log = new OpLog();
  }

  public static getInstance(): McpConnector {
    if (!McpConnector.instance) {
      McpConnector.instance = new McpConnector();
    }
    return McpConnector.instance;
  }

  /**
   * Set or override the operational log instance.
   */
  public setLog(log: OpLog) {
    this.log = log;
  }

  /**
   * Scan configuration files to find connection options for an MCP server.
   */
  public async findServerConfig(serverName: string): Promise<McpServerConfig | null> {
    const homedir = os.homedir();
    const possiblePaths = [
      "/Users/emirhan/.gemini/antigravity/mcp_config.json",
      path.join(homedir, "Library/Application Support/Claude/claude_desktop_config.json"),
    ];

    for (const p of possiblePaths) {
      try {
        if (await pathExists(p)) {
          const config = await readJson<any>(p);
          if (config?.mcpServers?.[serverName]) {
            const server = config.mcpServers[serverName];
            if (server.disabled === true) {
              this.log.info(`MCP server "${serverName}" is explicitly disabled in ${path.basename(p)}`);
              continue;
            }
            return {
              command: server.command,
              args: server.args || [],
              env: server.env || {},
              cwd: server.cwd,
            };
          }
        }
      } catch (e) {
        // Ignore reading errors
      }
    }
    return null;
  }

  /**
   * Connect to an MCP server using its configured command/arguments via Stdio.
   */
  public async connect(serverName: string): Promise<Client | null> {
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    this.log.info(`Searching config for MCP server: ${serverName}`);
    const config = await this.findServerConfig(serverName);
    if (!config) {
      this.log.warn(`No configuration found for MCP server: ${serverName}. Live calls will fall back to mock.`);
      return null;
    }

    try {
      this.log.info(`Connecting to MCP server "${serverName}" using: ${config.command} ${config.args?.join(" ")}`);
      
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: {
          ...process.env,
          ...(config.env || {}),
        } as Record<string, string>,
        stderr: process.stderr, // Forward stderr for log visibility
      });

      const client = new Client(
        {
          name: "motionpilot-mcp-connector",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      this.clients.set(serverName, client);
      this.transports.set(serverName, transport);
      this.log.info(`Successfully connected to MCP server: ${serverName}`);
      return client;
    } catch (err) {
      this.log.error(`Failed to connect to MCP server "${serverName}": ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Invoke a tool on a connected MCP server.
   */
  public async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    const client = await this.connect(serverName);
    if (!client) {
      throw new Error(`MCP server "${serverName}" is not connected.`);
    }

    this.log.info(`Calling tool "${toolName}" on MCP server "${serverName}"...`);
    const response = await client.callTool({
      name: toolName,
      arguments: args,
    });

    if (response.isError) {
      const contents = response.content as Array<{ text?: string }> | undefined;
      const errText = contents?.[0]?.text || "Unknown tool execution error";
      throw new Error(`MCP tool "${toolName}" reported error: ${errText}`);
    }

    return response;
  }

  /**
   * Disconnect all active MCP sessions.
   */
  public async shutdown(): Promise<void> {
    this.log.info("Shutting down all connected MCP clients...");
    for (const [name, client] of this.clients.entries()) {
      try {
        const transport = this.transports.get(name);
        await transport?.close();
        this.log.info(`Closed connection to MCP server: ${name}`);
      } catch (err) {
        // Ignore close errors
      }
    }
    this.clients.clear();
    this.transports.clear();
  }
}
