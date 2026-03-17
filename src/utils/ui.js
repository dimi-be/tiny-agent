const readline = require('readline/promises');

async function confirmAction(promptText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(`${promptText} (y/N): `);
  rl.close();
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

module.exports = { confirmAction };
