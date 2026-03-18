import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { npmTool, setYolo } from '../src/tools/system.js';

test('System Tool (npm) Security Tests', async (t) => {
  // Enable YOLO mode for tests to skip confirmation prompts
  setYolo(true);

  await t.test('npmTool blocks shell command injection', async () => {
    const canaryFile = 'injection-canary.txt';
    const resolvedCanary = path.resolve(process.cwd(), canaryFile);

    // Ensure canary file doesn't exist
    try {
      await fs.unlink(resolvedCanary);
    } catch (err) {
      // Ignore if it doesn't exist
    }

    // Attempt injection: run npm version and then try to touch a file using shell syntax
    const injectionCommand = `version && touch ${canaryFile}`;
    
    // This should NOT create the file because execFile does not use a shell
    const result = await npmTool(injectionCommand);
    
    // Verify canary file was NOT created
    let exists = false;
    try {
      await fs.access(resolvedCanary);
      exists = true;
    } catch (err) {
      exists = false;
    }

    assert.strictEqual(exists, false, 'Injection attack should not be able to create a file via shell operators.');
    
    // Verify that npm failed because it received '&&' as an argument
    assert.ok(result.includes('Error:') || result.includes('Unknown command: "&&"'), 'Result should indicate an error from npm for invalid arguments.');
  });

  await t.test('npmTool handles quoted arguments correctly', async () => {
    // This tests our argument parser (regex) in npmTool
    // We'll use 'config get "user-agent"' which is a valid npm command with quotes
    const command = 'config get "user-agent"';
    const result = await npmTool(command);
    
    assert.ok(result.includes('stdout:'), 'Should execute correctly with quoted arguments.');
    assert.ok(!result.includes('Error:'), 'Should not throw error for valid quoted arguments.');
  });
});
