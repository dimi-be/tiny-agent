import { confirmAction } from "../utils/ui.js";
import { execFileAsync } from "../utils/exec.js";
import { getIsYolo } from "../utils/state.js";

const exeWhiteList = ["npm", "npx"];

export default async function shellTool(command: string) {
  const parsedArgs =
    command
      .match(/(?:[^\s"]+|"[^"]*")+/g)
      ?.map((arg: string) =>
        arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg,
      ) || [];

  if (parsedArgs.length === 0) {
    throw new Error("No command provided.");
  }

  const executable = parsedArgs[0];
  const args = parsedArgs.slice(1);

  if (!exeWhiteList.includes(executable)) {
    throw new Error(
      `Command not allowed: only ${exeWhiteList.join(", ")} are allowed. . You tried to run: ${executable}`,
    );
  }

  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow running '${command}'?`);
    if (!ok) throw new Error("User denied shell operation.");
  }

  try {
    const { stdout, stderr } = await execFileAsync(executable, args);
    return `stdout:\n${stdout}\nstderr:\n${stderr}`;
  } catch (error: any) {
    return `Error: ${error.message}\nstdout:\n${error.stdout || ""}\nstderr:\n${error.stderr || ""}`;
  }
}
