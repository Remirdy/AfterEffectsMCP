#!/usr/bin/env node
/**
 * Remote HTTP entrypoint for MotionPilot AE MCP.
 *
 * Exposes the same tools as the stdio server over the MCP **Streamable HTTP**
 * transport, so remote MCP clients can connect — including:
 *   - ChatGPT custom connectors (Settings -> Connectors -> Add, MCP server URL)
 *   - the OpenAI Responses API `mcp` tool (server_url)
 *   - any other Streamable-HTTP MCP host
 *
 * Endpoint:  POST/GET/DELETE  http://<host>:<port>/mcp
 *
 * Security:
 *   - Binds to 127.0.0.1 by default (set HOST=0.0.0.0 to expose).
 *   - If MOTIONPILOT_HTTP_TOKEN is set, every request must send
 *       Authorization: Bearer <token>
 *   - This server can open After Effects, write .aep files, render video and
 *     delete layers. Never expose it publicly without a token + a tunnel.
 */
import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./index.js";

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? "127.0.0.1";
const TOKEN = process.env.MOTIONPILOT_HTTP_TOKEN;

const app = express();
app.use(express.json({ limit: "25mb" }));

// Optional bearer-token gate.
app.use((req: Request, res: Response, next) => {
  if (!TOKEN) return next();
  const header = req.headers.authorization ?? "";
  if (header === `Bearer ${TOKEN}`) return next();
  res
    .status(401)
    .json({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null });
});

// Lightweight health check for tunnels / load balancers.
app.get("/health", (_req, res) => res.json({ ok: true, server: "motionpilot-ae-mcp" }));

// One transport per MCP session, keyed by the Mcp-Session-Id header.
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport | undefined =
    sessionId ? transports[sessionId] : undefined;

  if (!transport) {
    if (sessionId || !isInitializeRequest(req.body)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: no valid session, expected initialize" },
        id: null,
      });
      return;
    }
    // New session — create a transport + a fresh server instance.
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport!;
      },
    });
    transport.onclose = () => {
      if (transport!.sessionId) delete transports[transport!.sessionId];
    };
    const server = createMcpServer();
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});

// GET (SSE stream) and DELETE (session teardown) share one handler.
const handleSession = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  const transport = sessionId ? transports[sessionId] : undefined;
  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transport.handleRequest(req, res);
};

app.get("/mcp", handleSession);
app.delete("/mcp", handleSession);

app.listen(PORT, HOST, () => {
  process.stderr.write(
    `motionpilot-ae-mcp HTTP transport on http://${HOST}:${PORT}/mcp` +
      (TOKEN ? " (bearer auth enabled)\n" : " (NO auth — localhost only)\n")
  );
});
