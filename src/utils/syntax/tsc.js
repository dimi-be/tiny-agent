import { execFileAsync } from '../exec.js';

export async function checkWithTsc(filePath) {
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
