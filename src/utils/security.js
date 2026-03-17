const path = require('path');

function securePath(targetPath) {
  const resolved = path.resolve(process.cwd(), targetPath);
  if (!resolved.startsWith(process.cwd())) {
    throw new Error('Security Error: Cannot access paths outside the current working directory.');
  }
  return resolved;
}

const sessionState = new Set();

function markAsRead(targetPath) {
  sessionState.add(securePath(targetPath));
}

function hasBeenRead(targetPath) {
  return sessionState.has(securePath(targetPath));
}

function checkNpmCommand(command) {
  // All npm commands are now allowed
  return true;
}

module.exports = { securePath, markAsRead, hasBeenRead, checkNpmCommand };
