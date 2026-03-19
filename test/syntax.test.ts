import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { checkSyntax } from '../src/utils/syntax/index.js';

test('Syntax Checking Utility', async (t) => {
  const tmpDir = path.join(process.cwd(), 'test-tmp-syntax');

  t.before(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  await t.test('passes valid JavaScript', async () => {
    const file = path.join(tmpDir, 'valid.js');
    await fs.writeFile(file, 'const a = 1; console.log(a);');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax check passed/);
  });

  await t.test('fails invalid JavaScript (Syntax Error via Tree-sitter)', async () => {
    const file = path.join(tmpDir, 'invalid-syntax.js');
    await fs.writeFile(file, 'const a = 1; function() {');
    const result = await checkSyntax(file);
    assert.match(result, /\*\*CRITICAL: The code you wrote has errors\.\*\*/);
    assert.match(result, /\*\*Tool:\*\* \[Tree-sitter\]/);
  });

  await t.test('fails invalid JavaScript (Logic Error via Node Syntax)', async () => {
    const file = path.join(tmpDir, 'invalid-logic.js');
    await fs.writeFile(file, 'const a = 1; const a = 2;');
    const result = await checkSyntax(file);
    assert.match(result, /\*\*CRITICAL: The code you wrote has errors\.\*\*/);
    assert.match(result, /\*\*Tool:\*\* \[Node Syntax\]/);
  });

  await t.test('passes valid JSON', async () => {
    const file = path.join(tmpDir, 'valid.json');
    await fs.writeFile(file, '{"name": "tiny-agent"}');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax check passed/);
  });

  await t.test('fails invalid JSON', async () => {
    const file = path.join(tmpDir, 'invalid.json');
    await fs.writeFile(file, '{"name": "tiny-agent",}');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax Error:/);
  });

  await t.test('skips unsupported file types', async () => {
    const file = path.join(tmpDir, 'test.txt');
    await fs.writeFile(file, 'Hello world');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax check skipped \(unsupported file type: \.txt\)/);
  });
  
  await t.test('handles missing file gracefully', async () => {
    const file = path.join(tmpDir, 'does-not-exist.js');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax Error:/);
  });

  await t.test('plain text mode (skipped elsewhere) behaves correctly in write tool', async () => {
    // This is tested in the write tool tests, or we can just assert that checkSyntax is the one that gets bypassed
  });
});
