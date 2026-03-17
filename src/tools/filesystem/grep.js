const fs = require('fs/promises');
const { securePath, markAsRead } = require('../../utils/security');

async function grepTool(pattern, filePath) {
  const resolved = securePath(filePath);
  const content = await fs.readFile(resolved, 'utf-8');
  markAsRead(resolved);
  const lines = content.split('\n');
  const regex = new RegExp(pattern);
  const matches = [];
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      matches.push(`${index + 1}: ${line}`);
    }
  });
  return matches.join('\n');
}

module.exports = grepTool;
