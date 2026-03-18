import fs from 'fs/promises';
import { securePath } from '../../utils/security.js';

export default async function touchTool(filePath) {
  const resolved = securePath(filePath);
  try {
    const time = new Date();
    await fs.utimes(resolved, time, time);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(resolved, '');
    } else {
      throw err;
    }
  }
  return `Touched ${filePath}`;
}
