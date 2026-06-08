/**
 * PersonalizedVideoAtScale — MotionPilot
 *
 * Takes a template AEP + CSV data file → generates one personalized AEP
 * (and optionally triggers render) per row. Perfect for:
 *  - Birthday/anniversary videos ("Happy birthday {name}")
 *  - Personalized sales proposals
 *  - Sports highlight reels per athlete
 */

import fs from "node:fs/promises";
import path from "node:path";
import { OpLog, assertFile, ensureDir } from "../util.js";
import { runJsx } from "../ae/runner.js";
import { withReport } from "../ae/jsxGenerator.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonalizationMapping {
  /** Text layer name in AEP (e.g. "Name_Layer") */
  layerName: string;
  /** CSV column header (e.g. "name") */
  csvColumn: string;
}

export interface PersonalizedVideoOptions {
  /** Template AEP path */
  templateAepPath: string;
  /** Target composition name */
  compName: string;
  /** CSV file path (first row = headers) */
  csvPath: string;
  /** Directory where per-person AEPs will be saved */
  outputDir: string;
  /** Mapping of layer names to CSV columns */
  mappings: PersonalizationMapping[];
  /** Max rows to process (0 = all) */
  maxRows?: number;
  /** Prefix for output filenames (default: "personalized") */
  filenamePrefix?: string;
  approveOverwrite?: boolean;
}

export interface PersonalizedRecord {
  rowIndex: number;
  data: Record<string, string>;
  outputAepPath: string;
  ok: boolean;
  error?: string;
}

export interface PersonalizedVideoResult {
  totalRows: number;
  processed: number;
  succeeded: number;
  failed: number;
  records: PersonalizedRecord[];
}

// ---------------------------------------------------------------------------
// CSV parser (no external deps)
// ---------------------------------------------------------------------------

function parseCsv(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// PersonalizedVideoManager class
// ---------------------------------------------------------------------------

export class PersonalizedVideoManager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async generate(opts: PersonalizedVideoOptions): Promise<PersonalizedVideoResult> {
    await assertFile(opts.templateAepPath, "Template AEP");
    await assertFile(opts.csvPath, "CSV data file");
    await ensureDir(opts.outputDir);

    const csvRaw = await fs.readFile(opts.csvPath, "utf8");
    const { rows } = parseCsv(csvRaw);

    const maxRows = opts.maxRows && opts.maxRows > 0 ? opts.maxRows : rows.length;
    const prefix = opts.filenamePrefix ?? "personalized";

    this.log.info(
      `PersonalizedVideo: processing ${Math.min(rows.length, maxRows)} of ${rows.length} rows from ${opts.csvPath}`
    );

    const records: PersonalizedRecord[] = [];

    for (let ri = 0; ri < Math.min(rows.length, maxRows); ri++) {
      const row = rows[ri];
      const slug = Object.values(row)[0]?.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\u00C0-\u024F]/g, "") || `row_${ri}`;
      const outputAepPath = path.join(opts.outputDir, `${prefix}_${slug}_${ri}.aep`);

      this.log.info(`  [${ri + 1}/${Math.min(rows.length, maxRows)}] Processing: ${JSON.stringify(row)}`);

      // Build text substitutions
      const textSubs: Record<string, string> = {};
      for (const mapping of opts.mappings) {
        if (row[mapping.csvColumn] !== undefined) {
          textSubs[mapping.layerName] = row[mapping.csvColumn];
        }
      }

      const subsJson = JSON.stringify(textSubs);

      const jsx = withReport(`
        var aepFile = new File(${JSON.stringify(opts.templateAepPath)});
        if (!aepFile.exists) throw new Error("Template AEP not found");
        app.open(aepFile);

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
          var item = app.project.item(i);
          if (item instanceof CompItem && item.name === ${JSON.stringify(opts.compName)}) { comp = item; break; }
        }
        if (!comp) throw new Error("Comp not found: " + ${JSON.stringify(opts.compName)});

        var subs = ${subsJson};
        var updated = 0;

        for (var li = 1; li <= comp.numLayers; li++) {
          var layer = comp.layer(li);
          if (subs[layer.name] === undefined) continue;

          var srcText = layer.property("ADBE Text Properties").property("ADBE Text Document");
          if (srcText) {
            var td = srcText.value;
            td.text = subs[layer.name];
            srcText.setValue(td);
            updated++;
          }
        }

        app.project.save(new File(${JSON.stringify(outputAepPath)}));
        __result.output = updated.toString();
      `);

      const result = await runJsx(jsx, this.log);
      const record: PersonalizedRecord = {
        rowIndex: ri,
        data: row,
        outputAepPath,
        ok: result.ok,
        error: result.ok ? undefined : result.error ?? "Unknown render error",
      };

      records.push(record);
    }

    const succeeded = records.filter((r) => r.ok).length;
    const failed = records.length - succeeded;

    this.log.info(
      `PersonalizedVideo complete: ${succeeded} succeeded, ${failed} failed out of ${records.length} rows.`
    );

    return {
      totalRows: rows.length,
      processed: records.length,
      succeeded,
      failed,
      records,
    };
  }
}
