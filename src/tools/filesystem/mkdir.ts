import fs from 'fs/promises';
import { securePath } from '../../utils/security.js';
import { confirmAction } from '../../utils/ui.js';
import { getIsYolo } from '../../utils/state.js';

export default async function mkdirTool(dirPath: string) {
  const resolved = securePath(dirPath);
  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow creating directory ${dirPath}?`);
    if (!ok) throw new Error("User denied mkdir operation.");
  }
  await fs.mkdir(resolved, { recursive: true });
  return `Created directory ${dirPath}`;
}
