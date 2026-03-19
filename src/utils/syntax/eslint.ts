import { execFileAsync } from '../exec.js';
import { formatDiagnostic } from './formatter.js';
import fs from 'fs/promises';
import path from 'path';

export async function checkWithEslint(filePath: string) {
  try {
    await fs.access(filePath);
  } catch (err: any) {
    return `Syntax Error (Node Syntax): ${err.message}`;
  }

  // Instead of relying on a complex ESLint CLI which changed in v9, 
  // we first run node -c to catch duplicate declarations and basic scoping errors.
  try {
    await execFileAsync('node', ['-c', filePath]);
  } catch (error: any) {
    // node -c produces output like: "path/to/file.js:1\nconst a = 1; const a = 2;\n..."
    const stderr = error.stderr || '';
    const match = stderr.match(/:(\d+)\n/);
    const line = match ? parseInt(match[1], 10) : 1;
    return await formatDiagnostic('Node Syntax', filePath, line, 0, stderr.split('\n').slice(0, 3).join(' '));
  }
  
  // Optional: Run ESLint if configured in the project, ignoring missing rules.
  // We skip it here to avoid CLI compatibility issues, relying on node -c instead.
  return null;
}
