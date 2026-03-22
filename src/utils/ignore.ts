import fs from "fs/promises";
import path from "path";
import ignore from "ignore";

export async function getIgnore() {
  const ig = ignore();
  try {
    const gitignoreContent = await fs.readFile(
      path.join(process.cwd(), ".gitignore"),
      "utf-8",
    );
    ig.add(gitignoreContent);
  } catch (e) {
    ig.add(DEFAULT_IGNORE_LIST);
  }

  ig.add(".git/");

  return ig;
}

export const DEFAULT_IGNORE_LIST: string[] = [
  ".*",
  "node_modules/",
  "dist/",
  "build/",
  "package-lock.json",
];
