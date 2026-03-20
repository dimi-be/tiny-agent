import { execFileAsync } from "../exec.js";
import fs from "fs/promises";
import path from "path";
import { formatDiagnostic } from "./formatter.js";

// TODO: check if workding directory contains a tsconfig.json if it does build the project if not, build the file
export async function checkWithTsc(filePath: string, workingDirectory: string) {
  try {
    // Only way (I found) to auto load tsconfig.json is by building the project.
    // This is not very efficient but produces the best results.
    // --isolatedModules: treats file as a standalone unit
    // --noEmit: checks only, doesn't write files
    const cwd = process.cwd();
    await execFileAsync("npx", [
      "tsc",
      "-p",
      cwd, // TODO: change to full path to tsconfig
      "--noEmit",
      "--isolatedModules",
      "--skipLibCheck",
      "--pretty",
      "false",
    ]);

    // TODO: Execute this is if the workingDirectory doesn't have a tsconfig.json in it
    // await execFileAsync("npx", [
    //   "tsc",
    //   filePath,
    //   "--noEmit",
    //   "--isolatedModules",
    //   "--skipLibCheck",
    //   "--jsx",
    //   "react-jsx",
    //   "--pretty",
    //   "false",
    // ]);
    return null; // Passed
  } catch (error: any) {
    // stdout contains the actual type-check failures
    if (error.stdout) {
      // Filter lines to only include those relevant to the current filePath
      // tsc output format is usually: filePath(line,col): error TSXXXX: message
      const lines = error.stdout.split("\n");
      const normalizedPath = path.normalize(filePath);
      const absPath = path.resolve(normalizedPath);
      const relPath = path.relative(process.cwd(), absPath);

      const filteredLines = lines.filter((line: string) => {
        const trimmedLine = line.trim();
        // Check if line starts with filePath (normalized to match tsc output)
        // tsc output can be absolute, relative to the project root, or relative to the CWD

        // Escape characters for regex
        const escapedPath = normalizedPath.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const escapedAbsPath = absPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedRelPath = relPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Match line start with any of the possible path variants
        const pathPattern = new RegExp(
          `^(\\./)?(${escapedPath}|${escapedAbsPath}|${escapedRelPath})(\\(|:)`,
        );

        return pathPattern.test(trimmedLine);
      });

      if (filteredLines.length > 0) {
        const firstError = filteredLines[0].trim();
        // Extract line, col, and message from something like:
        // "path/to/file.ts(1,5): error TSXXXX: message"
        const match = firstError.match(/\((\d+),(\d+)\):\s*(.+)$/);
        if (match) {
          const lineNum = parseInt(match[1], 10);
          const colNum = parseInt(match[2], 10);
          const message = match[3];
          return await formatDiagnostic(
            "TSC",
            filePath,
            lineNum,
            colNum,
            message,
          );
        }

        // Fallback if parsing fails
        return `**CRITICAL: The code you wrote has errors.**\n**Tool:** [TSC]\n**Message:**\n${filteredLines.join("\n")}`;
      }
    }
  }

  return null;
}
