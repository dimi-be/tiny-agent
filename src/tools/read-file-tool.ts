import fs from "fs/promises";
import { securePath, markAsRead } from "../utils/security.js";
import { getAgentsWarning } from "../utils/agentsMd.js";

export interface ReadFileArgs {
  filePath: string;
}

export async function readFileTool(args: ReadFileArgs) {
  const { filePath } = args;
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, "utf-8");
  markAsRead(resolved);

  const warning = await getAgentsWarning(resolved);
  return warning + content;
}
