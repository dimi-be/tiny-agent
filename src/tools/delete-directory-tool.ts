import fs from "fs/promises";
import { securePath } from "../utils/security.js";
import { confirmAction } from "../utils/ui.js";
import { getIsYolo } from "../utils/state.js";

export interface DeleteDirectoryArgs {
  dirPath: string;
}

export async function deleteDirectoryTool(args: DeleteDirectoryArgs) {
  const { dirPath } = args;
  const resolved = securePath(dirPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(
      `Allow deleting directory ${dirPath} (recursive)?`,
    );
    if (!ok) throw new Error("User denied delete_directory operation.");
  }
  await fs.rm(resolved, { recursive: true, force: true });
  return `Deleted directory ${dirPath}`;
}
