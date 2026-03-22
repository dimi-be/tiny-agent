import fs from "fs/promises";
import { securePath } from "../utils/security.js";
import { confirmAction } from "../utils/ui.js";
import { getIsYolo } from "../utils/state.js";

export interface DeleteFileArgs {
  filePath: string;
}

export async function deleteFileTool(args: DeleteFileArgs) {
  const { filePath } = args;
  const resolved = securePath(filePath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow deleting file ${filePath}?`);
    if (!ok) throw new Error("User denied delete_file operation.");
  }
  await fs.rm(resolved, { force: true });
  return `Deleted file ${filePath}`;
}
