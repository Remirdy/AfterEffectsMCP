import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  vfxChromaKeyStudioSchema,
  vfxSoundKeysSchema,
  vfxSapphirePackSchema,
  gradeFilmEmulationSchema,
} from "../src/schemas.js";
import { generatePremiumPluginReplicaJsx } from "../src/ae/thirtyReplicasGenerator.js";

function parse(schema: Record<string, z.ZodTypeAny>, data: unknown) {
  return z.object(schema).parse(data);
}

describe("premium plugin gap-fill replicas", () => {
  it("validates P0 keying, retime/audio, Sapphire, and film schemas", () => {
    expect(parse(vfxChromaKeyStudioSchema, {
      outputAepPath: "/tmp/key.aep",
      screenColor: "green",
    }).spillSuppression).toBe(65);

    expect(parse(vfxSoundKeysSchema, {
      outputAepPath: "/tmp/sound.aep",
      driveProperty: "glow",
    }).sensitivity).toBe(1.5);

    expect(parse(vfxSapphirePackSchema, {
      outputAepPath: "/tmp/sapphire.aep",
      effect: "film_effect",
    }).effect).toBe("film_effect");

    expect(parse(gradeFilmEmulationSchema, {
      outputAepPath: "/tmp/film.aep",
      stock: "fuji_eterna",
    }).grain).toBe(22);
  });

  it("generates native AE chains for the keying studio replica", () => {
    const jsx = generatePremiumPluginReplicaJsx({
      kind: "vfx_chroma_key_studio",
      outputAepPath: "/tmp/key.aep",
      screenColor: "green",
    });

    expect(jsx).toContain("Keylight 1.2");
    expect(jsx).toContain("Advanced Spill Suppressor");
    expect(jsx).toContain("Matte Choker");
    expect(jsx).toContain("Light_Wrap_Edge_Blend");
  });

  it("generates native AE chains for audio-driven and grading replicas", () => {
    const soundKeys = generatePremiumPluginReplicaJsx({
      kind: "vfx_sound_keys",
      outputAepPath: "/tmp/sound.aep",
      driveProperty: "scale",
    });
    const film = generatePremiumPluginReplicaJsx({
      kind: "grade_film_emulation",
      outputAepPath: "/tmp/film.aep",
      stock: "kodak_2383",
    });

    expect(soundKeys).toContain("Sound_Keys_Controller");
    expect(soundKeys).toContain("Audio Amplitude Driver");
    expect(film).toContain("Film_Grain_Halation");
    expect(film).toContain("Primary_Grade_");
  });
});
