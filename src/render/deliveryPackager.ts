import { runJsx } from "../ae/runner.js";
import { OpLog, assertFile, guardOverwrite, ensureDir, writeJson } from "../util.js";
import { withReport } from "../ae/jsxGenerator.js";
import path from "node:path";
import fs from "node:fs/promises";

export interface DeliveryPackageOptions {
  outputFolder: string;
  videoPath: string;
  thumbnailPath?: string;
  title: string;
  description: string;
  platforms: Array<"youtube" | "tiktok" | "meta" | string>;
}

export interface LocalizationTranslation {
  originalText: string;
  translatedText: string;
}

export interface LocalizationOptions {
  aepPath: string;
  outputAepPath: string;
  compName: string;
  languageCode: string;
  translations: LocalizationTranslation[];
  audioPath?: string;
}

export class DeliveryPackager {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Bundles final renders, descriptions, and thumbnails into platform-specific delivery subfolders.
   */
  async packageDelivery(opts: DeliveryPackageOptions): Promise<{ ok: boolean; packagedPaths: string[] }> {
    this.log.info(`Packaging deliverables for: ${opts.title}`);
    await assertFile(opts.videoPath, "Final Video MP4");
    await ensureDir(opts.outputFolder);

    const packagedPaths: string[] = [];

    for (const platform of opts.platforms) {
      const platFolder = path.join(opts.outputFolder, platform.toLowerCase());
      await ensureDir(platFolder);

      const targetVideo = path.join(platFolder, path.basename(opts.videoPath));
      await fs.copyFile(opts.videoPath, targetVideo);
      packagedPaths.push(targetVideo);

      if (opts.thumbnailPath && await fs.stat(opts.thumbnailPath).catch(() => null)) {
        const targetThumb = path.join(platFolder, `thumbnail_${path.basename(opts.thumbnailPath)}`);
        await fs.copyFile(opts.thumbnailPath, targetThumb);
        packagedPaths.push(targetThumb);
      }

      // Write meta details
      const metaPath = path.join(platFolder, "metadata.json");
      await writeJson(metaPath, {
        platform,
        title: opts.title,
        description: opts.description,
        packagedAt: Date.now(),
      });
      packagedPaths.push(metaPath);
    }

    return { ok: true, packagedPaths };
  }

  /**
   * Translates text layers and swaps localized audio tracks in After Effects.
   */
  async localizeAd(opts: LocalizationOptions, approveOverwrite = false): Promise<{ ok: boolean; outputAepPath: string }> {
    this.log.info(`Translating ad comp "${opts.compName}" to language: ${opts.languageCode}`);
    await assertFile(opts.aepPath, "Source AEP");
    await guardOverwrite(opts.outputAepPath, approveOverwrite);

    const locJsx = withReport(`
      var aepFile = new File(${JSON.stringify(opts.aepPath)});
      if (!aepFile.exists) {
        throw new Error("Source AEP not found");
      }
      app.open(aepFile);
      
      var compName = ${JSON.stringify(opts.compName)};
      var langCode = ${JSON.stringify(opts.languageCode)};
      var translations = ${JSON.stringify(opts.translations)};
      var localizedAudio = ${JSON.stringify(opts.audioPath ?? "")};
      
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem && item.name === compName) {
          comp = item;
          break;
        }
      }
      
      if (!comp) {
        throw new Error("Composition not found: " + compName);
      }
      
      // Duplicate comp for localized version
      var locComp = comp.duplicate();
      locComp.name = comp.name + "_" + langCode.toUpperCase();
      
      // 1. Translate text layers matching target translation strings
      for (var l = 1; l <= locComp.numLayers; l++) {
        var layer = locComp.layer(l);
        if (layer instanceof TextLayer) {
          var docVal = layer.property("ADBE Text Properties").property("ADBE Text Document").value;
          var curText = docVal.text;
          
          for (var t = 0; t < translations.length; t++) {
            if (curText.toLowerCase().indexOf(translations[t].originalText.toLowerCase()) >= 0) {
              docVal.text = translations[t].translatedText;
              layer.property("ADBE Text Properties").property("ADBE Text Document").setValue(docVal);
              MP.log("Translated layer " + layer.name + " text to: " + translations[t].translatedText);
              break;
            }
          }
        }
      }
      
      // 2. Swap audio file if localized voiceover is supplied
      if (localizedAudio) {
        var newAudioFile = new File(localizedAudio);
        if (newAudioFile.exists) {
          var audioItem = app.project.importFile(new ImportOptions(newAudioFile));
          
          // Remove old audio layers
          for (var l = locComp.numLayers; l >= 1; l--) {
            var layer = locComp.layer(l);
            var isAudio = layer.hasAudio && !layer.hasVideo;
            if (isAudio) {
              layer.remove();
              MP.log("Removed old audio layer");
            }
          }
          
          // Add new localized audio layer
          locComp.layers.add(audioItem);
          MP.log("Imported localized audio: " + localizedAudio);
        }
      }
      
      app.project.save(new File(${JSON.stringify(opts.outputAepPath)}));
      __result.output = ${JSON.stringify(opts.outputAepPath)};
    `);

    const result = await runJsx(locJsx, this.log);
    if (!result.ok) {
      throw new Error(`Failed to localize ad composition: ${result.error}`);
    }

    return { ok: true, outputAepPath: result.output || opts.outputAepPath };
  }
}
