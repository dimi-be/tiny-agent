const fs = require('fs/promises');
const path = require('path');
const { securePath } = require('../../utils/security');
const { directoryHasAgentsMd } = require('../../utils/agentsMd');

async function lsTool(dirPath = '.') {
  const resolved = securePath(dirPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  
  const formattedEntries = await Promise.all(entries.map(async (entry) => {
    const type = entry.isDirectory() ? 'DIR' : 'FILE';
    let line = `[${type}] ${entry.name}`;
    
    if (entry.isDirectory()) {
      const fullPath = path.join(resolved, entry.name);
      const hasAgents = await directoryHasAgentsMd(fullPath);
      if (hasAgents) {
        line += ' (Contains AGENTS.md)';
      }
    }
    return line;
  }));

  return formattedEntries.join('\n') || 'Directory is empty';
}

module.exports = lsTool;
