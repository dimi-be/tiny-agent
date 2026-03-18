import { exec } from 'child_process';
import { promisify } from 'util';
import { checkNpmCommand } from '../utils/security.js';
import { confirmAction } from '../utils/ui.js';

const execAsync = promisify(exec);

let isYolo = false;
export function setYolo(yolo) { isYolo = yolo; }

export async function npmTool(command) {
  checkNpmCommand(command);

  if (!isYolo) {
    const ok = await confirmAction(`Allow running 'npm ${command}'?`);
    if (!ok) throw new Error("User denied npm operation.");
  }

  try {
    const { stdout, stderr } = await execAsync(`npm ${command}`, { cwd: process.cwd() });
    return `stdout:\n${stdout}\nstderr:\n${stderr}`;
  } catch (error) {
    return `Error: ${error.message}\nstdout:\n${error.stdout}\nstderr:\n${error.stderr}`;
  }
}
