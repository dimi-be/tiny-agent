const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { securePath, markAsRead, hasBeenRead, checkNpmCommand } = require('../src/utils/security');

test('Security Utility Tests', async (t) => {
  await t.test('securePath blocks paths outside CWD', () => {
    assert.throws(
      () => securePath('../outside.txt'),
      /Security Error: Cannot access paths outside the current working directory/
    );
    assert.throws(
      () => securePath('/etc/passwd'),
      /Security Error: Cannot access paths outside the current working directory/
    );
  });

  await t.test('securePath allows paths inside CWD', () => {
    const validPath = 'inside.txt';
    const expected = path.resolve(process.cwd(), validPath);
    assert.strictEqual(securePath(validPath), expected);
    
    const nestedPath = 'src/utils/inside.txt';
    const expectedNested = path.resolve(process.cwd(), nestedPath);
    assert.strictEqual(securePath(nestedPath), expectedNested);
  });

  await t.test('checkNpmCommand allows all npm commands', () => {
    assert.doesNotThrow(() => checkNpmCommand('test'));
    assert.doesNotThrow(() => checkNpmCommand('install'));
    assert.doesNotThrow(() => checkNpmCommand('publish'));
    assert.doesNotThrow(() => checkNpmCommand('run build'));
  });

  
  await t.test('markAsRead and hasBeenRead track files correctly', () => {
    const testFile = 'test-file.txt';
    assert.strictEqual(hasBeenRead(testFile), false);
    
    markAsRead(testFile);
    assert.strictEqual(hasBeenRead(testFile), true);
    
    // Test with absolute path vs relative path resolution
    const absoluteTestFile = path.resolve(process.cwd(), testFile);
    assert.strictEqual(hasBeenRead(absoluteTestFile), true);
  });
});
