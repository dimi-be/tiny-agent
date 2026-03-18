import { execFile } from 'child_process';
import { promisify } from 'util';

const promisifiedExecFile = promisify(execFile);

/**
 * Executes a file in a separate process without using a shell.
 * This is a security measure to prevent command injection.
 * @param {string} file The name or path of the executable file to run.
 * @param {string[]} args List of string arguments.
 * @param {object} options Execution options.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function execFileAsync(file, args = [], options = {}) {
  const mergedOptions = {
    cwd: process.cwd(),
    shell: false, // Explicitly disable shell for security
    ...options
  };
  
  return await promisifiedExecFile(file, args, mergedOptions);
}
