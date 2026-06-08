import { runJsx } from "../motionpilot-ae-mcp/dist/ae/runner.js";
import { JSX_HELPERS } from "../motionpilot-ae-mcp/dist/ae/jsxHelpers.js";
import { OpLog } from "../motionpilot-ae-mcp/dist/util.js";

async function main() {
  const log = new OpLog();
  const aepPath = "/Users/emirhan/Desktop/After_Effects_MCP/dragon_scene_animated.aep";

  const inspectJsx = `
    ${JSX_HELPERS}
    (function() {
      var file = new File(${JSON.stringify(aepPath)});
      if (!file.exists) {
        throw new Error("AEP file not found");
      }
      app.open(file);
      
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof CompItem) {
          if (!comp || item.numLayers > comp.numLayers) {
            comp = item;
          }
        }
      }
      
      if (!comp) {
        throw new Error("Composition not found");
      }
      
      var time = 3.5;
      var info = [];
      for (var j = 1; j <= comp.numLayers; j++) {
        var ly = comp.layer(j);
        var tg = ly.property("ADBE Transform Group");
        var pos = tg.property("ADBE Position").valueAtTime(time, true);
        var scale = tg.property("ADBE Scale").valueAtTime(time, true);
        
        // Calculate absolute position
        var worldPos = pos;
        var p = ly.parent;
        while (p) {
          var pPos = p.property("ADBE Transform Group").property("ADBE Position").valueAtTime(time, true);
          var pAnchor = p.property("ADBE Transform Group").property("ADBE Anchor Point").valueAtTime(time, true);
          worldPos[0] += (pPos[0] - pAnchor[0]);
          worldPos[1] += (pPos[1] - pAnchor[1]);
          worldPos[2] += (pPos[2] - pAnchor[2]);
          p = p.parent;
        }
        
        info.push({
          name: ly.name,
          localPosAt3_5: pos,
          worldPosAt3_5: worldPos,
          scaleAt3_5: scale
        });
      }
      
      var resultFile = new File("__MP_RESULT_FILE__");
      resultFile.open("w");
      resultFile.write("MP_RESULT_BEGIN true | " + MP.toJson(info) + " | null\\nMP_LOG_BEGIN\\nInspect Complete\\nMP_RESULT_END");
      resultFile.close();
    })();
  `;

  try {
    const result = await runJsx(inspectJsx, log);
    console.log("=== LAYER POSITIONS AT 3.5s ===");
    if (result.ok) {
      console.log(JSON.stringify(JSON.parse(result.output), null, 2));
    } else {
      console.error("Failed to run JSX:", result.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
