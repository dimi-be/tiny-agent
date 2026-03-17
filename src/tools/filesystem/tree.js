const fs = require('fs/promises');
const path = require('path');
const ignore = require('ignore');
const { securePath } = require('../../utils/security');
const { directoryHasAgentsMd } = require('../../utils/agentsMd');

async function treeTool(dirPath = '.') {
  const resolved = securePath(dirPath);
  
  const ig = ignore();
  try {
    const gitignoreContent = await fs.readFile(path.join(process.cwd(), '.gitignore'), 'utf-8');
    ig.add(gitignoreContent);
  } catch (e) {}
  
  ig.add(['node_modules', '.*']);

  async function buildTree(currentPath, prefix = '') {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    entries.sort((a, b) => {
      if (a.isDirectory() === b.isDirectory()) return a.name.localeCompare(b.name);
      return a.isDirectory() ? -1 : 1;
    });

    let result = '';
    const filteredEntries = [];
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;
      if (ig.ignores(relativePath + (entry.isDirectory() ? '/' : ''))) continue;
      
      filteredEntries.push(entry);
    }

    for (let i = 0; i < filteredEntries.length; i++) {
      const entry = filteredEntries[i];
      const isLast = i === filteredEntries.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      
      let line = `${prefix}${marker}${entry.name}`;
      
      if (entry.isDirectory()) {
        const fullPath = path.join(currentPath, entry.name);
        const hasAgents = await directoryHasAgentsMd(fullPath);
        if (hasAgents) {
          line += ' (Contains AGENTS.md)';
        }
        result += line + '\n';
        result += await buildTree(fullPath, newPrefix);
      } else {
        result += line + '\n';
      }
    }
    return result;
  }
  
  const rootName = path.basename(resolved) || '.';
  const treeBody = await buildTree(resolved);
  return `${rootName}\n${treeBody}`.trim() || 'Empty directory';
}

module.exports = treeTool;
