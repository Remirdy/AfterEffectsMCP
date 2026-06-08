import fs from "node:fs/promises";
import path from "node:path";
import { runJsx } from "../ae/runner.js";
import { withReport } from "../ae/jsxGenerator.js";
import { OpLog, assertFile, ensureDir, readJson } from "../util.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocaleEntry {
  /** ISO-639 locale code, e.g. "tr", "en", "de", "ar" */
  locale: string;
  /** Map of text-layer name → translated string */
  texts: Record<string, string>;
  /** Optional per-layer font override, e.g. { "Subtitle": "Arial" } */
  fontOverrides?: Record<string, string>;
  /** Output filename suffix; defaults to locale code */
  filenameSuffix?: string;
}

export interface LocalizationPackOptions {
  /** Source AEP file path */
  aepPath: string;
  /** Target composition name inside the AEP */
  compName: string;
  /** Directory where locale-specific AEPs will be saved */
  outputDir: string;
  /** Array of locale configurations */
  locales: LocaleEntry[];
  /**
   * Optional path to a JSON file that provides the locales array
   * (overrides the `locales` field when specified).
   */
  localesJsonPath?: string;
  approveOverwrite?: boolean;
}

export interface LocalizationPackResult {
  locale: string;
  outputPath: string;
  layersUpdated: number;
}

// ---------------------------------------------------------------------------
// LocalizationPackManager
// ---------------------------------------------------------------------------

export class LocalizationPackManager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Resolve the locale list: either inline or from a JSON file.
   */
  private async resolveLocales(opts: LocalizationPackOptions): Promise<LocaleEntry[]> {
    if (opts.localesJsonPath) {
      await assertFile(opts.localesJsonPath, "Locales JSON");
      const data = await readJson<{ locales: LocaleEntry[] }>(opts.localesJsonPath);
      if (!Array.isArray(data?.locales)) {
        throw new Error(`Locales JSON must contain a "locales" array (found: ${opts.localesJsonPath})`);
      }
      return data.locales;
    }
    return opts.locales;
  }

  /**
   * Generate one AEP per locale by swapping text-layer content via ExtendScript.
   */
  async generatePack(opts: LocalizationPackOptions): Promise<LocalizationPackResult[]> {
    await assertFile(opts.aepPath, "Source AEP");
    await ensureDir(opts.outputDir);

    const locales = await this.resolveLocales(opts);
    if (locales.length === 0) {
      throw new Error("No locales provided for localization pack generation.");
    }

    this.log.info(`Generating localization pack for ${locales.length} locale(s) → ${opts.outputDir}`);

    const results: LocalizationPackResult[] = [];

    for (const entry of locales) {
      const suffix = entry.filenameSuffix ?? entry.locale;
      const baseName = path.basename(opts.aepPath, path.extname(opts.aepPath));
      const outputPath = path.join(opts.outputDir, `${baseName}_${suffix}.aep`);

      this.log.info(`  [${entry.locale}] Generating → ${path.basename(outputPath)}`);

      const textsJson = JSON.stringify(entry.texts);
      const fontsJson = JSON.stringify(entry.fontOverrides ?? {});

      const jsx = withReport(`
        var aepFile = new File(${JSON.stringify(opts.aepPath)});
        if (!aepFile.exists) throw new Error("Source AEP not found: " + ${JSON.stringify(opts.aepPath)});
        app.open(aepFile);

        var compName = ${JSON.stringify(opts.compName)};
        var texts = ${textsJson};
        var fonts = ${fontsJson};

        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
          var item = app.project.item(i);
          if (item instanceof CompItem && item.name === compName) {
            comp = item;
            break;
          }
        }
        if (!comp) throw new Error("Composition not found: " + compName);

        var updated = 0;
        for (var li = 1; li <= comp.numLayers; li++) {
          var layer = comp.layer(li);
          var lname = layer.name;

          // Text content replacement
          if (texts[lname] !== undefined) {
            var srcText = layer.property("ADBE Text Properties").property("ADBE Text Document");
            if (srcText) {
              var td = srcText.value;
              td.text = texts[lname];
              srcText.setValue(td);
              updated++;
            }
          }

          // Font override
          if (fonts[lname] !== undefined) {
            var srcText2 = layer.property("ADBE Text Properties").property("ADBE Text Document");
            if (srcText2) {
              var td2 = srcText2.value;
              td2.font = fonts[lname];
              srcText2.setValue(td2);
            }
          }
        }

        app.project.save(new File(${JSON.stringify(outputPath)}));
        __result.output = updated.toString();
      `);

      const result = await runJsx(jsx, this.log);
      if (!result.ok) {
        this.log.error(`  [${entry.locale}] ExtendScript failed: ${result.error}`);
        // Continue with remaining locales
        results.push({ locale: entry.locale, outputPath, layersUpdated: 0 });
        continue;
      }

      const layersUpdated = parseInt(result.output ?? "0", 10) || 0;
      this.log.info(`  [${entry.locale}] Done — ${layersUpdated} layer(s) updated.`);
      results.push({ locale: entry.locale, outputPath, layersUpdated });
    }

    return results;
  }
}
