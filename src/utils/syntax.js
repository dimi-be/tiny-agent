import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function checkSyntax(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.js' || ext === '.cjs' || ext === '.mjs') {
      await execAsync(`node -c "${filePath}"`);
      return 'Syntax check passed.';
    }
    
    if (ext === '.json') {
      const content = await fs.readFile(filePath, 'utf8');
      JSON.parse(content);
      return 'Syntax check passed.';
    }

    if (ext === '.py') {
      try {
        await execAsync(`python3 -m py_compile "${filePath}"`);
      } catch (e) {
        // Fallback to python if python3 isn't available
        await execAsync(`python -m py_compile "${filePath}"`);
      }
      return 'Syntax check passed.';
    }

    if (ext === '.ts' || ext === '.tsx' || ext === '.jsx') {
      // Use npx --no-install to avoid hanging/downloading if tsc isn't locally present.
      // This uses the project's own typescript configuration.
      await execAsync(`npx --no-install tsc --noEmit`);
      return 'Syntax check passed (TypeScript/React).';
    }

    return `Syntax check skipped (unsupported file type: ${ext || 'none'})`;

  } catch (error) {
    // If a CLI tool is not installed, it generally exits with code 127
    if (error.code === 127) {
      return `Syntax check skipped (required checking tool not installed).`;
    }

    // Return the actual syntax error to the model
    return `Syntax Error:\n${error.stderr || error.message}`;
  }
}
