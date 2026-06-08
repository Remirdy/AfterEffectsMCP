import { spawn } from "node:child_process";
import { resolveAerender } from "../ae/runner.js";
import { OpLog, pathExists } from "../util.js";

export interface FarmRenderItem {
  aepPath: string;
  compName: string;
  outputVideoPath: string;
  maxRetries?: number;
}

export interface FarmRenderResult {
  aepPath: string;
  compName: string;
  outputVideoPath: string;
  status: "success" | "failed";
  attempts: number;
  error?: string;
}

export class RenderFarm {
  private log: OpLog;
  private maxConcurrency: number;

  constructor(log: OpLog, maxConcurrency = 2) {
    this.log = log;
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Runs the batch of render items in parallel up to maxConcurrency.
   */
  async renderBatch(items: FarmRenderItem[]): Promise<FarmRenderResult[]> {
    this.log.info(`RenderFarm enqueuing ${items.length} items with concurrency limit ${this.maxConcurrency}`);
    
    const results: FarmRenderResult[] = [];
    const queue = [...items];
    const activePromises: Promise<void>[] = [];

    // Worker pool
    const runWorker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        const result = await this.renderWithRetry(item);
        results.push(result);
      }
    };

    // Spin up workers
    const workerCount = Math.min(this.maxConcurrency, items.length);
    for (let i = 0; i < workerCount; i++) {
      activePromises.push(runWorker());
    }

    await Promise.all(activePromises);
    this.log.info("RenderFarm batch rendering completed.");
    return results;
  }

  private async renderWithRetry(item: FarmRenderItem): Promise<FarmRenderResult> {
    const maxRetries = item.maxRetries ?? 2;
    let attempts = 0;
    let success = false;
    let lastError = "";

    const bin = await resolveAerender(this.log);
    if (!bin) {
      return {
        aepPath: item.aepPath,
        compName: item.compName,
        outputVideoPath: item.outputVideoPath,
        status: "failed",
        attempts: 0,
        error: "aerender binary not found on this system.",
      };
    }

    while (attempts <= maxRetries && !success) {
      attempts++;
      this.log.info(`[${item.compName}] Starting render attempt ${attempts}/${maxRetries + 1}...`);
      
      try {
        await this.runAerenderCmd(bin, item);
        success = true;
        this.log.info(`[${item.compName}] Render succeeded on attempt ${attempts}.`);
      } catch (err) {
        lastError = (err as Error).message;
        this.log.warn(`[${item.compName}] Render failed on attempt ${attempts}: ${lastError}`);
        if (attempts <= maxRetries) {
          this.log.info(`[${item.compName}] Waiting 2s before retry...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    return {
      aepPath: item.aepPath,
      compName: item.compName,
      outputVideoPath: item.outputVideoPath,
      status: success ? "success" : "failed",
      attempts,
      error: success ? undefined : lastError,
    };
  }

  private runAerenderCmd(binPath: string, item: FarmRenderItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = ["-project", item.aepPath, "-comp", item.compName, "-output", item.outputVideoPath];
      const child = spawn(binPath, args, { windowsHide: true });
      
      let stdoutAccum = "";
      let stderrAccum = "";

      child.stdout.on("data", (data) => {
        const text = data.toString();
        stdoutAccum += text;
        
        // Parse progress e.g. "PROGRESS: 10%" or "Rendering frame 12 of 150"
        const progressMatch = text.match(/PROGRESS:\s*([\d%]+)/i) || 
                              text.match(/Rendering frame\s*(\d+)\s*of\s*(\d+)/i);
        if (progressMatch) {
          if (progressMatch[2]) {
            const current = parseInt(progressMatch[1], 10);
            const total = parseInt(progressMatch[2], 10);
            const pct = Math.round((current / total) * 100);
            this.log.info(`[${item.compName}] Progress: ${pct}% (frame ${current}/${total})`);
          } else {
            this.log.info(`[${item.compName}] Progress: ${progressMatch[1]}`);
          }
        }
      });

      child.stderr.on("data", (data) => {
        stderrAccum += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          const errMsg = stderrAccum.trim() || stdoutAccum.slice(-500).trim() || `Exit code ${code}`;
          reject(new Error(`aerender failed: ${errMsg}`));
        }
      });

      child.on("error", (err) => {
        reject(err);
      });
    });
  }
}
