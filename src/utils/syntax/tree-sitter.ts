import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Parser, Language } = require('web-tree-sitter');

import path from 'path';
import fs from 'fs/promises';
import { formatDiagnostic } from './formatter.js';

let isInitialized = false;

function getWasmPath(ext: string) {
  let baseWasmDir;
  try {
    const pkgPath = require.resolve('@repomix/tree-sitter-wasms/package.json');
    baseWasmDir = path.join(path.dirname(pkgPath), 'out');
  } catch (err) {
    // Fallback if not found
    baseWasmDir = path.join(process.cwd(), 'node_modules', '@repomix', 'tree-sitter-wasms', 'out');
  }
  
  switch (ext) {
    case '.js':
    case '.cjs':
    case '.mjs':
    case '.jsx':
      return path.join(baseWasmDir, 'tree-sitter-javascript.wasm');
    case '.ts':
      return path.join(baseWasmDir, 'tree-sitter-typescript.wasm');
    case '.tsx':
      return path.join(baseWasmDir, 'tree-sitter-tsx.wasm');
    case '.py':
      return path.join(baseWasmDir, 'tree-sitter-python.wasm');
    default:
      return null;
  }
}

function findErrorNode(node: any): any {
  if (node.type === 'ERROR' || node.isMissing) {
    return node;
  }
  for (let i = 0; i < node.childCount; i++) {
    const error = findErrorNode(node.child(i));
    if (error) return error;
  }
  return null;
}

export async function checkWithTreeSitter(filePath: string, ext: string) {
  const wasmPath = getWasmPath(ext);
  if (!wasmPath) return null; // Unsupported

  try {
    await fs.access(filePath);
  } catch (err: any) {
    return `Syntax Error (Tree-sitter): ${err.message}`;
  }

  try {
    if (!isInitialized) {
      await Parser.init();
      isInitialized = true;
    }

    const Lang = await Language.load(wasmPath);
    const parser = new Parser();
    parser.setLanguage(Lang);

    const fileContent = await fs.readFile(filePath, 'utf8');
    const tree = parser.parse(fileContent);
    
    const errorNode = findErrorNode(tree.rootNode);
    if (errorNode) {
      const line = errorNode.startPosition.row + 1;
      const col = errorNode.startPosition.column;
      const msg = errorNode.isMissing ? `Missing ${errorNode.type}` : "Syntax Error (Tree-sitter)";
      return await formatDiagnostic('Tree-sitter', filePath, line, col, msg);
    }
  } catch (err) {
    // If we fail to load wasm or initialize, silently pass to the next stage
  }

  return null; // Passed
}
