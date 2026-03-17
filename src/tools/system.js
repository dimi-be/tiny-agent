const { exec } = require('child_process');
const { promisify } = require('util');
const { checkNpmCommand } = require('../utils/security');
const { confirmAction } = require('../utils/ui');

const execAsync = promisify(exec);

let isYolo = false;
function setYolo(yolo) { isYolo = yolo; }

async function npmTool(command) {
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

module.exports = { setYolo, npmTool };
