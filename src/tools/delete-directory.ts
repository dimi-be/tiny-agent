import fs from "fs/promises";
import { securePath } from "../utils/security.js";
import { confirmAction } from "../utils/ui.js";
import { getIsYolo } from "../utils/state.js";

export default async function deleteDirectoryTool(targetPath: string) {
  const resolved = securePath(targetPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(
      `Allow deleting directory ${targetPath} (recursive)?`,
    );
    if (!ok) throw new Error("User denied delete_directory operation.");
  }
  await fs.rm(resolved, { recursive: true, force: true });
  return `Deleted directory ${targetPath}`;
}
