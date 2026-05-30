import { promises as fs } from "node:fs";
import path from "node:path";

/** Lightweight structured logger that returns lines for inclusion in tool output. */
export class OpLog {
  private lines: string[] = [];
  info(msg: string) {
    const line = `[info] ${msg}`;
    this.lines.push(line);
    process.stderr.write(line + "\n");
  }
  warn(msg: string) {
    const line = `[warn] ${msg}`;
    this.lines.push(line);
    process.stderr.write(line + "\n");
  }
  error(msg: string) {
    const line = `[error] ${msg}`;
    this.lines.push(line);
    process.stderr.write(line + "\n");
  }
  toString() {
    return this.lines.join("\n");
  }
  get all() {
    return [...this.lines];
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function assertFile(p: string, label = "file"): Promise<void> {
  if (!path.isAbsolute(p)) {
    throw new Error(`${label} path must be absolute: ${p}`);
  }
  const stat = await fs.stat(p).catch(() => null);
  if (!stat || !stat.isFile()) {
    throw new Error(`${label} not found at: ${p}`);
  }
}

/**
 * Guard against overwriting existing files without explicit approval.
 * Implements the safety rule "Ask for user approval before overwriting files".
 */
export async function guardOverwrite(target: string, approved: boolean): Promise<void> {
  if ((await pathExists(target)) && !approved) {
    throw new Error(
      `Refusing to overwrite existing file: ${target}. ` +
        `Re-run with approveOverwrite=true to allow overwriting, or choose a different output path.`
    );
  }
}

export async function readJson<T>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson(p: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

/** Standard MCP text-content tool result. */
export function textResult(payload: unknown) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

export function errorResult(message: string, log?: OpLog) {
  const body = log ? `${message}\n\n--- log ---\n${log.toString()}` : message;
  return { content: [{ type: "text" as const, text: body }], isError: true };
}
