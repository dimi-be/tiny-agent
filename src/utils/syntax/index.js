import path from 'path';
import fs from 'fs/promises';
import { checkWithTreeSitter } from './tree-sitter.js';
import { checkWithEslint } from './eslint.js';
import { checkWithTsc } from './tsc.js';
import { checkWithPython } from './python.js';

export async function checkSyntax(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    await fs.access(filePath);
  } catch (err) {
    return `Syntax Error:\n${err.message}`;
  }

  try {
    if (ext === '.json') {
      const content = await fs.readFile(filePath, 'utf8');
      JSON.parse(content);
      return 'Syntax check passed.';
    }

    if (ext === '.py') {
      // Stage 1: Tree-sitter
      const tsError = await checkWithTreeSitter(filePath, ext);
      if (tsError) return tsError;

      const error = await checkWithPython(filePath);
      if (error) return error;
      return 'Syntax check passed.';
    }

    const isJS = ['.js', '.cjs', '.mjs', '.jsx'].includes(ext);
    const isTS = ['.ts', '.tsx'].includes(ext);

    if (isJS || isTS) {
      // Stage 1: Tree-sitter (Universal Syntax Check)
      const tsError = await checkWithTreeSitter(filePath, ext);
      if (tsError) return tsError;

      // Stage 2: ESLint (Style & Local Logic)
      const lintError = await checkWithEslint(filePath);
      if (lintError) return lintError;

      // Stage 3: TSC (Type & Deep Logic - TypeScript Only)
      if (isTS) {
        const tscError = await checkWithTsc(filePath);
        if (tscError) return tscError;
      }

      return 'Syntax check passed.';
    }

    return `Syntax check skipped (unsupported file type: ${ext || 'none'})`;

  } catch (error) {
    if (error.code === 127 || error.code === 'ENOENT') {
      return `Syntax check skipped (required checking tool not installed).`;
    }
    return `Syntax Error:\n${error.stderr || error.message}`;
  }
}
