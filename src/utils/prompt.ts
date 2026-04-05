import OpenAI from "openai";

export function isGemmaToolCall(msg: OpenAI.ChatCompletionMessage): boolean {
  const toolCalls = msg.tool_calls || [];
  return !toolCalls.length && !!msg.content && msg.content.includes("call:");
}

export function convertGemmaToolCalls(
  msg: OpenAI.ChatCompletionMessage,
): OpenAI.ChatCompletionMessage {
  const regex = /call:(\w+)\{(.*?)\}/g;
  let match;
  const toolCalls: OpenAI.ChatCompletionMessageFunctionToolCall[] = [];
  const rawContent = msg.content || "";

  // Split the tool calls
  while ((match = regex.exec(rawContent)) !== null) {
    const name = match[1];

    // clean up the quote tokens <|\"|>, <|"|> and <|'|>
    const argsString = match[2]
      .replace(/<\|"\|>/g, '"')
      .replace(/<\|'\|>/g, '"')
      // wrap unquoted keys in double quotes
      .replace(/(^|[,{\s])([a-zA-Z0-9_]+)\s*:/g, (m, prefix, key) => {
        return `${prefix}"${key}":`;
      });

    const finalJsonString = argsString.trim().startsWith("{")
      ? argsString
      : `{${argsString}}`;

    try {
      const args = JSON.parse(finalJsonString);
      toolCalls.push({
        id: `call_${Math.random().toString(36).substring(2, 11)}`,
        type: "function",
        function: { name, arguments: JSON.stringify(args) },
      });
    } catch (e) {
      console.error("Gemma Parsing Error:", e);
    }
  }

  const markers = [
    "<|tool_call",
    "<|tool_response",
    "[TOOL_RESULT]",
    "[END_TOOL_REQUEST]",
  ];
  let cutIndex = rawContent.length;

  for (const marker of markers) {
    const index = rawContent.indexOf(marker);
    if (index !== -1 && index < cutIndex) {
      cutIndex = index;
    }
  }

  // The actual verbal content is only what's BEFORE these tags
  const verbalContent = rawContent.substring(0, cutIndex).trim();

  return {
    ...msg,
    content: verbalContent,
    tool_calls: toolCalls,
  };
}
