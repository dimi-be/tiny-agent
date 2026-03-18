import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import writeTool from '../src/tools/filesystem/write.js';
import readFileTool from '../src/tools/filesystem/read.js';
import { setYolo } from '../src/tools/filesystem/state.js';

test('Write Tool (Read-Before-Write Policy)', async (t) => {
  const tmpFile = path.join(process.cwd(), 'test-write-policy.txt');
  setYolo(true); // Disable confirmation prompts

  // Cleanup before tests
  t.beforeEach(async () => {
    try {
      await fs.unlink(tmpFile);
    } catch (err) {
      // Ignore
    }
  });

  // Cleanup after tests
  t.after(async () => {
    try {
      await fs.unlink(tmpFile);
    } catch (err) {
      // Ignore
    }
  });

  await t.test('allows writing to a non-existent file without reading', async () => {
    const result = await writeTool('test-write-policy.txt', 'new content');
    assert.ok(result.includes('Successfully wrote'), 'Should allow writing to a new file.');
    
    const content = await fs.readFile(tmpFile, 'utf-8');
    assert.strictEqual(content, 'new content');
  });

  await t.test('blocks writing to an existing file if not read first', async () => {
    // 1. Create the file first
    await fs.writeFile(tmpFile, 'original content', 'utf-8');

    // 2. Try to write without reading
    await assert.rejects(
      () => writeTool('test-write-policy.txt', 'new content'),
      /already exists. You must read it first/
    );
  });

  await t.test('allows writing to an existing file after it has been read', async () => {
    // 1. Create the file first
    await fs.writeFile(tmpFile, 'original content', 'utf-8');

    // 2. Read the file using the read tool
    await readFileTool('test-write-policy.txt');

    // 3. Try to write now
    const result = await writeTool('test-write-policy.txt', 'updated content');
    assert.ok(result.includes('Successfully wrote'), 'Should allow writing after reading.');
    
    const content = await fs.readFile(tmpFile, 'utf-8');
    assert.strictEqual(content, 'updated content');
  });
});
