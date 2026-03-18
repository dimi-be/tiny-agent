import path from "path";

export function securePath(targetPath) {
  const resolved = path.resolve(process.cwd(), targetPath);
  if (!resolved.startsWith(process.cwd())) {
    throw new Error(
      "Security Error: Cannot access paths outside the current working directory.",
    );
  }
  return resolved;
}

const sessionState = new Set();

export function markAsRead(targetPath) {
  sessionState.add(securePath(targetPath));
}

export function hasBeenRead(targetPath) {
  return sessionState.has(securePath(targetPath));
}
