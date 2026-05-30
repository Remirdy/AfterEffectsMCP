import { AnimationType, Direction, LayerRole, LayerType } from "../types.js";

/**
 * Naming-convention prefixes the analyzer recognises. Order matters:
 * more specific prefixes are listed before generic ones.
 */
export const NAMING_PATTERNS: Array<{ prefix: RegExp; role: LayerRole }> = [
  { prefix: /^Title_/i, role: "title" },
  { prefix: /^Subtitle_/i, role: "subtitle" },
  { prefix: /^Text_Title/i, role: "title" },
  { prefix: /^Text_Subtitle/i, role: "subtitle" },
  { prefix: /^Text_/i, role: "text" },
  { prefix: /^Phone_/i, role: "phone_mockup" },
  { prefix: /^Mockup_/i, role: "main_mockup" },
  { prefix: /^Card_/i, role: "ui_card" },
  { prefix: /^Button_/i, role: "button" },
  { prefix: /^Icon_/i, role: "icon" },
  { prefix: /^Logo_/i, role: "logo" },
  { prefix: /^Particle_/i, role: "particle" },
  { prefix: /^Character_/i, role: "character" },
  { prefix: /^BG_/i, role: "background" },
];

export function isLocked(name: string): boolean {
  return /LOCKED/i.test(name);
}

/** Infer a layer role from its name and, as a fallback, its type. */
export function detectRole(name: string, type: LayerType): LayerRole {
  for (const { prefix, role } of NAMING_PATTERNS) {
    if (prefix.test(name)) {
      // A locked text-ish layer becomes locked_text so callers treat it carefully.
      if (isLocked(name) && (role === "title" || role === "subtitle" || role === "text")) {
        return "locked_text";
      }
      return role;
    }
  }
  // Heuristic fallbacks when no naming convention is present.
  const n = name.toLowerCase();
  if (type === "text") return isLocked(name) ? "locked_text" : "text";
  if (/\bbg\b|background|backdrop/.test(n)) return "background";
  if (/phone|device|iphone|mockup|screen/.test(n)) return "phone_mockup";
  if (/card|tile|panel/.test(n)) return "ui_card";
  if (/icon/.test(n)) return "icon";
  if (/logo|brand/.test(n)) return "logo";
  if (/button|btn|cta/.test(n)) return "button";
  if (/particle|spark|dust|bokeh/.test(n)) return "particle";
  if (/char|person|avatar|hero/.test(n)) return "character";
  if (/shape|deco|ornament|blob|line/.test(n)) return "decoration";
  return "unknown";
}

/** Default per-role animation suggestion, used both in analysis and motion planning. */
export function suggestedAnimationFor(role: LayerRole): {
  label: string;
  type: AnimationType;
  from?: Direction;
} {
  switch (role) {
    case "background":
      return { label: "slowParallax", type: "slowParallax" };
    case "title":
    case "locked_text":
      return { label: "slideFadeFromTop", type: "slideFade", from: "top" };
    case "subtitle":
      return { label: "slideFadeFromBottom", type: "slideFade", from: "bottom" };
    case "text":
      return { label: "fadeUp", type: "slideFade", from: "bottom" };
    case "main_mockup":
    case "phone_mockup":
      return { label: "slideScaleFromRight", type: "slideScale", from: "right" };
    case "ui_card":
      return { label: "staggerPop", type: "staggerPop" };
    case "button":
      return { label: "premiumBounce", type: "bounceIn" };
    case "icon":
      return { label: "floatLoop", type: "floatLoop" };
    case "logo":
      return { label: "softReveal", type: "softReveal" };
    case "particle":
    case "decoration":
      return { label: "gentleLoop", type: "floatLoop" };
    case "character":
      return { label: "softReveal", type: "softReveal" };
    default:
      return { label: "fade", type: "slideFade", from: "bottom" };
  }
}
