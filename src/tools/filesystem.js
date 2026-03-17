const fs = require('fs/promises');
const path = require('path');
const ignore = require('ignore');
const { securePath, markAsRead, hasBeenRead } = require('../utils/security');
const { confirmAction } = require('../utils/ui');

let isYolo = false;
function setYolo(yolo) { isYolo = yolo; }

async function readFileTool(filePath) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  return content;
}

async function readLinesTool(filePath, startLine, endLine) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  const lines = content.split('\n');
  const start = Math.max(0, startLine - 1);
  const end = Math.min(lines.length, endLine);
  return lines.slice(start, end).join('\n');
}

async function grepTool(pattern, filePath) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  const lines = content.split('\n');
  const regex = new RegExp(pattern);
  const matches = [];
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      matches.push(`${index + 1}: ${line}`);
    }
  });
  return matches.join('\n');
}

async function lsTool(dirPath = '.') {
  const resolved = securePath(dirPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return entries.map(entry => {
    const type = entry.isDirectory() ? 'DIR' : 'FILE';
    return `[${type}] ${entry.name}`;
  }).join('\n') || 'Directory is empty';
}

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
      
      result += `${prefix}${marker}${entry.name}\n`;
      
      if (entry.isDirectory()) {
        const fullPath = path.join(currentPath, entry.name);
        result += await buildTree(fullPath, newPrefix);
      }
    }
    return result;
  }
  
  const rootName = path.basename(resolved) || '.';
  const treeBody = await buildTree(resolved);
  return `${rootName}\n${treeBody}`.trim() || 'Empty directory';
}

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

  if (!isYolo) {
    const ok = await confirmAction(`Allow writing to ${filePath}?`);
    if (!ok) throw new Error("User denied write operation.");
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf-8');
  return `Successfully wrote to ${filePath}`;
}

async function mkdirTool(dirPath) {
  const resolved = securePath(dirPath);
  if (!isYolo) {
    const ok = await confirmAction(`Allow creating directory ${dirPath}?`);
    if (!ok) throw new Error("User denied mkdir operation.");
  }
  await fs.mkdir(resolved, { recursive: true });
  return `Created directory ${dirPath}`;
}

async function touchTool(filePath) {
  const resolved = securePath(filePath);
  try {
    const time = new Date();
    await fs.utimes(resolved, time, time);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(resolved, '');
    } else {
      throw err;
    }
  }
  return `Touched ${filePath}`;
}

async function rmTool(targetPath, recursive = false) {
  const resolved = securePath(targetPath);
  if (!isYolo) {
    const ok = await confirmAction(`Allow removing ${targetPath} (recursive: ${recursive})?`);
    if (!ok) throw new Error("User denied rm operation.");
  }
  await fs.rm(resolved, { recursive, force: true });
  return `Removed ${targetPath}`;
}

module.exports = {
  setYolo,
  readFileTool,
  readLinesTool,
  grepTool,
  lsTool,
  treeTool,
  writeTool,
  mkdirTool,
  touchTool,
  rmTool
};
