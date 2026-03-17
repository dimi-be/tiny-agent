const fs = require('fs/promises');
const { securePath, markAsRead } = require('../../utils/security');
const { getAgentsWarning } = require('../../utils/agentsMd');

async function readLinesTool(filePath, startLine, endLine) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  
  const selectedLines = lines.slice(start, end).join('\n');
  const warning = await getAgentsWarning(resolved);
  
  return warning + selectedLines;
}

module.exports = readLinesTool;
