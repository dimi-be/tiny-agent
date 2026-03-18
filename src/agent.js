const OpenAI = require("openai");
const tools = require("./tools/index");

async function runAgentLoop({ model, url, systemPrompt, prompt, yolo, plan }) {
  tools.setYolo(yolo);

  const openai = new OpenAI({
    apiKey: "not-needed",
    baseURL: url,
  });

  const activeTools = plan
    ? tools.schemas.filter((schema) =>
        ["read", "grep", "ls", "tree"].includes(
          schema.function.name,
        ),
      )
    : tools.schemas;

  let totalTokens = 0;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

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

        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: String(result),
        });
      } catch (error) {
        console.error(`Tool execution error: ${error.message}`);
        messages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: `Error: ${error.message}`,
        });
      }
    }
  }
}

module.exports = { runAgentLoop };
