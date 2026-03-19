import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import writeTool from '../src/tools/filesystem/write.js';
import readFileTool from '../src/tools/filesystem/read.js';
import touchTool from '../src/tools/filesystem/touch.js';
import { setYolo, setPlainText } from '../src/utils/state.js';
import { resetFilesReadState } from '../src/utils/security.js';

test('Write Tool (Read-Before-Write Policy)', async (t) => {
  const tmpFile = path.join(process.cwd(), 'test-write-policy.txt');
  const tmpJsFile = path.join(process.cwd(), 'test-write-syntax.js');
  setYolo(true); // Disable confirmation prompts

  // Cleanup before tests
  t.beforeEach(async () => {
    try { await fs.unlink(tmpFile); } catch (err) {}
    try { await fs.unlink(tmpJsFile); } catch (err) {}
    setPlainText(false);
    resetFilesReadState();
  });

  // Cleanup after tests
  t.after(async () => {
    try { await fs.unlink(tmpFile); } catch (err) {}
    try { await fs.unlink(tmpJsFile); } catch (err) {}
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
      /already exists and is not empty. You must read it first/
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

  await t.test('plain text mode skips syntax checking', async () => {
    setPlainText(true);
    // Write invalid JS file
    const result = await writeTool('test-write-syntax.js', 'const a = 1; function() {');
    // It should succeed without any syntax error in the result
    assert.ok(result.includes('Successfully wrote'));
    assert.ok(!result.includes('CRITICAL'));
  });

  await t.test('allows writing to a file created by touch without reading', async () => {
    await touchTool('test-write-policy.txt');
    const result = await writeTool('test-write-policy.txt', 'touched content');
    assert.ok(result.includes('Successfully wrote'), 'Should allow writing to a touched file.');
  });

  await t.test('allows writing to an empty file without reading', async () => {
    // Create an empty file directly (not through touchTool)
    await fs.writeFile(tmpFile, '', 'utf-8');
    
    // Should work because size is 0
    const result = await writeTool('test-write-policy.txt', 'from empty');
    assert.ok(result.includes('Successfully wrote'), 'Should allow writing to an empty file.');
  });

  await t.test('allows writing twice to the same file in one session', async () => {
    // 1. Initial write (to new file)
    await writeTool('test-write-policy.txt', 'first');
    
    // 2. Second write (to existing file)
    // This should work because the first write calls markAsRead
    const result = await writeTool('test-write-policy.txt', 'second');
    assert.ok(result.includes('Successfully wrote'), 'Should allow subsequent writes.');
    
    const content = await fs.readFile(tmpFile, 'utf-8');
    assert.strictEqual(content, 'second');
  });
});
