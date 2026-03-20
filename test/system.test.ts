import test from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import { shellTool } from "../src/tools/shell-tool.js";
import { setYolo } from "../src/utils/state.js";

test("System Tool (shell) Security Tests", async (t) => {
  // Enable YOLO mode for tests to skip confirmation prompts
  setYolo(true);

  await t.test("shellTool blocks shell command injection", async () => {
    const canaryFile = "injection-canary.txt";
    const resolvedCanary = path.resolve(process.cwd(), canaryFile);

    // Ensure canary file doesn't exist
    try {
      await fs.unlink(resolvedCanary);
    } catch (err) {
      // Ignore if it doesn't exist
    }

    // Attempt injection: run npm version and then try to touch a file using shell syntax
    const injectionCommand = `npm version && touch ${canaryFile}`;

    // This should NOT create the file because execFile does not use a shell
    const result = await shellTool(injectionCommand);

    // Verify canary file was NOT created
    let exists = false;
    try {
      await fs.access(resolvedCanary);
      exists = true;
    } catch (err) {
      exists = false;
    }

    assert.strictEqual(
      exists,
      false,
      "Injection attack should not be able to create a file via shell operators.",
    );

    // Verify that npm failed because it received '&&' as an argument
    assert.ok(
      result.includes("Error:") || result.includes('Unknown command: "&&"'),
      "Result should indicate an error from npm for invalid arguments.",
    );
  });

  await t.test("shellTool handles quoted arguments correctly", async () => {
    // This tests our argument parser (regex) in shellTool
    // We'll use 'npm config get "user-agent"' which is a valid npm command with quotes
    const command = 'npm config get "user-agent"';
    const result = await shellTool(command);

    assert.ok(
      result.includes("stdout:"),
      "Should execute correctly with quoted arguments.",
    );
    assert.ok(
      !result.includes("Error:"),
      "Should not throw error for valid quoted arguments.",
    );
  });

  await t.test("shellTool enforces whitelist", async () => {
    let errorThrown = false;
    try {
      await shellTool("ls -la");
    } catch (error: any) {
      errorThrown = true;
      assert.ok(
        error.message.includes("Command not allowed"),
        "Should throw an error for non-whitelisted commands",
      );
    }
    assert.ok(
      errorThrown,
      "Should have thrown an error for an un-whitelisted command",
    );
  });
});
