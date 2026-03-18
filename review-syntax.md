src/utils/syntax/index.js

- fs.access(filePath): not needed. We already now we have permission to access the file because we wrote to it. If anything this test should be moved to read and write. Maybe we can keep it if it is good practice?

src/utils/syntax/eslint.js

- we were going to be using the secured npmTool, but instead you made an export of a promisify of the execFile function.
- **Make a shared execFileAsync function that is secured and can be used by both npmTool and syntax**

src/utils/syntax/formatter.js

- catch around fileContent read feels execsive we just wrote to the file
  Same remark here: Maybe we can keep it if it is good practice?

src/utils/syntax/python.js

- the execute should also be secured here
- no checking of file access here => inconsistent
- **Use new shared of share secured execFileAsync**

src/utils/syntax/tree-sitter.js

- no checking of file access here => inconsistent

src/utils/syntax/tsc.js

- **Use new shared of share secured execFileAsync**

src/agent.js

- if (tools.setPlainText) tools.setPlainText(plainText); if is not needed

src/utils/exec.js

- **Make a shared execFileAsync function that is secured and can be used by both npmTool and syntax**

## unrelated to change:

src/tools/filesystem/state.js

- should be in utils
