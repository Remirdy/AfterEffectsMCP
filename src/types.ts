/** Shared domain types used across the analysis, motion-plan and JSX layers. */

export type LayerRole =
  | "background"
  | "title"
  | "subtitle"
  | "text"
  | "main_mockup"
  | "phone_mockup"
  | "ui_card"
  | "button"
  | "icon"
  | "logo"
  | "particle"
  | "character"
  | "decoration"
  | "locked_text"
  | "unknown";

export type LayerType = "text" | "image" | "group" | "shape" | "smartobject" | "adjustment" | "unknown";

export interface LayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextInfo {
  text: string;
  font?: string;
  fontSize?: number;
  color?: string;
}

export interface AnalyzedLayer {
  name: string;
  type: LayerType;
  role: LayerRole;
  bounds: LayerBounds;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..100
  zIndex: number; // 0 = bottom
  thumbnailPath?: string;
  text?: TextInfo;
  suggestedAnimation: string;
}

export interface AnalysisDocument {
  width: number;
  height: number;
  layerCount: number;
  previewPath?: string;
  sourcePsd: string;
}

export interface AnalysisReport {
  document: AnalysisDocument;
  layers: AnalyzedLayer[];
  visualSuggestions: string[];
  generatedAt: string;
}

export type AnimationType =
  | "slowParallax"
  | "slideFade"
  | "slideScale"
  | "staggerPop"
  | "softReveal"
  | "floatLoop"
  | "bounceIn"
  | "maskReveal"
  | "textRangeReveal"
  | "lightSweep"
  | "blurFade"
  | "overshootPop"
  | "rotateIn"
  | "depthDrift"
  | "scalePulse"
  | "ambientGlow"
  | "cameraPush";

export type Direction = "top" | "bottom" | "left" | "right";

export interface MotionAnimation {
  /** Layer name or wildcard pattern, e.g. "Card_" matches any layer starting with Card_. */
  target: string;
  type: AnimationType;
  from?: Direction;
  start: number; // seconds
  duration: number; // seconds
  ease?: string; // expoOut | backOut | quadInOut | linear ...
  stagger?: number; // seconds between siblings
  strength?: number; // px / amount, animation-specific
  /** Only honoured when not preserving text content. */
  effects?: string[];
}

export interface MotionPlan {
  composition: {
    width: number;
    height: number;
    duration: number;
    fps: number;
    name: string;
  };
  rules: {
    preserveTextContent: boolean;
    protectLockedLayers: boolean;
    avoidExcessiveEffects: boolean;
  };
  animations: MotionAnimation[];
  style: string;
  promptProfile?: {
    tempo: "slow" | "balanced" | "fast";
    density: "minimal" | "balanced" | "rich";
    direction: string[];
    professionalTouches: string[];
  };
  generatedAt: string;
}
