import { checkNpmCommand } from '../utils/security.js';
import { confirmAction } from '../utils/ui.js';
import { execFileAsync } from '../utils/exec.js';
import { getIsYolo } from '../utils/state.js';

export async function npmTool(command) {
  checkNpmCommand(command);

  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow running 'npm ${command}'?`);
    if (!ok) throw new Error("User denied npm operation.");
  }

  try {
    const args = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(arg => 
      arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg
    ) || [];
    
    const { stdout, stderr } = await execFileAsync('npm', args);
    return `stdout:\n${stdout}\nstderr:\n${stderr}`;
  } catch (error) {
    return `Error: ${error.message}\nstdout:\n${error.stdout || ''}\nstderr:\n${error.stderr || ''}`;
  }
}
