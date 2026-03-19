import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { getAgentsWarning, directoryHasAgentsMd } from '../src/utils/agentsMd.js';

test('AGENTS.md Utility', async (t) => {
  const tmpDir = path.join(process.cwd(), 'test-tmp-agents');

  t.before(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    // Note: process.cwd() is where the test is run from, which is the project root.
    // The utility explicitly skips the root AGENTS.md, so we test nested logic.
  });

  t.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  await t.test('returns warning for new nested AGENTS.md', async () => {
    const nestedDir = path.join(tmpDir, 'moduleA');
    await fs.mkdir(nestedDir, { recursive: true });
    
    const agentsPath = path.join(nestedDir, 'AGENTS.md');
    await fs.writeFile(agentsPath, 'Rule 1: Do not use var.');

    const targetFile = path.join(nestedDir, 'src', 'index.js');
    await fs.mkdir(path.dirname(targetFile), { recursive: true });
    
    // First read should return a warning
    const warning1 = await getAgentsWarning(targetFile);
    assert.match(warning1, /SYSTEM WARNING: A nested instruction file exists/);
    
    // Second read to the same/nearby file governed by the same AGENTS.md should NOT return a warning (to prevent spam)
    const targetFile2 = path.join(nestedDir, 'src', 'utils.js');
    const warning2 = await getAgentsWarning(targetFile2);
    assert.strictEqual(warning2, '');
  });

  await t.test('returns empty string if no nested AGENTS.md exists', async () => {
    const noAgentsDir = path.join(tmpDir, 'moduleB');
    await fs.mkdir(noAgentsDir, { recursive: true });
    
    const targetFile = path.join(noAgentsDir, 'index.js');
    const warning = await getAgentsWarning(targetFile);
    assert.strictEqual(warning, '');
  });

  await t.test('directoryHasAgentsMd correctly identifies AGENTS.md presence', async () => {
    const moduleC = path.join(tmpDir, 'moduleC');
    await fs.mkdir(moduleC, { recursive: true });
    
    const agentsPath = path.join(moduleC, 'AGENTS.md');
    
    // Should be false before creation
    const hasBefore = await directoryHasAgentsMd(moduleC);
    assert.strictEqual(hasBefore, false);

    // Should be true after creation
    await fs.writeFile(agentsPath, 'Rules');
    const hasAfter = await directoryHasAgentsMd(moduleC);
    assert.strictEqual(hasAfter, true);
  });
});
