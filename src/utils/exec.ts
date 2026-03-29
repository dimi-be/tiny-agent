import { execFile, ExecFileOptions } from "child_process";
import { promisify } from "util";

const promisifiedExecFile = promisify(execFile);

/**
 * Executes a file in a separate process without using a shell.
 * This is a security measure to prevent command injection.
 * @param {string} file The name or path of the executable file to run.
 * @param {string[]} args List of string arguments.
 * @param {number} timeout Timeout in milliseconds (default: 30000).
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function execFileAsync(file: string, args: string[] = [], timeout: number = 30000) {
  const options: ExecFileOptions = {
    cwd: process.cwd(),
    shell: false, // Explicitly disable shell for security
    timeout,
  };

  return await promisifiedExecFile(file, args, options);
}
