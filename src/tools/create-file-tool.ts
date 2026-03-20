import fs from "fs/promises";
import { securePath, markAsRead } from "../utils/security.js";

export async function createFileTool(filePath: string) {
  const resolved = securePath(filePath);
  try {
    const time = new Date();
    await fs.utimes(resolved, time, time);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await fs.writeFile(resolved, "");
    } else {
      throw err;
    }
  }
  markAsRead(resolved);
  return `Touched ${filePath}`;
}
