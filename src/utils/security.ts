import path from "path";

export function securePath(targetPath: string) {
  const resolved = path.resolve(process.cwd(), targetPath);
  if (!resolved.startsWith(process.cwd())) {
    throw new Error(
      "Security Error: Cannot access paths outside the current working directory.",
    );
  }
  return resolved;
}

const filesReadState = new Set<string>();

export function markAsRead(targetPath: string) {
  filesReadState.add(securePath(targetPath));
}

export function hasBeenRead(targetPath: string) {
  return filesReadState.has(securePath(targetPath));
}

export function resetFilesReadState() {
  filesReadState.clear();
}

export function checkNpmCommand(command: string) {
  // All npm commands are now allowed
  return true;
}
