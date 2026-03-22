import test from "node:test";
import assert from "node:assert";
import mockfs from "mock-fs";
import { getIgnore } from "../src/utils/ignore.js";

test("Test utils/ignore", async (t) => {
  t.afterEach(async () => {
    mockfs.restore();
  });

  await t.test(
    "getIgnore no .gitignore apply default ignore list",
    async () => {
      mockfs({}); // mock empty directory

      const ignore = await getIgnore();

      assert.equal(
        ignore.ignores(".git/"),
        true,
        ".git should always be ignored",
      );
      assert.equal(
        ignore.ignores(".agents/"),
        true,
        "all dot-directories should be ignored by default",
      );
      assert.equal(
        ignore.ignores(".agent"),
        true,
        "all dot-files should be ignored by default",
      );
      assert.equal(
        ignore.ignores("dist/"),
        true,
        "dist should be ignored by default",
      );
      assert.equal(
        ignore.ignores("build/"),
        true,
        "build should be ignored by default",
      );
      assert.equal(
        ignore.ignores("node_modules/"),
        true,
        "node_modules should be ignored by default",
      );
      assert.equal(
        ignore.ignores("package-lock.json"),
        true,
        "package-lock.json should be ignored by default",
      );
    },
  );

  await t.test("getIgnore .gitignore load file", async () => {
    mockfs({
      ".gitignore": "ignorefile\nignoredir/",
    });

    const ignore = await getIgnore();

    assert.equal(
      ignore.ignores(".git/"),
      true,
      ".git should always be ignored",
    );
    assert.equal(
      ignore.ignores("ignorefile"),
      true,
      "should be ignored because of .gitignore file.",
    );
    assert.equal(
      ignore.ignores("ignoredir/"),
      true,
      "should be ignored because of .gitignore file.",
    );
    assert.equal(
      ignore.ignores("ignoredir/foo"),
      true,
      "should be ignored because of .gitignore file.",
    );
    assert.equal(ignore.ignores("bar/foo"), false, "should not be ignored");
    assert.equal(
      ignore.ignores("node_modules/"),
      false,
      "node_modules should not be ignored",
    );
    assert.equal(
      ignore.ignores("package-lock.json"),
      false,
      "package-lock.json should note be ignored",
    );
  });
});
