import fs from "fs/promises";
import path from "path";
import { securePath, hasBeenRead, markAsRead } from "../../utils/security.js";
import { confirmAction } from "../../utils/ui.js";
import { getIsYolo, getIsPlainText } from "../../utils/state.js";
import { checkSyntax } from "../../utils/syntax/index.js";

export default async function writeTool(filePath: string, content: string) {
  const resolved = securePath(filePath);
  try {
    const stats = await fs.stat(resolved);
    if (stats.isFile() && stats.size > 0 && !hasBeenRead(resolved)) {
      throw new Error(
        `The file '${filePath}' already exists and is not empty. You must read it first using the 'read' tool before overwriting it.`,
      );
    }
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }

  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow writing to ${filePath}?`);
    if (!ok) throw new Error("User denied write operation.");
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");
  markAsRead(resolved);

  const syntaxResult = getIsPlainText() ? '' : await checkSyntax(resolved);
  const result = syntaxResult ? `Successfully wrote to ${filePath}\n${syntaxResult}` : `Successfully wrote to ${filePath}`;

  console.error(`> Result: ${result}`);

  return result;
}
