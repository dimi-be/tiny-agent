import OpenAI from "openai";

export function isGemmaToolCall(msg: OpenAI.ChatCompletionMessage): boolean {
  const toolCalls = msg.tool_calls || [];

  return !toolCalls.length && !!msg.content && msg.content.includes("call:");
}

export function convertGemmaToolCalls(
  msg: OpenAI.ChatCompletionMessage,
): OpenAI.ChatCompletionMessageFunctionToolCall[] {
  const regex = /call:(\w+)\{(.*?)\}/g;
  let match;
  const toolCalls: OpenAI.ChatCompletionMessageFunctionToolCall[] = [];

  while ((match = regex.exec("" + msg.content)) !== null) {
    const name = match[1];
    // Simple fix for Gemma's quirky quote tokens <|'|>
    const argsString = match[2].replace(/<\|'\|>/g, '"');
    try {
      // Gemma uses a python-like dict syntax; we may need to wrap in braces to parse as JSON
      const args = JSON.parse(`{${argsString}}`);
      toolCalls.push({
        id: `call_${Math.random().toString(36).substring(2, 11)}`,
        type: "function",
        function: { name, arguments: JSON.stringify(args) },
      });
    } catch (e) {
      console.error("Gemma Parsing Error:", e);
    }
  }

  return toolCalls;
}
