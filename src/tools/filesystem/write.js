const fs = require('fs/promises');
const path = require('path');
const { securePath, hasBeenRead } = require('../../utils/security');
const { confirmAction } = require('../../utils/ui');
const { getIsYolo } = require('./state');
const { checkSyntax } = require('../../utils/syntax');

async function writeTool(filePath, content) {
  const resolved = securePath(filePath);
  try {
    const stats = await fs.stat(resolved);
    if (stats.isFile() && !hasBeenRead(resolved)) {
      throw new Error(`You must read this file before overwriting it: ${filePath}`);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow writing to ${filePath}?`);
    if (!ok) throw new Error("User denied write operation.");
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf-8');
  
  const syntaxResult = await checkSyntax(resolved);
  return `Successfully wrote to ${filePath}\n${syntaxResult}`;
}

module.exports = writeTool;
