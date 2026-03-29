import path from 'path';
import fs from 'fs/promises';
import { findNearestFile } from './fs.js';

// A Set to track which nested AGENTS.md files have already been flagged to the model in the current session.
// This prevents us from spamming the model with the same warning over and over.
const warnedAgentsFiles = new Set<string>();

/**
 * Scans upwards from a starting directory to find the nearest AGENTS.md file,
 * stopping at the project root (process.cwd()).
 */
async function findNearestAgentsMd(startDir: string) {
  const rootDir = process.cwd();
  const agentsPath = await findNearestFile(startDir, 'AGENTS.md', rootDir);

  // We explicitly skip the root AGENTS.md because it's already injected into the system prompt.
  if (agentsPath && agentsPath === path.join(rootDir, 'AGENTS.md')) {
    return null;
  }

  return agentsPath;
}

/**
 * Returns a warning string if a new nested AGENTS.md is found.
 */
export async function getAgentsWarning(targetFilePath: string) {
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
export async function directoryHasAgentsMd(dirPath: string) {
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
