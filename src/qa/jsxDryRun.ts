import vm from "node:vm";
import { OpLog } from "../util.js";

export interface DryRunIssue {
  severity: "error" | "warning";
  message: string;
  line?: number;
}

export interface DryRunResult {
  valid: boolean;
  issues: DryRunIssue[];
}

export class JsxDryRun {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  /**
   * Compiles the JSX string using Node's VM module to check syntax correctness,
   * and runs regex-based checks for common ExtendScript bugs.
   */
  validate(jsxContent: string): DryRunResult {
    this.log.info("Starting dry-run validation on generated JSX content...");
    const issues: DryRunIssue[] = [];

    // 1. Syntax Compilation Check via Node vm
    try {
      // Wrap it so Adobe globals don't cause compilation issues if evaluated.
      // (Script compilation doesn't run the code, but just to be safe)
      new vm.Script(jsxContent);
    } catch (e) {
      const err = e as Error;
      let lineNum: number | undefined;

      // Extract line number if present in error stack/message
      const match = err.stack?.match(/evalmachine\.<anonymous>:(\d+)/);
      if (match) {
        lineNum = parseInt(match[1], 10);
      }

      issues.push({
        severity: "error",
        message: `JavaScript Syntax Error: ${err.message}`,
        line: lineNum,
      });
    }

    // 2. ExtendScript Specific Semantic Check (Static Analysis via Regex)
    const lines = jsxContent.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Pitfall A: app.project.item(...) instead of app.project.items.add...
      // Common typo: app.project.item(1) works for fetching, but app.project.item.add is undefined (needs items).
      if (/\bapp\.project\.item\b(?!\.item|s)/.test(line) && !/\.(layer|comp|file|save|close)\b/i.test(line)) {
        if (!/\.item\(/i.test(line)) {
          issues.push({
            severity: "warning",
            message: "Possible typo: 'app.project.item' referenced. Did you mean 'app.project.items'?",
            line: lineNum,
          });
        }
      }

      // Pitfall B: Using double backslashes in paths incorrectly
      if (/File\(['"][a-zA-Z]:\\[^\\]/i.test(line)) {
        issues.push({
          severity: "warning",
          message: "Potential file path escape issue: Single backslash detected in file path constructor.",
          line: lineNum,
        });
      }

      // Pitfall C: Missing try-catch on activeItem check
      if (/\bapp\.project\.activeItem\b/i.test(line) && !/try/i.test(lines[Math.max(0, i - 1)])) {
        issues.push({
          severity: "warning",
          message: "Referencing 'app.project.activeItem' without a preceding try-catch block. activeItem can be null and throw if no comps are active.",
          line: lineNum,
        });
      }
      
      // Pitfall D: Missing checks for zero-indexed properties in ExtendScript (ExtendScript collections are 1-indexed!)
      if (/\.layer\(0\)/.test(line) || /\.item\(0\)/.test(line)) {
        issues.push({
          severity: "error",
          message: "ExtendScript collections (comp.layer, project.item) are 1-indexed. Index 0 is invalid.",
          line: lineNum,
        });
      }
    }

    const valid = !issues.some(issue => issue.severity === "error");
    this.log.info(`Dry-run validation complete. Valid: ${valid}. Found ${issues.length} issue(s).`);
    return { valid, issues };
  }
}
