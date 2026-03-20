import fs from "fs/promises";
import { securePath } from "../utils/security.js";
import { confirmAction } from "../utils/ui.js";
import { getIsYolo } from "../utils/state.js";

export async function deleteFileTool(targetPath: string) {
  const resolved = securePath(targetPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow deleting file ${targetPath}?`);
    if (!ok) throw new Error("User denied delete_file operation.");
  }
  await fs.rm(resolved, { force: true });
  return `Deleted file ${targetPath}`;
}
