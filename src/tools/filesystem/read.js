const fs = require('fs/promises');
const { securePath, markAsRead } = require('../../utils/security');
const { getAgentsWarning } = require('../../utils/agentsMd');

async function readFileTool(filePath) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  
  const warning = await getAgentsWarning(resolved);
  return warning + content;
}

module.exports = readFileTool;
