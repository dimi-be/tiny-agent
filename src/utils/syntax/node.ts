import { execFileAsync } from "../exec.js";
import { formatDiagnostic } from "./formatter.js";
import fs from "fs/promises";
import path from "path";

export async function checkWithNode(filePath: string) {
  try {
    await fs.access(filePath);
  } catch (err: any) {
    return `Syntax Error (Node Syntax): ${err.message}`;
  }

  try {
    await execFileAsync("node", ["-c", filePath]);
  } catch (error: any) {
    // node -c produces output like: "path/to/file.js:1\nconst a = 1; const a = 2;\n..."
    const stderr = error.stderr || "";
    const match = stderr.match(/:(\d+)\n/);
    const line = match ? parseInt(match[1], 10) : 1;
    return await formatDiagnostic(
      "Node Syntax",
      filePath,
      line,
      0,
      stderr.split("\n").slice(0, 3).join(" "),
    );
  }

  return null;
}
