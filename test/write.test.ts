import test from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import mockfs from "mock-fs";
import path from "path";
import { writeFileTool } from "../src/tools/write-file-tool.js";
import { readFileTool } from "../src/tools/read-file-tool.js";
import { createFileTool } from "../src/tools/create-file-tool.js";
import { setYolo, setPlainText } from "../src/utils/state.js";
import { resetFilesReadState } from "../src/utils/security.js";

test("Write Tool (Read-Before-Write Policy)", async (t) => {
  setYolo(true); // Disable confirmation prompts

  t.beforeEach(async () => {
    setPlainText(false);
    resetFilesReadState();
  });

  t.afterEach(async () => {
    mockfs.restore();
  });

  await t.test(
    "allows writing to a non-existent file without reading",
    async () => {
      mockfs({});
      const result = await writeFileTool({
        filePath: "test-write-policy.txt",
        content: "new content",
      });
      assert.ok(
        result.includes("Successfully wrote"),
        "Should allow writing to a new file.",
      );

      const content = await fs.readFile("test-write-policy.txt", "utf-8");
      assert.strictEqual(content, "new content");
    },
  );

  await t.test(
    "blocks writing to an existing file if not read first",
    async () => {
      mockfs({
        "test-write-policy.txt": "original content",
      });

      // 2. Try to write without reading
      await assert.rejects(
        () =>
          writeFileTool({
            filePath: "test-write-policy.txt",
            content: "new content",
          }),
        /already exists and is not empty. You must read it first/,
      );
    },
  );

  await t.test(
    "allows writing to an existing file after it has been read",
    async () => {
      mockfs({
        "test-write-policy.txt": "original content",
      });

      // 2. Read the file using the read tool
      await readFileTool({ filePath: "test-write-policy.txt" });

      // 3. Try to write now
      const result = await writeFileTool({
        filePath: "test-write-policy.txt",
        content: "updated content",
      });
      assert.ok(
        result.includes("Successfully wrote"),
        "Should allow writing after reading.",
      );

      const content = await fs.readFile("test-write-policy.txt", "utf-8");
      assert.strictEqual(content, "updated content");
    },
  );

  await t.test("plain text mode skips syntax checking", async () => {
    mockfs({});
    setPlainText(true);
    // Write invalid JS file
    const result = await writeFileTool({
      filePath: "test-write-syntax.js",
      content: "const a = 1; function() {",
    });
    // It should succeed without any syntax error in the result
    assert.ok(result.includes("Successfully wrote"));
    assert.ok(!result.includes("CRITICAL"));
  });

  await t.test(
    "allows writing to a file created by touch without reading",
    async () => {
      mockfs({});
      await createFileTool({ filePath: "test-write-policy.txt" });
      const result = await writeFileTool({
        filePath: "test-write-policy.txt",
        content: "touched content",
      });
      assert.ok(
        result.includes("Successfully wrote"),
        "Should allow writing to a touched file.",
      );
    },
  );

  await t.test("allows writing to an empty file without reading", async () => {
    mockfs({
      "test-write-policy.txt": "",
    });

    // Should work because size is 0
    const result = await writeFileTool({
      filePath: "test-write-policy.txt",
      content: "from empty",
    });
    assert.ok(
      result.includes("Successfully wrote"),
      "Should allow writing to an empty file.",
    );
  });

  await t.test(
    "allows writing twice to the same file in one session",
    async () => {
      mockfs({});
      // 1. Initial write (to new file)
      await writeFileTool({
        filePath: "test-write-policy.txt",
        content: "first",
      });

      // 2. Second write (to existing file)
      // This should work because the first write calls markAsRead
      const result = await writeFileTool({
        filePath: "test-write-policy.txt",
        content: "second",
      });
      assert.ok(
        result.includes("Successfully wrote"),
        "Should allow subsequent writes.",
      );

      const content = await fs.readFile("test-write-policy.txt", "utf-8");
      assert.strictEqual(content, "second");
    },
  );
});
