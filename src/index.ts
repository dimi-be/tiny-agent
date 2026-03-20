#!/usr/bin/env node

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs/promises";
import path from "path";
import { runAgentLoop } from "./agent.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

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
    .option("log", {
      alias: "l",
      type: "string",
      description: "Path to a log file to store the conversation",
    })
    .option("history", {
      alias: "i",
      type: "string",
      description: "Path to a JSON file containing the dialog history",
    })
    .check((argv) => {
      if (!argv._[0] && !argv.history) {
        throw new Error("You must provide either a PROMPT argument or a --history file.");
      }
      return true;
    })
    .parseSync();

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
  } else if (promptArg) {
    promptText = String(promptArg);
  }

  let history: ChatCompletionMessageParam[] | undefined;
  if (argv.history) {
    try {
      const historyContent = await fs.readFile(argv.history, "utf-8");
      history = JSON.parse(historyContent);
      if (!Array.isArray(history)) {
        throw new Error("History must be a JSON array of messages.");
      }
    } catch (err: any) {
      console.error(`Error reading or parsing history file at ${argv.history}: ${err.message}`);
      process.exit(1);
    }
  }

  let systemPrompt = argv.plan
    ? "You are a reader. You can only read files and output text to help the user with his request. Work only within the current directory."
    : "You are a code implementer. You must read existing files before writing to them. Work only within the current directory.";

  if (argv.system) {
    try {
      systemPrompt = await fs.readFile(argv.system, "utf-8");
    } catch (err: any) {
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
      prompt: promptText || undefined,
      yolo: argv.yolo,
      plan: argv.plan,
      plainText: argv.plainText,
      logPath: argv.log,
      history,
    });
  } catch (error: any) {
    console.error(`\nAgent Error: ${error.message}`);
    process.exit(1);
  }
}

main();
