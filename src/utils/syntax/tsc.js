import { execFileAsync } from '../exec.js';
import fs from 'fs/promises';

export async function checkWithTsc(filePath) {
  try {
    await fs.access(filePath);
  } catch (err) {
    return `Syntax Error (TSC): ${err.message}`;
  }

  try {
    // --isolatedModules: treats file as a standalone unit
    // --noEmit: checks only, doesn't write files
    await execFileAsync('npx', [
      'tsc', 
      filePath, 
      '--noEmit', 
      '--isolatedModules', 
      '--skipLibCheck', 
      '--jsx', 'react-jsx', 
      '--pretty', 'false'
    ]);
    return null; // Passed
  } catch (error) {
    // stdout contains the actual type-check failures
    if (error.stdout) {
      return `**CRITICAL: The code you wrote has errors.**\n**Tool:** [TSC]\n**Message:**\n${error.stdout}`;
    }
  }

  return null;
}
