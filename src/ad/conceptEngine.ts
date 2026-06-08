import { BrandKitManager } from "../brand/brandKit.js";
import { OpLog } from "../util.js";

export interface AdStoryboardBeat {
  timestamp: number;
  description: string;
  onScreenText?: string;
  soundDesignCue?: string;
  visualVfxCue?: string;
}

export interface AdConcept {
  conceptId: string;
  title: string;
  hook: string;
  tagline: string;
  marketingAngle: string;
  musicTempo: "slow" | "medium" | "fast" | "dynamic";
  visualStyle: string;
  storyboard: AdStoryboardBeat[];
}

export class AdConceptGenerator {
  private log: OpLog;

  constructor(log: OpLog) {
    this.log = log;
  }

  async generateConcepts(
    productName: string,
    productDescription: string,
    duration = 15,
    workspaceDir: string
  ): Promise<AdConcept[]> {
    this.log.info(`Generating ad concepts for product: ${productName} (duration ${duration}s)`);
    
    // Check if brand kit is persistent, load it if so
    const bkm = new BrandKitManager(workspaceDir);
    const brandKit = await bkm.loadBrandKit();
    const brandName = brandKit?.brandName ?? productName;

    const concepts: AdConcept[] = [
      {
        conceptId: "concept_cinematic_hype",
        title: "Cinematic Product Reveal",
        hook: `Introducing ${brandName}: The ultimate game changer.`,
        tagline: `${brandName} — Experience Perfection.`,
        marketingAngle: "Premium, emotional connection, and high-impact cinematic reveals.",
        musicTempo: "dynamic",
        visualStyle: brandKit?.marketingVoice === "minimal" ? "minimal" : "cinematic",
        storyboard: [
          { timestamp: 0, description: "Dramatic dark gradient background. Slow camera dolly in.", onScreenText: `This is ${brandName}.`, soundDesignCue: "Deep sub bass drop." },
          { timestamp: 3, description: "AI video plate reveals product details with glowing light sweep.", onScreenText: "Crafted for Excellence.", soundDesignCue: "Soft rise effect." },
          { timestamp: 7, description: "Energetic transition into HUD callout highlights.", onScreenText: "Cutting Edge Features.", soundDesignCue: "Electronic swoosh." },
          { timestamp: 11, description: "Concentric magic circle/energy circles rise from center.", onScreenText: "Available Now.", soundDesignCue: "Cinematic drum impact." },
        ],
      },
      {
        conceptId: "concept_social_retention",
        title: "Social Hook Reel",
        hook: "You won't believe what this product can do.",
        tagline: `Try ${brandName} today.`,
        marketingAngle: "Fast-paced, hook-driven, high retention and clear call-to-action.",
        musicTempo: "fast",
        visualStyle: "energetic",
        storyboard: [
          { timestamp: 0, description: "Sticker popping scale animation. Extreme zoom shake.", onScreenText: "Wait, look at this!", soundDesignCue: "Pop sound effect." },
          { timestamp: 3, description: "Rapid cut to product detail showing glowing energy circles.", onScreenText: "Sound Reimagined.", soundDesignCue: "Vinyl scratch." },
          { timestamp: 6, description: "Kinetic typography overlay showing feature points.", onScreenText: "100% Wireless.", soundDesignCue: "Fast beat build." },
          { timestamp: 10, description: "Vibrant CTA button reveals with spring bounce animation.", onScreenText: "Shop Link Below.", soundDesignCue: "Chime sound." },
        ],
      }
    ];

    this.log.info(`Generated ${concepts.length} ad concepts successfully.`);
    return concepts;
  }
}
