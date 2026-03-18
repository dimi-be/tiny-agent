#!/usr/bin/env node

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs/promises";
import path from "path";
import { runAgentLoop } from "./agent.js";

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option("model", {
      alias: "m",
      type: "string",
      description: "The name of the model loaded in LM Studio",
      demandOption: true,
    })
    .option("url", {
      alias: "u",
      type: "string",
      description: "The local API endpoint",
      default: "http://localhost:1234/v1",
    })
    .option("system", {
      alias: "s",
      type: "string",
      description: "Path to a text file containing a custom system prompt",
    })
    .option("yolo", {
      alias: "y",
      type: "boolean",
      description: "Enable automatic edits (bypasses manual confirmations)",
      default: false,
    })
    .option("plan", {
      alias: "p",
      type: "boolean",
      description: "Plan mode: restricts the agent to read-only tools",
      default: false
    })
    .option("plain-text", {
      alias: "t",
      type: "boolean",
      description: "Disable automatic syntax checking after writes",
      default: false
    })
    .demandCommand(1, "You must provide a PROMPT as the last argument")
    .parse();

  const promptArg = argv._[0];
  let promptText = "";

  if (promptArg === "-") {
    const { stdin } = process;
    let data = "";
    stdin.setEncoding("utf8");
    for await (const chunk of stdin) {
      data += chunk;
    }
    promptText = data.trim();
  } else {
    promptText = String(promptArg);
  }

  if (!promptText) {
    console.error("Error: PROMPT cannot be empty.");
    process.exit(1);
  }

  let systemPrompt = argv.plan
    ? "You are a reader. You can only read files and output text to help the user with his request. Work only within the current directory."
    : "You are a code implementer. You must read existing files before writing to them. Work only within the current directory.";

  if (argv.system) {
    try {
      systemPrompt = await fs.readFile(argv.system, "utf-8");
    } catch (err) {
      console.error(
        `Error reading system prompt file at ${argv.system}: ${err.message}`,
      );
      process.exit(1);
    }
  }

  try {
    const rootAgentsFile = path.join(process.cwd(), "AGENTS.md");
    const rootAgentsMdContent = await fs.readFile(rootAgentsFile, "utf-8");
    systemPrompt += `\n\n# PROJECT INSTRUCTIONS (FROM ROOT AGENTS.md):\n${rootAgentsMdContent}\n\n[SYSTEM NOTE: The content of the root 'AGENTS.md' has already been included in your system prompt above. You do not need to read it using a tool.]`;
  } catch (err) {
    // Silently ignore if AGENTS.md does not exist
  }

  try {
    await runAgentLoop({
      model: argv.model,
      url: argv.url,
      systemPrompt,
      prompt: promptText,
      yolo: argv.yolo,
      plan: argv.plan,
      plainText: argv.plainText
    });
  } catch (error) {
    console.error(`\nAgent Error: ${error.message}`);
    process.exit(1);
  }
}

main();
