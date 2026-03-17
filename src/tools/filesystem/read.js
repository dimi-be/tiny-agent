const fs = require('fs/promises');
const { securePath, markAsRead } = require('../../utils/security');

async function readFileTool(filePath) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  return content;
}

module.exports = readFileTool;
