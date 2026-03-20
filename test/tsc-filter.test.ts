import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { checkSyntax } from '../src/utils/syntax/index.js';

test('TSC Output Filtering', async (t) => {
  const tmpDir = path.join(process.cwd(), 'test-tmp-tsc-filter');

  t.before(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
  });

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  await t.test('filters out errors from other files', async () => {
    const otherFile = path.join(tmpDir, 'other.ts');
    const mainFile = path.join(tmpDir, 'main.ts');

    // Create a dependency with a type error
    await fs.writeFile(otherFile, 'export const a: string = 1;');
    
    // Create a main file that imports it but has no error itself
    await fs.writeFile(mainFile, "import { a } from './other.js';\nconsole.log(a);");

    const result = await checkSyntax(mainFile);
    
    // It should pass because the error in other.ts is filtered out
    assert.strictEqual(result, 'Syntax check passed.', 'Should pass syntax check even if dependency has errors');
  });

  await t.test('only shows errors from the current file', async () => {
    const otherFile = path.join(tmpDir, 'other_with_error.ts');
    const mainFileWithError = path.join(tmpDir, 'main_with_error.ts');

    // Create a dependency with a type error
    await fs.writeFile(otherFile, 'export const a: string = 1;');
    
    // Create a main file that has its OWN type error
    await fs.writeFile(mainFileWithError, "import { a } from './other_with_error.js';\nexport const b: string = 2;");

    const result = await checkSyntax(mainFileWithError);
    
    // It should fail, but the message should only contain main_with_error.ts
    assert.match(result, /\*\*CRITICAL: The code you wrote has errors\.\*\*/);
    assert.match(result, /\[TSC\]/);
    assert.ok(result.includes('main_with_error.ts'), 'Should contain error from main file');
    assert.ok(!result.includes('other_with_error.ts'), 'Should NOT contain error from dependency');
  });
});
