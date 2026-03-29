import path from 'path';
import fs from 'fs/promises';

/**
 * Scans upwards from a starting directory to find the nearest file with the given name,
 * stopping at the specified root directory (or the system root).
 */
export async function findNearestFile(startDir: string, fileName: string, rootDir: string): Promise<string | null> {
  let currentDir = startDir;

  while (currentDir.startsWith(rootDir)) {
    const filePath = path.join(currentDir, fileName);
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        return filePath;
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
