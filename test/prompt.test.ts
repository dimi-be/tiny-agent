import test from "node:test";
import assert from "node:assert";
import OpenAI from "openai";
import { isGemmaToolCall, convertGemmaToolCalls } from "../src/utils/prompt";

test("Promp utils testing", async (t) => {
  await t.test("should return true if message is a gemma tool call", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:list_all_files{dirPath:<|"|>.<|"|>}<tool_call|><|tool_response><|tool_response><|tool_response>[TOOL_RESULT][END_TOOL_RESULT]',
      tool_calls: [],
      refusal: null,
    };

    const result = isGemmaToolCall(message);

    assert.equal(
      result,
      true,
      "should return true if a gemma tool call is detected",
    );
  });

  await t.test(
    "should return false if message is not a gemma tool call",
    () => {
      const message: OpenAI.ChatCompletionMessage = {
        role: "assistant",
        content: "Hi!",
        tool_calls: [],
        refusal: null,
      };

      const result = isGemmaToolCall(message);

      assert.equal(
        result,
        false,
        "should return false when message does not contain a gemma tool call",
      );
    },
  );

  await t.test("should convert a gemma tool call", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:list_all_files{dirPath:<|"|>.<|"|>}<tool_call|><|tool_response><|tool_response><|tool_response>[TOOL_RESULT][END_TOOL_RESULT]',
      tool_calls: [],
      refusal: null,
    };

    const result = convertGemmaToolCalls(message);

    assert.equal(
      result.tool_calls?.length,
      1,
      "One tool call should be converted",
    );
    assert.equal(
      (result.tool_calls![0] as any).function.name,
      "list_all_files",
      "function name should be converted",
    );
    assert.equal(
      (result.tool_calls![0] as any).function.arguments,
      '{"dirPath":"."}',
      "arguments should be converted",
    );
    assert.equal(result.content, "", "no content is present");
  });

  await t.test("should strip expected result from the content", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:list_all_files{dirPath:<|\"|>.<|\"|>}<tool_call|><|tool_response>[END_TOOL_REQUEST]\n[TOOL_RESULT]\n.\n├── package.json\n├── README.md\n└── src[END_TOOL_RESULT]',
      tool_calls: [],
      refusal: null,
    };

    const result = convertGemmaToolCalls(message);

    assert.equal(
      result.tool_calls?.length,
      1,
      "One tool call should be converted",
    );
    assert.equal(result.content, "");
  });

  await t.test("should return content after tool call 01", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:list_all_files{dirPath:<|"|>.<|"|>}<tool_call|><|tool_response><|tool_response>thought\nThe current project appears to be a "tiny-agent"',
      tool_calls: [],
      refusal: null,
    };

    const result = convertGemmaToolCalls(message);

    assert.equal(
      result.tool_calls?.length,
      1,
      "One tool call should be converted",
    );
    assert.equal(
      result.content,
      'thought\nThe current project appears to be a "tiny-agent"',
    );
  });

  await t.test("should return content after tool call 02", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:list_all_files{dirPath:<|"|>.<|"|>}<tool_call|><|tool_response><|tool_response>ments:\n',
      tool_calls: [],
      refusal: null,
    };

    const result = convertGemmaToolCalls(message);

    assert.equal(
      result.tool_calls?.length,
      1,
      "One tool call should be converted",
    );
    assert.equal(result.content, "ments:");
  });

  await t.test("should return content after tool call 03", () => {
    const message: OpenAI.ChatCompletionMessage = {
      role: "assistant",
      content:
        '<|tool_call>call:read_file{filePath:<|"|>src/security.ts<|"|>}<tool_call|><|tool_response>![END_TOOL_RESULT]\n<result>\nexport class SecurityError extends </result>',
      tool_calls: [],
      refusal: null,
    };

    const result = convertGemmaToolCalls(message);

    assert.equal(
      result.tool_calls?.length,
      1,
      "One tool call should be converted",
    );
    assert.equal(result.content, "");
  });
});
