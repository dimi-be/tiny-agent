const path = require('path');
const fs = require('fs/promises');

// A Set to track which nested AGENTS.md files have already been flagged to the model in the current session.
// This prevents us from spamming the model with the same warning over and over.
const warnedAgentsFiles = new Set();

/**
 * Scans upwards from a starting directory to find the nearest AGENTS.md file,
 * stopping at the project root (process.cwd()).
 */
async function findNearestAgentsMd(startDir) {
  let currentDir = startDir;
  const rootDir = process.cwd();

  while (currentDir.startsWith(rootDir)) {
    const agentsPath = path.join(currentDir, 'AGENTS.md');
    
    // We explicitly skip the root AGENTS.md because it's already injected into the system prompt.
    if (agentsPath === path.join(rootDir, 'AGENTS.md')) {
      break;
    }

    try {
      const stats = await fs.stat(agentsPath);
      if (stats.isFile()) {
        return agentsPath;
      }
    } catch (err) {
      // File does not exist here, continue up
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break; // Reached system root
    currentDir = parentDir;
  }

  return null;
}

/**
 * Returns a warning string if a new nested AGENTS.md is found.
 */
async function getAgentsWarning(targetFilePath) {
  const startDir = path.dirname(targetFilePath);
  const nearestAgentsMd = await findNearestAgentsMd(startDir);

  if (nearestAgentsMd && !warnedAgentsFiles.has(nearestAgentsMd)) {
    warnedAgentsFiles.add(nearestAgentsMd);
    const relativePath = path.relative(process.cwd(), nearestAgentsMd);
    return `\n[SYSTEM WARNING: A nested instruction file exists at '${relativePath}'. You MUST read it to ensure you do not break local architecture rules.]\n\n`;
  }

  return '';
}

/**
 * Helper for ls/tree to check if a directory directly contains an AGENTS.md.
 * Note: We don't mark it as 'warned' here, just decorate the UI.
 */
async function directoryHasAgentsMd(dirPath) {
  try {
    const agentsPath = path.join(dirPath, 'AGENTS.md');
    // Skip decorating the root directory since it's already in the system prompt.
    if (agentsPath === path.join(process.cwd(), 'AGENTS.md')) {
      return false;
    }
    const stats = await fs.stat(agentsPath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

module.exports = { getAgentsWarning, directoryHasAgentsMd };
