import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { securePath } from "../utils/security.js";
import { getIgnore } from "../utils/ignore.js";

const MAX_RESULTS = 50;

export interface SearchFilesArgs {
  pattern: string;
  include?: string;
}

export async function searchFilesTool(args: SearchFilesArgs): Promise<string> {
  const { pattern, include = "**/*" } = args;
  const PROJECT_ROOT = process.cwd();
  const ignore = await getIgnore();

  try {
    // Find all matching files while ignoring noise
    const files = await glob(include, {
      cwd: PROJECT_ROOT,
      nodir: true,
    });

    const results: string[] = [];
    const regex = new RegExp(pattern, "i");

    for (const file of files) {
      if (results.length >= MAX_RESULTS) {
        results.push(
          "... [Truncated] Too many matches found. Please narrow your search pattern.",
        );
        break;
      }

      const relativePath = path.join(file);
      const fullPath = path.resolve(PROJECT_ROOT, file);
      securePath(fullPath);

      if (ignore.ignores(relativePath)) continue;

      try {
        const content = await fs.readFile(fullPath, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          if (results.length < MAX_RESULTS && regex.test(line)) {
            results.push(`${file}:${index + 1}: ${line.trim()}`);
          }
        });
      } catch (error: any) {
        if (
          error.message !=
          "Security Error: Cannot access paths outside the current working directory."
        ) {
          throw error;
        }
      }
    }

    if (results.length === 0) {
      return "No matches found.";
    }

    return results.join("\n");
  } catch (error: any) {
    return `Search Error: ${error.message}`;
  }
}
