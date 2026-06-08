import fs from 'node:fs/promises';
import path from 'node:path';
import { OpLog, assertFile, ensureDir } from '../util.js';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface DataToMotionOptions {
  dataPath: string;       // CSV or JSON file
  outputDir: string;
  chartType?: 'bar' | 'line' | 'counter' | 'pie'; // default 'bar'
  title?: string;
  colorPalette?: string[];
  addVoiceover?: boolean; // default false
  compName?: string;      // default 'DATA_MOTION'
  durationSec?: number;   // default 8
}

export interface DataPoint {
  label: string;
  value: number;
}

export interface DataToMotionResult {
  ok: boolean;
  dataPoints: DataPoint[];
  jsxPath: string;
  compName: string;
  animationType: string;
  message: string;
}

// ─── DataToMotion class ───────────────────────────────────────────────────────

export class DataToMotion {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async generate(opts: DataToMotionOptions): Promise<DataToMotionResult> {
    const {
      dataPath,
      outputDir,
      chartType = 'bar',
      title = 'Data Visualization',
      colorPalette = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
      compName = 'DATA_MOTION',
      durationSec = 8,
    } = opts;

    try {
      await assertFile(dataPath, 'dataPath');
      await ensureDir(outputDir);

      // ── Parse data ──────────────────────────────────────────────────────────
      const dataPoints = await this.parseData(dataPath);
      if (dataPoints.length === 0) {
        return {
          ok: false,
          dataPoints: [],
          jsxPath: '',
          compName,
          animationType: chartType,
          message: 'No data points could be parsed from the file',
        };
      }
      this.log.info(`Parsed ${dataPoints.length} data point(s) from ${dataPath}`);

      // ── Normalize values to 0–100 range ────────────────────────────────────
      const normalized = this.normalizeValues(dataPoints);

      // ── Generate JSX ────────────────────────────────────────────────────────
      const timestamp = Date.now();
      const jsxFileName = `data_motion_${timestamp}.jsx`;
      const jsxPath = path.join(outputDir, jsxFileName);

      const jsxContent = this.buildJsx({
        dataPoints,
        normalized,
        chartType,
        title,
        colorPalette,
        compName,
        durationSec,
      });

      await fs.writeFile(jsxPath, jsxContent, 'utf8');
      this.log.info(`JSX written to: ${jsxPath}`);

      return {
        ok: true,
        dataPoints,
        jsxPath,
        compName,
        animationType: chartType,
        message: `JSX generated successfully for ${chartType} chart with ${dataPoints.length} data point(s)`,
      };
    } catch (err) {
      const msg = (err as Error).message;
      this.log.error(`DataToMotion.generate failed: ${msg}`);
      return {
        ok: false,
        dataPoints: [],
        jsxPath: '',
        compName,
        animationType: chartType,
        message: msg,
      };
    }
  }

  // ─── Parse CSV or JSON ─────────────────────────────────────────────────────

  private async parseData(dataPath: string): Promise<DataPoint[]> {
    const ext = path.extname(dataPath).toLowerCase();
    const raw = await fs.readFile(dataPath, 'utf8');

    if (ext === '.json') {
      return this.parseJson(raw);
    } else if (ext === '.csv') {
      return this.parseCsv(raw);
    } else {
      // Attempt JSON first, then CSV
      try {
        return this.parseJson(raw);
      } catch {
        return this.parseCsv(raw);
      }
    }
  }

  private parseJson(raw: string): DataPoint[] {
    const data = JSON.parse(raw);
    const arr: unknown[] = Array.isArray(data) ? data : [data];
    const points: DataPoint[] = [];

    for (const item of arr) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;

      // Support common key patterns
      const label =
        String(obj['label'] ?? obj['name'] ?? obj['category'] ?? obj['key'] ?? 'Unknown');
      const rawVal =
        obj['value'] ?? obj['val'] ?? obj['amount'] ?? obj['count'] ?? obj['y'] ?? 0;
      const value = parseFloat(String(rawVal));

      if (!isNaN(value)) {
        points.push({ label, value });
      }
    }
    return points;
  }

  private parseCsv(raw: string): DataPoint[] {
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const labelIdx = headers.findIndex((h) =>
      ['label', 'name', 'category', 'key'].includes(h)
    );
    const valueIdx = headers.findIndex((h) =>
      ['value', 'val', 'amount', 'count', 'y'].includes(h)
    );

    // If no header match, assume col 0 = label, col 1 = value
    const lIdx = labelIdx >= 0 ? labelIdx : 0;
    const vIdx = valueIdx >= 0 ? valueIdx : 1;

    const points: DataPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const label = cols[lIdx] ?? `Item ${i}`;
      const value = parseFloat(cols[vIdx] ?? '0');
      if (!isNaN(value)) {
        points.push({ label, value });
      }
    }
    return points;
  }

  // ─── Normalize to 0–100 ────────────────────────────────────────────────────

  private normalizeValues(points: DataPoint[]): number[] {
    const max = Math.max(...points.map((p) => p.value));
    const min = Math.min(...points.map((p) => p.value));
    const range = max - min || 1;
    return points.map((p) => Math.round(((p.value - min) / range) * 100));
  }

  // ─── JSX Generator ─────────────────────────────────────────────────────────

  private buildJsx(params: {
    dataPoints: DataPoint[];
    normalized: number[];
    chartType: string;
    title: string;
    colorPalette: string[];
    compName: string;
    durationSec: number;
  }): string {
    const { dataPoints, normalized, chartType, title, colorPalette, compName, durationSec } =
      params;

    const pointsJson = JSON.stringify(dataPoints);
    const normalizedJson = JSON.stringify(normalized);
    const paletteJson = JSON.stringify(colorPalette);

    let chartBody = '';
    switch (chartType) {
      case 'bar':
        chartBody = this.jsxBarChart(dataPoints, normalized, colorPalette, durationSec);
        break;
      case 'counter':
        chartBody = this.jsxCounter(dataPoints, colorPalette, durationSec);
        break;
      case 'line':
        chartBody = this.jsxLineChart(dataPoints, normalized, colorPalette, durationSec);
        break;
      case 'pie':
        chartBody = this.jsxPieChart(dataPoints, normalized, colorPalette, durationSec);
        break;
      default:
        chartBody = this.jsxBarChart(dataPoints, normalized, colorPalette, durationSec);
    }

    return `// MotionPilot DataToMotion — Generated JSX
// Chart type: ${chartType}
// Data points: ${dataPoints.length}
// Generated: ${new Date().toISOString()}
//
// HOW TO USE:
//   1. Open Adobe After Effects
//   2. File > Scripts > Run Script File... → select this .jsx
//   3. The comp '${compName}' will be created in your project

(function() {
  var app = app;
  app.beginUndoGroup("MotionPilot DataToMotion");

  // ── Comp setup ─────────────────────────────────────────────────────────
  var compWidth   = 1920;
  var compHeight  = 1080;
  var frameRate   = 30;
  var duration    = ${durationSec};
  var compName    = ${JSON.stringify(compName)};
  var title       = ${JSON.stringify(title)};
  var dataPoints  = ${pointsJson};
  var normalized  = ${normalizedJson};
  var palette     = ${paletteJson};

  var comp = app.project.items.addComp(compName, compWidth, compHeight, 1, duration, frameRate);
  comp.openInViewer();

  // ── Background solid ───────────────────────────────────────────────────
  var bgColor = [0.08, 0.08, 0.12]; // dark navy
  var bgLayer = comp.layers.addSolid(bgColor, "Background", compWidth, compHeight, 1);
  bgLayer.moveToEnd();

  // ── Title text ─────────────────────────────────────────────────────────
  var titleLayer = comp.layers.addText(title);
  var titleDoc = titleLayer.sourceText.value;
  titleDoc.resetCharStyle();
  titleDoc.fontSize = 72;
  titleDoc.fillColor  = [1, 1, 1];
  titleDoc.font = "Arial-BoldMT";
  titleDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
  titleLayer.sourceText.setValue(titleDoc);
  titleLayer.position.setValue([compWidth / 2, 100]);
  titleLayer.name = "TITLE";

${chartBody}

  app.endUndoGroup();
  alert("MotionPilot: Comp '" + compName + "' created with ${dataPoints.length} data point(s)!");
})();
`;
  }

  // ─── Bar chart JSX body ────────────────────────────────────────────────────

  private jsxBarChart(
    dataPoints: DataPoint[],
    normalized: number[],
    palette: string[],
    durationSec: number
  ): string {
    return `
  // ── Bar chart ───────────────────────────────────────────────────────────
  var barMaxHeight = 500;
  var barWidth     = Math.min(120, Math.floor((compWidth - 200) / dataPoints.length) - 20);
  var barY         = 850; // bottom anchor
  var stagger      = 0.15; // seconds between bars

  for (var i = 0; i < dataPoints.length; i++) {
    var pct      = normalized[i] / 100;
    var barH     = Math.max(10, Math.round(pct * barMaxHeight));
    var barX     = 150 + i * (barWidth + 20) + barWidth / 2;
    var hexColor = palette[i % palette.length];

    // Parse hex to AE [0-1] color
    var r = parseInt(hexColor.substring(1, 3), 16) / 255;
    var g = parseInt(hexColor.substring(3, 5), 16) / 255;
    var b = parseInt(hexColor.substring(5, 7), 16) / 255;

    var barLayer = comp.layers.addSolid([r, g, b], "Bar_" + dataPoints[i].label, barWidth, barMaxHeight, 1);
    barLayer.anchorPoint.setValue([barWidth / 2, barMaxHeight]);
    barLayer.position.setValue([barX, barY]);

    // Animate scaleY from 0 → final pct over 2s, staggered
    var inTime  = i * stagger;
    var outTime = inTime + 2.0;
    barLayer.transform.scale.setValueAtTime(inTime,  [100, 0]);
    barLayer.transform.scale.setValueAtTime(outTime, [100, pct * 100]);

    // Label text below bar
    var labelLayer = comp.layers.addText(dataPoints[i].label);
    var labelDoc = labelLayer.sourceText.value;
    labelDoc.fontSize = 28;
    labelDoc.fillColor = [1, 1, 1];
    labelDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    labelLayer.sourceText.setValue(labelDoc);
    labelLayer.position.setValue([barX, barY + 30]);
    labelLayer.name = "Label_" + dataPoints[i].label;

    // Value text on top of bar (fades in with bar)
    var valLayer = comp.layers.addText(String(dataPoints[i].value));
    var valDoc = valLayer.sourceText.value;
    valDoc.fontSize = 24;
    valDoc.fillColor = [1, 1, 1];
    valDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    valLayer.sourceText.setValue(valDoc);
    valLayer.position.setValue([barX, barY - barH - 15]);
    valLayer.opacity.setValueAtTime(inTime, 0);
    valLayer.opacity.setValueAtTime(outTime, 100);
    valLayer.name = "Value_" + dataPoints[i].label;
  }
`;
  }

  // ─── Counter chart JSX body ────────────────────────────────────────────────

  private jsxCounter(
    dataPoints: DataPoint[],
    palette: string[],
    durationSec: number
  ): string {
    return `
  // ── Counter animation ───────────────────────────────────────────────────
  var cols = Math.min(dataPoints.length, 4);
  var cellW = Math.floor(compWidth / cols);

  for (var i = 0; i < dataPoints.length; i++) {
    var row  = Math.floor(i / cols);
    var col  = i % cols;
    var cx   = col * cellW + cellW / 2;
    var cy   = 400 + row * 250;
    var hex  = palette[i % palette.length];
    var r    = parseInt(hex.substring(1, 3), 16) / 255;
    var g    = parseInt(hex.substring(3, 5), 16) / 255;
    var b    = parseInt(hex.substring(5, 7), 16) / 255;
    var tgt  = dataPoints[i].value;

    // Counter text with expression
    var cLayer = comp.layers.addText("0");
    var cDoc   = cLayer.sourceText.value;
    cDoc.fontSize   = 120;
    cDoc.fillColor  = [r, g, b];
    cDoc.font       = "Arial-BoldMT";
    cDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    cLayer.sourceText.setValue(cDoc);
    cLayer.position.setValue([cx, cy]);
    cLayer.name = "Counter_" + dataPoints[i].label;

    // Expression: count from 0 → value over durationSec
    var expr = "var tgt = " + tgt + "; var d = " + durationSec + "; Math.round(linear(time, 0, d, 0, tgt));";
    cLayer.sourceText.expression = expr;

    // Label below
    var lLayer = comp.layers.addText(dataPoints[i].label);
    var lDoc   = lLayer.sourceText.value;
    lDoc.fontSize  = 36;
    lDoc.fillColor = [0.8, 0.8, 0.8];
    lDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    lLayer.sourceText.setValue(lDoc);
    lLayer.position.setValue([cx, cy + 80]);
    lLayer.name = "CtrLabel_" + dataPoints[i].label;
  }
`;
  }

  // ─── Line chart JSX body ───────────────────────────────────────────────────

  private jsxLineChart(
    dataPoints: DataPoint[],
    normalized: number[],
    palette: string[],
    durationSec: number
  ): string {
    const pointsStr = dataPoints
      .map((_, i) => `{x:${150 + i * Math.round(1620 / Math.max(dataPoints.length - 1, 1))},y:${850 - Math.round((normalized[i] / 100) * 500)}}`)
      .join(',');

    return `
  // ── Line chart ──────────────────────────────────────────────────────────
  var linePoints = [${pointsStr}];
  var hex0  = palette[0] || "#4ECDC4";
  var lr    = parseInt(hex0.substring(1,3),16)/255;
  var lg    = parseInt(hex0.substring(3,5),16)/255;
  var lb    = parseInt(hex0.substring(5,7),16)/255;

  var shapeLayer = comp.layers.addShape();
  shapeLayer.name = "LINE_CHART";
  var contents = shapeLayer.property("Contents");
  var grp      = contents.addProperty("ADBE Vector Group");
  grp.name     = "LineGroup";

  var stroke = grp.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
  stroke.property("Color").setValue([lr, lg, lb]);
  stroke.property("Stroke Width").setValue(6);

  var shape = grp.property("Contents").addProperty("ADBE Vector Shape - Group");
  var pathProp = shape.property("Path");

  // Build path vertices
  var verts = [];
  for (var i = 0; i < linePoints.length; i++) {
    verts.push([linePoints[i].x - compWidth/2, linePoints[i].y - compHeight/2]);
  }
  var newPath = new Shape();
  newPath.vertices  = verts;
  newPath.closed    = false;
  pathProp.setValue(newPath);

  // Trim path reveal animation
  var trimPaths = grp.property("Contents").addProperty("ADBE Vector Filter - Trim");
  trimPaths.property("End").setValueAtTime(0, 0);
  trimPaths.property("End").setValueAtTime(Math.min(durationSec * 0.7, 3.0), 100);

  // Data point markers + labels
  for (var j = 0; j < linePoints.length; j++) {
    var ptHex = palette[j % palette.length];
    var pr = parseInt(ptHex.substring(1,3),16)/255;
    var pg = parseInt(ptHex.substring(3,5),16)/255;
    var pb = parseInt(ptHex.substring(5,7),16)/255;

    var dotLayer = comp.layers.addSolid([pr,pg,pb],"Dot_"+dataPoints[j].label,20,20,1);
    dotLayer.position.setValue([linePoints[j].x, linePoints[j].y]);
    dotLayer.opacity.setValueAtTime(j * 0.1, 0);
    dotLayer.opacity.setValueAtTime(j * 0.1 + 0.2, 100);

    var ptLabel = comp.layers.addText(dataPoints[j].label + "\\n" + dataPoints[j].value);
    var ptDoc   = ptLabel.sourceText.value;
    ptDoc.fontSize = 24;
    ptDoc.fillColor = [1,1,1];
    ptDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    ptLabel.sourceText.setValue(ptDoc);
    ptLabel.position.setValue([linePoints[j].x, linePoints[j].y - 40]);
    ptLabel.name = "PtLabel_" + dataPoints[j].label;
  }
`;
  }

  // ─── Pie chart JSX body ────────────────────────────────────────────────────

  private jsxPieChart(
    dataPoints: DataPoint[],
    normalized: number[],
    palette: string[],
    durationSec: number
  ): string {
    return `
  // ── Pie chart (solid layers with rotation masks) ─────────────────────────
  var total = 0;
  for (var i = 0; i < dataPoints.length; i++) total += dataPoints[i].value;

  var cx = compWidth / 2;
  var cy = 580;
  var radius = 280;
  var currentAngle = -90; // start from top

  for (var i = 0; i < dataPoints.length; i++) {
    var slice  = (dataPoints[i].value / total) * 360;
    var hex    = palette[i % palette.length];
    var r      = parseInt(hex.substring(1,3),16)/255;
    var g      = parseInt(hex.substring(3,5),16)/255;
    var b      = parseInt(hex.substring(5,7),16)/255;

    // Solid sized to full comp, masked to pie slice
    var sliceLayer = comp.layers.addSolid([r,g,b], "Slice_"+dataPoints[i].label, compWidth, compHeight, 1);
    sliceLayer.name = "Slice_" + dataPoints[i].label;

    // Position at center
    sliceLayer.position.setValue([cx, cy]);
    sliceLayer.anchorPoint.setValue([compWidth/2, compHeight/2]);

    // Animate rotation to reveal slice
    var startDeg = currentAngle;
    var endDeg   = currentAngle + slice;
    sliceLayer.transform.rotation.setValueAtTime(0, startDeg);
    sliceLayer.transform.rotation.setValueAtTime(Math.min(durationSec * 0.6, 2.5), endDeg);

    // Legend label (right side)
    var legX = cx + radius + 60;
    var legY = 350 + i * 50;
    var legLayer  = comp.layers.addSolid([r,g,b],"LegDot_"+i,20,20,1);
    legLayer.position.setValue([legX, legY]);

    var legText = comp.layers.addText(dataPoints[i].label + " (" + Math.round((dataPoints[i].value/total)*100) + "%)");
    var legDoc  = legText.sourceText.value;
    legDoc.fontSize  = 28;
    legDoc.fillColor = [1,1,1];
    legText.sourceText.setValue(legDoc);
    legText.position.setValue([legX + 80, legY]);
    legText.name = "Legend_" + dataPoints[i].label;

    currentAngle += slice;
  }
`;
  }
}
