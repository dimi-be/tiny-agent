import readline from 'node:readline/promises';

export async function confirmAction(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(`${promptText} (y/N): `);
  rl.close();
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}
