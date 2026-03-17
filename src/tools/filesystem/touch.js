const fs = require('fs/promises');
const { securePath } = require('../../utils/security');

async function touchTool(filePath) {
  const resolved = securePath(filePath);
  try {
    const time = new Date();
    await fs.utimes(resolved, time, time);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(resolved, '');
    } else {
      throw err;
    }
  }
  return `Touched ${filePath}`;
}

module.exports = touchTool;
