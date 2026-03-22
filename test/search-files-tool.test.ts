import test from "node:test";
import assert from "node:assert";
import mockfs from "mock-fs";
import { searchFilesTool } from "../src/tools/search-files-tool.js";

test("searchFilesTool Tests", async (t) => {
  t.afterEach(async () => {
    mockfs.restore();
  });

  await t.test("finds a match in a single file", async () => {
    mockfs({
      "test-file.txt": "hello world\nthis is a test\nanother hello",
    });

    const result = await searchFilesTool({ pattern: "hello" });

    const expectedLines = [
      "test-file.txt:1: hello world",
      "test-file.txt:3: another hello",
    ];
    assert.strictEqual(result, expectedLines.join("\n"));
  });

  await t.test("respects the include glob pattern", async () => {
    mockfs({
      "src/app.ts": "import express from 'express';",
      "test/app.test.ts": "import { app } from '../src/app';",
      "docs/readme.md": "This is a documentation file about app.",
    });

    const result = await searchFilesTool({
      pattern: "express",
      include: "src/**/*.ts",
    });

    assert.strictEqual(result, "src/app.ts:1: import express from 'express';");
  });

  await t.test("respects default ignore list (e.g. node_modules)", async () => {
    mockfs({
      "node_modules/lib/index.js": "const secret = 'pattern';",
      "src/index.js": "const pattern = 'found';",
    });

    const result = await searchFilesTool({ pattern: "pattern" });

    assert.strictEqual(result, "src/index.js:1: const pattern = 'found';");
    assert.ok(!result.includes("node_modules"));
  });

  await t.test("handles no matches found", async () => {
    mockfs({
      "file.txt": "nothing here",
    });

    const result = await searchFilesTool({ pattern: "nonexistent" });

    assert.strictEqual(result, "No matches found.");
  });

  await t.test("truncates results at MAX_RESULTS", async () => {
    const manyLines = Array(60).fill("match this").join("\n");
    mockfs({
      "large-file.txt": manyLines,
    });

    const result = await searchFilesTool({ pattern: "match" });

    const lines = result.split("\n");
    // MAX_RESULTS is 50. The result should have 51 lines (50 matches + 1 truncation message).
    assert.strictEqual(lines.length, 51);
    assert.ok(lines[lines.length - 1].includes("Truncated"));
  });

  await t.test("handles dotfiles correctly (ignored by default)", async () => {
    mockfs({
      ".env": "SECRET_KEY=12345",
      "app.js": "console.log('app');",
    });

    const result = await searchFilesTool({ pattern: "SECRET" });

    assert.strictEqual(result, "No matches found.");
  });
});
