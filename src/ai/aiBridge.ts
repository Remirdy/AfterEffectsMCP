import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { OpLog, ensureDir, pathExists, readJson } from "../util.js";
import { createCanvas } from "@napi-rs/canvas";
import { McpConnector } from "../mcp/connector.js";
import { RunwayAdaptor } from "./runwayAdaptor.js";

export interface GenerateImageOptions {
  width?: number;
  height?: number;
  style?: string;
  palette?: string[];
  outputFolder: string;
  approveOverwrite?: boolean;
}

export interface GenerateVideoOptions {
  format?: "vertical" | "horizontal" | "square";
  duration?: number;
  fps?: number;
  outputFolder: string;
  approveOverwrite?: boolean;
}

export interface VideoJob {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  prompt: string;
  videoUrl?: string;
  outputPath?: string;
  error?: string;
  createdAt: number;
}

export class AiBridge {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Generates an image using an AI model (DALL-E if OPENAI_API_KEY is present)
   * or falls back to a high-quality procedural gradient plate.
   */
  async generateImage(prompt: string, opts: GenerateImageOptions): Promise<string> {
    const width = opts.width ?? 1080;
    const height = opts.height ?? 1920;
    const outName = `ai_plate_${Date.now()}.png`;
    const outPath = path.join(opts.outputFolder, outName);

    await ensureDir(opts.outputFolder);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        this.log.info(`Calling DALL-E for prompt: "${prompt}"`);
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: `${prompt}, style: ${opts.style ?? "modern professional digital art"}, color palette: ${(opts.palette ?? []).join(", ")}`,
            n: 1,
            size: `${width}x${height}` as any, // DALL-E 3 supports 1024x1024 or custom size
            response_format: "b64_json",
          }),
        });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI DALL-E error: ${errText}`);
      }

      const data = (await response.json()) as any;
      const b64 = data.data[0].b64_json;
      const buffer = Buffer.from(b64, "base64");
      await fs.writeFile(outPath, buffer);
      this.log.info(`DALL-E image saved to ${outPath}`);
      return outPath;
    } catch (e) {
      this.log.warn(`DALL-E generation failed: ${(e as Error).message}. Falling back to procedural generation.`);
    }
  }

    // Procedural Fallback
    this.log.info(`Generating procedural AI plate at ${outPath} (${width}x${height})...`);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Create a beautiful vibrant gradient background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.5);
    const colors = opts.palette && opts.palette.length >= 2 
      ? opts.palette 
      : ["#1e3c72", "#2a5298", "#ff007f", "#7928ca"]; // Fallback premium gradient
    
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    if (colors[2]) gradient.addColorStop(1, colors[2]);
    else gradient.addColorStop(1, "#0f172a");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw some techy/creative vector shapes (like glowing circles/rings)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 4;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, (width / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Overlay style cues as subtle typography
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("MOTIONPILOT AI GENERATION SYSTEM", 50, 60);

    ctx.font = "italic 18px sans-serif";
    ctx.fillText(`Prompt: ${prompt.substring(0, 60)}${prompt.length > 60 ? "..." : ""}`, 50, 100);
    ctx.fillText(`Style: ${opts.style ?? "Default"} | Palette: ${(opts.palette ?? ["Default"]).join(", ")}`, 50, 130);

    const buffer = canvas.toBuffer("image/png");
    await fs.writeFile(outPath, buffer);
    this.log.info(`Procedural AI plate saved successfully.`);
    return outPath;
  }

  /**
   * Triggers video generation (Runway/Kling adaptors if API is configured,
   * otherwise returns a mock job).
   */
  async generateVideo(prompt: string, opts: GenerateVideoOptions): Promise<VideoJob> {
    const jobId = `job_${Math.random().toString(36).substring(2, 11)}`;
    const outputVideoPath = path.join(opts.outputFolder, `ai_shot_${jobId}.mp4`);
    await ensureDir(opts.outputFolder);

    this.log.info(`Enqueuing AI video generation job: ${jobId} for prompt: "${prompt}"`);

    // --- Tier 1: Runway ML REST API ---
    const runway = new RunwayAdaptor(this.log);
    if (runway.isConfigured) {
      const runwayResult = await runway.generateVideo({
        prompt,
        format: opts.format,
        duration: (opts.duration ?? 4) as 4 | 8 | 10,
        outputDir: opts.outputFolder,
      });
      if (runwayResult.status === "completed") {
        return {
          jobId: runwayResult.jobId,
          status: "completed",
          progress: 100,
          prompt,
          outputPath: runwayResult.outputPath,
          videoUrl: runwayResult.videoUrl,
          createdAt: Date.now(),
        };
      }
    }

    // --- Tier 2: Dynamic MCP Connector check for video generation servers ---
    const connector = McpConnector.getInstance();
    connector.setLog(this.log);

    let videoServerName: string | null = null;
    const homedir = os.homedir();
    const configPaths = [
      "/Users/emirhan/.gemini/antigravity/mcp_config.json",
      path.join(homedir, "Library/Application Support/Claude/claude_desktop_config.json"),
    ];

    for (const p of configPaths) {
      try {
        if (await pathExists(p)) {
          const config = await readJson<any>(p);
          if (config?.mcpServers) {
            for (const key of Object.keys(config.mcpServers)) {
              if (key.toLowerCase().includes("video") || key.toLowerCase().includes("kling") || key.toLowerCase().includes("higgsfield")) {
                videoServerName = key;
                break;
              }
            }
          }
        }
      } catch (e) {}
      if (videoServerName) break;
    }

    if (videoServerName) {
      try {
        const client = await connector.connect(videoServerName);
        if (client) {
          this.log.info(`Querying tools for video server: ${videoServerName}`);
          const toolsRes = await client.listTools();
          const tool = toolsRes.tools.find((t: any) =>
            t.name.toLowerCase().includes("video") ||
            t.name.toLowerCase().includes("create") ||
            t.name.toLowerCase().includes("generate")
          );

          if (tool) {
            this.log.info(`Found tool "${tool.name}" on server "${videoServerName}". Triggering live video generation...`);
            const toolResult = await connector.callTool(videoServerName, tool.name, {
              prompt,
              format: opts.format || "vertical",
              duration: opts.duration || 4,
            });

            this.log.info(`Live video tool output: ${JSON.stringify(toolResult)}`);
            let videoUrl = "";
            let resolvedOutputPath = outputVideoPath;
            if (toolResult?.content?.[0]?.text) {
              const textContent = toolResult.content[0].text;
              const pathMatch = textContent.match(/(?:file:\/\/\S+|\/\S+\.mp4)/i);
              if (pathMatch) {
                resolvedOutputPath = pathMatch[0].replace("file://", "");
              }
            }

            return {
              jobId,
              status: "completed",
              progress: 100,
              prompt,
              outputPath: resolvedOutputPath,
              videoUrl,
              createdAt: Date.now(),
            };
          }
        }
      } catch (err) {
        this.log.warn(`Live video generation tool call failed: ${(err as Error).message}. Falling back to mock.`);
      }
    }

    // Standard video mock job fallback structure
    return {
      jobId,
      status: "pending",
      progress: 0,
      prompt,
      outputPath: outputVideoPath,
      createdAt: Date.now(),
    };
  }
}
