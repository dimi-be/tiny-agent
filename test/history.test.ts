import test from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import mockfs from "mock-fs";
import { runAgentLoop } from "../src/agent.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.js";

test("History Processing and Validation", async (t) => {
  t.afterEach(async () => {
    mockfs.restore();
  });

  async function getLoggedMessages(
    logPath: string,
  ): Promise<ChatCompletionMessageParam[]> {
    const content = await fs.readFile(logPath, "utf8");
    // Log file has JSON objects separated by \n\n
    const chunks = content.split("\n\n").filter((c) => c.trim().length > 0);
    return chunks.map((c) => JSON.parse(c));
  }

  await t.test(
    "prepends system prompt if missing and appends prompt if provided",
    async () => {
      mockfs({
        "test-history.log": "",
      });
      const tmpLog = "test-history.log";

      const history: ChatCompletionMessageParam[] = [
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
        { role: "user", content: "what now?" },
      ];

      try {
        await runAgentLoop({
          model: "test",
          url: "http://127.0.0.1:1", // Will cause connection refused
          systemPrompt: "SYSTEM_PROMPT",
          prompt: "new prompt",
          yolo: true,
          plan: false,
          plainText: true,
          logPath: tmpLog,
          history,
        });
      } catch (e: any) {
        // Ignore network error
      }

      const messages = await getLoggedMessages(tmpLog);

      assert.strictEqual(messages[0].role, "system");
      assert.strictEqual(messages[0].content, "SYSTEM_PROMPT");
      assert.strictEqual(messages[1].role, "user");
      assert.strictEqual(messages[1].content, "hello");

      // The appended prompt should be the last message
      assert.strictEqual(messages[messages.length - 1].role, "user");
      assert.strictEqual(messages[messages.length - 1].content, "new prompt");
    },
  );

  await t.test("overwrites existing system prompt", async () => {
    mockfs({
      "test-history-2.log": "",
    });
    const tmpLog = "test-history-2.log";

    const history: ChatCompletionMessageParam[] = [
      { role: "system", content: "OLD_SYSTEM_PROMPT" },
      { role: "user", content: "hello" },
    ];

    try {
      await runAgentLoop({
        model: "test",
        url: "http://127.0.0.1:1",
        systemPrompt: "NEW_SYSTEM_PROMPT",
        yolo: true,
        plan: false,
        plainText: true,
        logPath: tmpLog,
        history,
      });
    } catch (e: any) {
      // Ignore network error
    }

    const messages = await getLoggedMessages(tmpLog);

    assert.strictEqual(messages[0].role, "system");
    assert.strictEqual(
      messages[0].content,
      "NEW_SYSTEM_PROMPT",
      "System prompt should be overwritten",
    );
    assert.strictEqual(messages[1].role, "user");
    assert.strictEqual(messages[1].content, "hello");
  });
});
