import test from "node:test";
import assert from "node:assert";
import OpenAI from "openai";
import { isGemmaToolCall } from "../src/utils/prompt";

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
});
