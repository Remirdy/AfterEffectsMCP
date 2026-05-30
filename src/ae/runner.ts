import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { OpLog, pathExists } from "../util.js";

export interface JsxRunResult {
  ok: boolean;
  output: string;
  error: string | null;
  jsxLog: string;
  rawStdout: string;
  scriptPath: string;
}

/** Common install locations probed when AE_BINARY is not set. */
const MAC_CANDIDATES = [
  "/Applications/Adobe After Effects 2026/Adobe After Effects 2026.app",
  "/Applications/Adobe After Effects 2025/Adobe After Effects 2025.app",
  "/Applications/Adobe After Effects 2024/Adobe After Effects 2024.app",
  "/Applications/Adobe After Effects 2023/Adobe After Effects 2023.app",
  "/Applications/Adobe After Effects (Beta)/Adobe After Effects (Beta).app",
];
const WIN_CANDIDATES = [
  "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/AfterFX.exe",
  "C:/Program Files/Adobe/Adobe After Effects 2025/Support Files/AfterFX.exe",
  "C:/Program Files/Adobe/Adobe After Effects 2024/Support Files/AfterFX.exe",
  "C:/Program Files/Adobe/Adobe After Effects 2023/Support Files/AfterFX.exe",
];

async function firstExisting(list: string[]): Promise<string | null> {
  for (const c of list) if (await pathExists(c)) return c;
  return null;
}

/** Resolve the AE application path (app bundle on mac, AfterFX.exe on win). */
export async function resolveAfterEffects(log: OpLog): Promise<string> {
  if (process.env.AE_BINARY && (await pathExists(process.env.AE_BINARY))) {
    return process.env.AE_BINARY;
  }
  const found =
    process.platform === "darwin"
      ? await firstExisting(MAC_CANDIDATES)
      : process.platform === "win32"
        ? await firstExisting(WIN_CANDIDATES)
        : null;
  if (!found) {
    throw new Error(
      "Adobe After Effects was not found. Set the AE_BINARY environment variable to the " +
        "After Effects application path (the .app bundle on macOS, or AfterFX.exe on Windows). " +
        "Checked default install locations and found none."
    );
  }
  log.info(`Using After Effects at: ${found}`);
  return found;
}

/** Locate the aerender binary for headless rendering. */
export async function resolveAerender(log: OpLog): Promise<string | null> {
  if (process.env.AERENDER_BINARY && (await pathExists(process.env.AERENDER_BINARY))) {
    return process.env.AERENDER_BINARY;
  }
  const macList = MAC_CANDIDATES.map((a) => path.join(a, "Contents/aerender"));
  const winList = WIN_CANDIDATES.map((w) => w.replace("AfterFX.exe", "aerender.exe"));
  const found =
    process.platform === "darwin"
      ? await firstExisting(macList)
      : process.platform === "win32"
        ? await firstExisting(winList)
        : null;
  if (found) log.info(`Using aerender at: ${found}`);
  return found;
}

function run(cmd: string, args: string[], timeoutMs: number): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Process timed out after ${timeoutMs}ms: ${cmd}`));
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

function parseResult(stdout: string): { ok: boolean; output: string; error: string | null; jsxLog: string } {
  const begin = stdout.indexOf("MP_RESULT_BEGIN");
  const logMark = stdout.indexOf("MP_LOG_BEGIN");
  const end = stdout.indexOf("MP_RESULT_END");
  if (begin < 0 || logMark < 0 || end < 0) {
    return { ok: false, output: "", error: "Could not parse JSX result markers.", jsxLog: stdout.slice(-2000) };
  }
  const resultLine = stdout.slice(begin + "MP_RESULT_BEGIN".length, logMark).trim();
  const jsxLog = stdout.slice(logMark + "MP_LOG_BEGIN".length, end).trim();
  const [okStr, output, error] = resultLine.split("|");
  return {
    ok: okStr.trim() === "true",
    output: (output ?? "").trim(),
    error: error && error.trim() && error.trim() !== "null" ? error.trim() : null,
    jsxLog,
  };
}

/**
 * Run a JSX script in After Effects and capture the MP_RESULT markers.
 * Uses ExtendScript Toolkit-free invocation:
 *   - macOS: `osascript` -> `do script` via the AE app, or `open -a ... <jsx>`
 *   - Windows: `AfterFX.exe -r <jsx>`
 */
export async function runJsx(
  jsx: string,
  log: OpLog,
  opts: { timeoutMs?: number } = {}
): Promise<JsxRunResult> {
  const timeoutMs = opts.timeoutMs ?? 1000 * 60 * 8;
  const aePath = await resolveAfterEffects(log);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "motionpilot-"));
  const scriptPath = path.join(tmpDir, "motionpilot.jsx");
  const resultPath = path.join(tmpDir, "result.txt");
  // Bake the result-file path into the script (replaces the placeholder token).
  const finalJsx = jsx.split("__MP_RESULT_FILE__").join(resultPath.replace(/\\/g, "\\\\"));
  await fs.writeFile(scriptPath, finalJsx, "utf8");
  log.info(`Wrote JSX: ${scriptPath}`);

  let stdout = "";
  if (process.platform === "win32") {
    // Windows: AfterFX.exe runs the script via -r and writes the result file.
    log.info(`Launching After Effects (Windows) to run script...`);
    const r = await run(aePath, ["-noui", "-r", scriptPath], Math.min(timeoutMs, 90_000)).catch(
      (e) => ({ code: -1, stdout: "", stderr: String(e) }) as { code: number; stdout: string; stderr: string }
    );
    stdout = r.stdout;
    if (r.stderr.trim()) log.warn(`AE stderr: ${r.stderr.trim().slice(0, 500)}`);
  } else {
    // macOS: send the script to the (running or to-be-launched) AE instance via
    // AppleScript DoScriptFile. This reliably executes even when AE is already open.
    const appName = path.basename(aePath).replace(/\.app$/i, "");
    log.info(`Dispatching script to "${appName}" via AppleScript DoScriptFile...`);
    // Ensure AE is running, then run the script. DoScriptFile returns immediately.
    const osa = [
      "-e",
      `tell application "${appName}" to activate`,
      "-e",
      `tell application "${appName}" to DoScriptFile "${scriptPath}"`,
    ];
    const r = await run("osascript", osa, 60_000).catch(
      (e) => ({ code: -1, stdout: "", stderr: String(e) }) as { code: number; stdout: string; stderr: string }
    );
    if (r.stderr.trim()) log.warn(`osascript: ${r.stderr.trim().slice(0, 500)}`);
  }

  // Poll the sidecar result file until the script finishes (or we time out).
  log.info(`Waiting for After Effects to finish (up to ${Math.round(timeoutMs / 1000)}s)...`);
  const deadline = Date.now() + timeoutMs;
  let fileText: string | null = null;
  while (Date.now() < deadline) {
    if (await pathExists(resultPath)) {
      // Small settle delay to ensure the file is fully written.
      await new Promise((r) => setTimeout(r, 400));
      fileText = await fs.readFile(resultPath, "utf8").catch(() => null);
      if (fileText && fileText.includes("MP_RESULT_END")) break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  const source = fileText && fileText.includes("MP_RESULT_BEGIN") ? fileText : stdout;
  const parsed = parseResult(source);
  if (!fileText && !stdout) {
    log.error(
      "After Effects did not return a result. It may be showing a modal dialog (e.g. missing " +
        "fonts) that is blocking the script. Dismiss any dialog in AE and retry."
    );
  } else if (!parsed.ok) {
    log.error(`JSX reported failure: ${parsed.error ?? "unknown"}`);
  } else {
    log.info(`JSX completed. Output: ${parsed.output}`);
  }
  return { ...parsed, rawStdout: source, scriptPath };
}

/** Render a comp headlessly using aerender when available (preferred for MP4/MOV). */
export async function runAerender(
  opts: { aepPath: string; compName: string; outputVideoPath: string },
  log: OpLog
): Promise<{ ok: boolean; output: string; logText: string }> {
  const bin = await resolveAerender(log);
  if (!bin) {
    throw new Error(
      "aerender was not found. Set AERENDER_BINARY or install After Effects with command-line rendering. " +
        "You can also render via the render_preview JSX path inside the AE UI."
    );
  }
  const args = ["-project", opts.aepPath, "-comp", opts.compName, "-output", opts.outputVideoPath];
  log.info(`aerender ${args.join(" ")}`);
  const { code, stdout, stderr } = await run(bin, args, 1000 * 60 * 30);
  const logText = (stdout + "\n" + stderr).slice(-4000);
  if (code !== 0) {
    log.error(`aerender exited ${code}`);
    return { ok: false, output: opts.outputVideoPath, logText };
  }
  log.info(`aerender finished: ${opts.outputVideoPath}`);
  return { ok: true, output: opts.outputVideoPath, logText };
}
