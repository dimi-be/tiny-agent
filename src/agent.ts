import OpenAI from "openai";
import fs from "fs/promises";
import * as tools from "./tools/index.js";
import { setYolo, setPlainText } from "./utils/state.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

export interface AgentOptions {
  model: string;
  url: string;
  systemPrompt: string;
  prompt?: string;
  yolo: boolean;
  plan: boolean;
  plainText: boolean;
  logPath?: string;
  history?: ChatCompletionMessageParam[];
}

export async function runAgentLoop({
  model,
  url,
  systemPrompt,
  prompt,
  yolo,
  plan,
  plainText,
  logPath,
  history,
}: AgentOptions): Promise<void> {
  setYolo(yolo);
  setPlainText(plainText);

  const writeToLog = async (data: any) => {
    if (logPath) {
      await fs.appendFile(
        logPath,
        JSON.stringify(data, null, 2) + "\n\n",
        "utf8",
      );
    }
  };

  if (logPath) {
    await fs.writeFile(logPath, "", "utf8"); // Initialize/Clear log file
  }

  const openai = new OpenAI({
    apiKey: "not-needed",
    baseURL: url,
  });

  const activeTools = plan
    ? tools.schemas.filter((schema) =>
        [
          "read_file",
          "search_file",
          "search_files",
          "list_directory",
          "list_all_files",
        ].includes(schema.function.name),
      )
    : tools.schemas;

  let totalTokens = 0;

  const messages: ChatCompletionMessageParam[] = history ? [...history] : [];

  if (messages.length === 0 || messages[0].role !== "system") {
    messages.unshift({ role: "system", content: systemPrompt });
  } else {
    messages[0] = { role: "system", content: systemPrompt };
  }

  if (prompt) {
    messages.push({ role: "user", content: prompt });
  }

  for (const msg of messages) {
    await writeToLog(msg);
  }

  while (true) {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      tools: activeTools.length > 0 ? activeTools : undefined,
      tool_choice: activeTools.length > 0 ? "auto" : "none",
    });

    if (response.usage && response.usage.total_tokens) {
      totalTokens += response.usage.total_tokens;
    }
    const message = response.choices[0].message;
    messages.push(message);
    await writeToLog(message);

    if (message.content) {
      console.log(message.content.trim());
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.error(
        `[Token Usage] Final Context: ${response.usage ? response.usage.total_tokens : 0} tokens | Session Cumulative: ${totalTokens} tokens`,
      );
      break;
    }

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") continue;
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      const displayArgs = { ...functionArgs };
      if (displayArgs.content) displayArgs.content = "[Content truncated]";
      const argsStr =
        Object.keys(displayArgs).length > 0
          ? ` with args: ${JSON.stringify(displayArgs)}`
          : "";
      console.error(
        `> Executing tool: ${functionName}${argsStr} Context: ${response.usage ? response.usage.total_tokens : 0} tokens`,
      );

      try {
        const handler = tools.handlers[functionName];
        if (!handler) throw new Error(`Tool ${functionName} not found.`);

        const result = await handler(functionArgs);

        const toolMessage: ChatCompletionMessageParam = {
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: String(result),
        };
        messages.push(toolMessage);
        await writeToLog(toolMessage);
      } catch (error: any) {
        console.error(`Tool execution error: ${error.message}`);
        const toolErrorMessage: ChatCompletionMessageParam = {
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: `Error: ${error.message}`,
        };
        messages.push(toolErrorMessage);
        await writeToLog(toolErrorMessage);
      }
    }
  }
}
