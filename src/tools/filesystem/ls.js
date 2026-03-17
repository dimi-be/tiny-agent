const fs = require('fs/promises');
const { securePath } = require('../../utils/security');

async function lsTool(dirPath = '.') {
  const resolved = securePath(dirPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return entries.map(entry => {
    const type = entry.isDirectory() ? 'DIR' : 'FILE';
    return `[${type}] ${entry.name}`;
  }).join('\n') || 'Directory is empty';
}

module.exports = lsTool;
