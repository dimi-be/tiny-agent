import { execFileAsync } from '../exec.js';
import fs from 'fs/promises';

export async function checkWithPython(filePath: string) {
  try {
    await fs.access(filePath);
  } catch (err: any) {
    return `Syntax Error (Python): ${err.message}`;
  }

  try {
    try {
      await execFileAsync('python3', ['-m', 'py_compile', filePath]);
    } catch (e) {
      await execFileAsync('python', ['-m', 'py_compile', filePath]);
    }
    return null; // Passed
  } catch (error: any) {
    if (error.code === 127 || error.code === 'ENOENT') return null; // python not found
    return `**CRITICAL: The code you wrote has errors.**\n**Tool:** [Python]\n**Message:**\n${error.stderr || error.message}`;
  }
}
