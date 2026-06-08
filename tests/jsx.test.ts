import { describe, it, expect } from "vitest";
import { JsxDryRun } from "../src/qa/jsxDryRun.js";
import { OpLog } from "../src/util.js";

describe("JsxDryRun Validation", () => {
  const log = new OpLog();
  const validator = new JsxDryRun(log);

  it("should validate a syntactically correct ExtendScript snippet", () => {
    const code = `
      var comp = app.project.items.addComp("Test", 1080, 1920, 1, 10, 30);
      var layer = comp.layers.addSolid([1, 1, 1], "Background", 1080, 1920, 1);
    `;
    const result = validator.validate(code);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  it("should catch standard JavaScript syntax errors", () => {
    const badCode = `
      var a = {
        name: "Test"
        // missing comma here or unclosed curly brace
    `;
    const result = validator.validate(badCode);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Syntax Error"))).toBe(true);
  });

  it("should flag zero-indexed collection warnings (ExtendScript is 1-indexed)", () => {
    const zeroIndexedCode = `
      var comp = app.project.item(0);
      var layer = comp.layer(0);
    `;
    const result = validator.validate(zeroIndexedCode);
    expect(result.valid).toBe(false);
    expect(result.issues.filter((i) => i.severity === "error").length).toBe(2);
    expect(result.issues[0].message).toContain("1-indexed");
  });

  it("should warn about activeItem outside try-catch", () => {
    const code = `
      var item = app.project.activeItem;
    `;
    const result = validator.validate(code);
    expect(result.issues.some((i) => i.message.includes("activeItem"))).toBe(true);
  });

  it("should warn about possible app.project.item typo", () => {
    const code = `
      var comp = app.project.item;
    `;
    const result = validator.validate(code);
    expect(result.issues.some((i) => i.message.includes("items"))).toBe(true);
  });
});
