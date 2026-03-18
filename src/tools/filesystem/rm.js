import fs from 'fs/promises';
import { securePath } from '../../utils/security.js';
import { confirmAction } from '../../utils/ui.js';
import { getIsYolo } from '../../utils/state.js';

export default async function rmTool(targetPath, recursive = false) {
  const resolved = securePath(targetPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow removing ${targetPath} (recursive: ${recursive})?`);
    if (!ok) throw new Error("User denied rm operation.");
  }
  await fs.rm(resolved, { recursive, force: true });
  return `Removed ${targetPath}`;
}
