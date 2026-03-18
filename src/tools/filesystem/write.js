import fs from "fs/promises";
import path from "path";
import { securePath, hasBeenRead } from "../../utils/security.js";
import { confirmAction } from "../../utils/ui.js";
import { getIsYolo, getIsPlainText } from "../../utils/state.js";
import { checkSyntax } from "../../utils/syntax/index.js";

export default async function writeTool(filePath, content) {
  const resolved = securePath(filePath);
  try {
    const stats = await fs.stat(resolved);
    if (stats.isFile() && !hasBeenRead(resolved)) {
      throw new Error(
        `The file '${filePath}' already exists. You must read it first using the 'read' tool before overwriting it.`,
      );
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  if (!getIsYolo()) {
    const ok = await confirmAction(`Allow writing to ${filePath}?`);
    if (!ok) throw new Error("User denied write operation.");
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");

  const syntaxResult = getIsPlainText() ? '' : await checkSyntax(resolved);
  const result = syntaxResult ? `Successfully wrote to ${filePath}\n${syntaxResult}` : `Successfully wrote to ${filePath}`;

  console.error(`> Result: ${result}`);

  return result;
}
