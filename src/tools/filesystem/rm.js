const fs = require('fs/promises');
const { securePath } = require('../../utils/security');
const { confirmAction } = require('../../utils/ui');
const { getIsYolo } = require('./state');

async function rmTool(targetPath, recursive = false) {
  const resolved = securePath(targetPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow removing ${targetPath} (recursive: ${recursive})?`);
    if (!ok) throw new Error("User denied rm operation.");
  }
  await fs.rm(resolved, { recursive, force: true });
  return `Removed ${targetPath}`;
}

module.exports = rmTool;
