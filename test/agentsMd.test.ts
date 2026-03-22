import test from "node:test";
import assert from "node:assert";
import mockfs from "mock-fs";
import path from "path";
import {
  getAgentsWarning,
  directoryHasAgentsMd,
} from "../src/utils/agentsMd.js";

test("AGENTS.md Utility", async (t) => {
  t.afterEach(async () => {
    mockfs.restore();
  });

  await t.test("returns warning for new nested AGENTS.md", async () => {
    mockfs({
      "moduleA/AGENTS.md": "Rule 1: Do not use var.",
      "moduleA/src/index.js": "console.log('test');",
    });

    const targetFile = path.resolve(process.cwd(), "moduleA/src/index.js");

    // First read should return a warning
    const warning1 = await getAgentsWarning(targetFile);
    assert.match(warning1, /SYSTEM WARNING: A nested instruction file exists/);

    // Second read to the same/nearby file governed by the same AGENTS.md should NOT return a warning (to prevent spam)
    const targetFile2 = path.resolve(process.cwd(), "moduleA/src/utils.js");
    const warning2 = await getAgentsWarning(targetFile2);
    assert.strictEqual(warning2, "");
  });

  await t.test(
    "returns empty string if no nested AGENTS.md exists",
    async () => {
      mockfs({
        "moduleB/index.js": "console.log('test');",
      });

      const targetFile = path.resolve(process.cwd(), "moduleB/index.js");
      const warning = await getAgentsWarning(targetFile);
      assert.strictEqual(warning, "");
    },
  );

  await t.test(
    "directoryHasAgentsMd correctly identifies AGENTS.md presence",
    async () => {
      mockfs({
        moduleC: {},
      });

      const moduleC = path.resolve(process.cwd(), "moduleC");

      // Should be false before creation
      const hasBefore = await directoryHasAgentsMd(moduleC);
      assert.strictEqual(hasBefore, false);

      // Restore and remock with AGENTS.md
      mockfs.restore();
      mockfs({
        "moduleC/AGENTS.md": "Rules",
      });

      const hasAfter = await directoryHasAgentsMd(moduleC);
      assert.strictEqual(hasAfter, true);
    },
  );
});
