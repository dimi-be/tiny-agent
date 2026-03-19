import fs from 'fs/promises';

export async function formatDiagnostic(tool: string, filePath: string, lineNum: number, colNum: number, message: string) {
  let fileContent = '';
  try {
    fileContent = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    return `**CRITICAL: The code you wrote has errors.**\n**Tool:** [${tool}]\n**Location:** Line ${lineNum}, Col ${colNum}\n**Message:** ${message}`;
  }

  const lines = fileContent.split('\n');
  const startIdx = Math.max(0, lineNum - 1 - 3);
  const endIdx = Math.min(lines.length - 1, lineNum - 1 + 3);

  const contextLines = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const currentLineNum = i + 1;
    if (currentLineNum === lineNum) {
      contextLines.push(`${currentLineNum} > ${lines[i]}`);
    } else {
      contextLines.push(`${currentLineNum} | ${lines[i]}`);
    }
  }

  return `**CRITICAL: The code you wrote has errors.**\n**Tool:** [${tool}]\n**Location:** Line ${lineNum}, Col ${colNum}\n**Message:** ${message}\n**Context:**\n\`\`\`\n${contextLines.join('\n')}\n\`\`\``;
}
