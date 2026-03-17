const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs/promises');
const path = require('path');
const { checkSyntax } = require('../src/utils/syntax');

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

  await t.test('fails invalid JavaScript', async () => {
    const file = path.join(tmpDir, 'invalid.js');
    await fs.writeFile(file, 'const a = 1; const a = 2;');
    const result = await checkSyntax(file);
    assert.match(result, /Syntax Error:/);
    assert.match(result, /SyntaxError: Identifier 'a' has already been declared/);
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
});
