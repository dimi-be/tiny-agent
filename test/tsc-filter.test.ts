import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { checkSyntax } from '../src/utils/syntax/index.js';

test('TSC Output Filtering and Formatting', async (t) => {
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

    // Valid syntax, but has a type error
    await fs.writeFile(otherFile, 'export const a: number = ("string" as any);');
    
    // Create a main file that imports it but has no error itself
    await fs.writeFile(mainFile, "import { a } from './other.js';\nconsole.log(a);");

    const result = await checkSyntax(mainFile);
    
    // It should pass because the error in other.ts is filtered out
    assert.strictEqual(result, 'Syntax check passed.', 'Should pass syntax check even if dependency has errors');
  });

  await t.test('only shows errors from the current file', async () => {
    const otherFile = path.join(tmpDir, 'other_with_error.ts');
    const mainFileWithError = path.join(tmpDir, 'main_with_error.ts');

    // Valid syntax, type error
    await fs.writeFile(otherFile, 'export const a: number = ("error" as any);');
    
    // Valid syntax, type error in THIS file
    await fs.writeFile(mainFileWithError, "import { a } from './other_with_error.js';\nconst b: number = 1;\nconst c: string = 1;");

    const result = await checkSyntax(mainFileWithError);
    
    // It should fail
    assert.match(result, /\*\*CRITICAL: The code you wrote has errors\.\*\*/);
    assert.match(result, /\[TSC\]/);
    // Should contain context from the main file
    assert.ok(result.includes('const c: string = 1;'), 'Should contain error context from main file');
    // Should NOT contain the path to the other file (since it's filtered)
    assert.ok(!result.includes('other_with_error.ts'), 'Should NOT contain error from dependency');
  });

  await t.test('formats TSC diagnostic with code context', async () => {
    const errorFile = path.join(tmpDir, 'formatted_error.ts');
    // Use valid JS syntax that is a TS type error
    await fs.writeFile(errorFile, 'let x: number = 1;\nx = ("string" as any);\nconst y: string = 1;');
    
    const result = await checkSyntax(errorFile);
    
    // Verify that formatDiagnostic was called and result contains code context
    assert.match(result, /\*\*Location:\*\* Line 3, Col/);
    assert.match(result, /\*\*Context:\*\*/);
    assert.match(result, /3 > const y: string = 1;/);
    assert.match(result, /\[TSC\]/);
  });
});
