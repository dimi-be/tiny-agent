const fs = require('fs/promises');
const { securePath } = require('../../utils/security');
const { confirmAction } = require('../../utils/ui');
const { getIsYolo } = require('./state');

async function mkdirTool(dirPath) {
  const resolved = securePath(dirPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow creating directory ${dirPath}?`);
    if (!ok) throw new Error("User denied mkdir operation.");
  }
  await fs.mkdir(resolved, { recursive: true });
  return `Created directory ${dirPath}`;
}

module.exports = mkdirTool;
