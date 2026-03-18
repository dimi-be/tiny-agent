# Syntax Analyzer

## 1. The Problem: The "Broken Code" Loop

When an AI agent writes code, it often makes "hallucinated" syntax errors or type mismatches. Without a feedback loop:

- The agent assumes the code is correct.
- The user has to manually debug and report errors back to the AI.
- The AI lacks the **diagnostic context** (line numbers, specific error strings) to fix the issue efficiently.

## 2. The Solution: A "Fail-Fast" Diagnostic Pipeline

Instead of a single check, we use a tiered approach that validates code in layers. This ensures the agent gets the most relevant feedback first.

### Aider’s Strategy:

Aider uses **Tree-sitter** for universal syntax checking and provides the AI with "Lint Reports." These reports don't just say "Error"; they show the specific line of code with an error marker (like `█`) and the surrounding function context so the AI can "see" the mistake.

## 3. Why This Works

- **Contextual Precision:** By sending the exact error and the code around it, the AI doesn't have to guess where it went wrong.
- **Isolation:** Using flags like `--isolatedModules` (for TSC) or `--no-eslintrc` (for ESLint) prevents the tool from failing due to external project configuration issues, focusing strictly on the agent's new code.
- **Efficiency:** Tree-sitter catches 90% of "dumb" mistakes (missing brackets) in milliseconds before running heavier compilers.

## 4. Recommended Technology Stack

| Technology                    | Role             | Why?                                                                           |
| :---------------------------- | :--------------- | :----------------------------------------------------------------------------- |
| **Tree-sitter**               | Universal Parser | Detects syntax errors in 50+ languages without needing compilers installed.    |
| **ESLint**                    | Linter (JS/TS)   | Catches code smells, unused variables, and stylistic inconsistencies.          |
| **TSC (TypeScript)**          | Type Checker     | Validates data flow, interfaces, and deep logic that linters miss.             |
| **Execa**                     | Process Runner   | A Node.js library to run CLI tools and capture their output for the AI.        |
| **@vscode/languagedetection** | Language ID      | Automatically detects if a file is Python, TS, or Ruby to pick the right tool. |

## 5. The Procedure (The "AnalyzeCode" Loop)

1.  **Identify:** Detect the language and file extension.
2.  **Syntax Check (Tree-sitter):** If the AST has `ERROR` nodes, return immediately with the line number.
3.  **Lint Check (ESLint):** Run with "tunnel-vision" rules (ignore missing imports) to check local logic.
4.  **Type Check (TSC):** (For TS only) Run in `isolatedModules` mode to verify type safety.
5.  **Feedback:** If any stage fails, format the raw output into an **"AI-Friendly Diagnostic"** and prompt the agent to "Fix the errors in the following snippet."

### Procedure: `AnalyzeCode(filePath, codeContent)`

```javascript
// 1. INITIALIZE CONSTANTS
SET supportedExtensions = [".js", ".jsx", ".ts", ".tsx"]
SET fileExtension = GET_EXTENSION(filePath)

IF fileExtension NOT IN supportedExtensions:
    RETURN "Unsupported file type for diagnostic"

// 2. STAGE 1: TREE-SITTER (Universal Syntax Check)
// Goal: Catch "un-parseable" code immediately (missing brackets, typos)
TRY:
    SET parser = LOAD_TREESITTER_PARSER(fileExtension)
    SET tree = parser.PARSE(codeContent)

    IF tree.rootNode.HAS_ERRORS():
        SET syntaxErrors = FIND_ERROR_NODES(tree.rootNode)
        RETURN FORMAT_FOR_AI("Syntax Error", syntaxErrors)
CATCH error:
    LOG "Tree-sitter failed, falling back to Linter"

// 3. STAGE 2: ESLINT (Style & Local Logic)
// Goal: Catch unused variables or "soft" logic errors without needing full project context
TRY:
    // Use --no-eslintrc to prevent "Project not configured" crashes
    // Use --rule 'no-undef: 0' to ignore missing imports from other files
    SET eslintResult = EXECUTE_SHELL(
        "npx eslint", filePath,
        "--no-eslintrc",
        "--format json",
        "--rule 'no-undef: 0'",
        "--rule 'import/no-unresolved: 0'"
    )

    IF eslintResult.HAS_MESSAGES():
        RETURN FORMAT_FOR_AI("Linting Issue", eslintResult.MESSAGES)
CATCH error:
    // If ESLint fails to run (e.g. missing binary), proceed to TSC
    LOG "ESLint skipped"

// 4. STAGE 3: TSC (Type & Deep Logic - TypeScript Only)
// Goal: Catch type mismatches and deep flow issues
IF fileExtension IS ".ts" OR ".tsx":
    TRY:
        // --isolatedModules: treats file as a standalone unit
        // --noEmit: checks only, doesn't write files
        SET tscResult = EXECUTE_SHELL(
            "npx tsc", filePath,
            "--noEmit",
            "--isolatedModules",
            "--skipLibCheck",
            "--jsx react-jsx", // Support TSX
            "--pretty false"   // Plain text for AI parsing
        )
    CATCH error:
        // error.stdout contains the actual type-check failures
        RETURN FORMAT_FOR_AI("Type Error", error.stdout)

// 5. FINAL SUCCESS
RETURN "SUCCESS: Code is valid and safe to commit."
```

### Key Logic Explanations

#### The "Format for AI" Function

When you send errors back to the agent, the **format** is more important than the error itself. Instead of raw CLI text, your helper function should return a template like this:

> **CRITICAL: The code you wrote has errors.**
> **Tool:** [ESLint]
> **Location:** Line [LineNum], Col [ColNum]
> **Message:** [The error message]
> **Context:** `[The specific line of code]`

#### Why `isolatedModules`?

Without this flag, `tsc` will try to find every single file imported in the project. If your agent is working on a single file in a large repo, `tsc` might take 30 seconds to run. With `--isolatedModules`, it assumes the imports are "fine" and only checks if the logic **inside the current file** makes sense.

### Implementation Tip for Node.js

If you use `execa`, remember that a "failed" linter check (exit code 1) throws an error in JavaScript. You need to wrap your calls in `try/catch` blocks and look at `error.stdout` to get the actual linting messages.

To ensure your `AnalyzeCode` function is bulletproof, you need test cases that challenge each layer of your "Fail Fast" hierarchy—from simple typos to complex TypeScript type mismatches.

## 6. Test Cases

Here are the core test cases categorized by which tool should "catch" the error first.

### 6.1. The "Syntax Catastrophe" (Tree-sitter)

These tests ensure your tool detects broken code structure before wasting time on complex linting rules.

| Case                 | Input Code Snippet                  | Expected Result                                                    |
| :------------------- | :---------------------------------- | :----------------------------------------------------------------- |
| **Missing Bracket**  | `function add(a, b) { return a + b` | **Tree-sitter** identifies an `ERROR` node at the end of the file. |
| **Stray Characters** | `const x = 10; @#$!`                | **Tree-sitter** flags the illegal symbols immediately.             |
| **Unclosed String**  | `const greeting = "Hello world;`    | **Tree-sitter** detects an unterminated string literal.            |

### 6.2. The "Logical Mess" (ESLint)

These check if your agent is writing valid syntax but "bad" or "dirty" code.

| Case                       | Input Code Snippet                         | Expected Result                                                           |
| :------------------------- | :----------------------------------------- | :------------------------------------------------------------------------ |
| **Unused Variable**        | `const x = 5; function y() { return 10; }` | **ESLint** flags `x` as defined but never used.                           |
| **Constant Re-assignment** | `const a = 1; a = 2;`                      | **ESLint** (or TSC) catches `TypeError: Assignment to constant variable`. |
| **Duplicate Keys**         | `const obj = { a: 1, a: 2 };`              | **ESLint** flags `no-dupe-keys`.                                          |

### 6.3. The "Type Trap" (TSC)

These ensure that the agent respects the TypeScript contract, even if the code looks "clean."

| Case                  | Input Code Snippet                                | Expected Result                                                          |
| :-------------------- | :------------------------------------------------ | :----------------------------------------------------------------------- |
| **Wrong Return Type** | `function getNum(): number { return "1"; }`       | **TSC** flags: `Type 'string' is not assignable to type 'number'`.       |
| **Missing Property**  | `interface User {id: number} const u: User = {};` | **TSC** flags: `Property 'id' is missing in type '{}'`.                  |
| **Invalid TSX Prop**  | `<MyComponent nonExistentProp={true} />`          | **TSC** flags that the prop is not defined in the component's interface. |

### 6.4. The "Isolation" Test (Edge Cases)

This verifies that your "Isolated Mode" is actually working and not failing on external dependencies.

- **Case: External Import.** \* **Input:** `import { someFunc } from './missing-file'; someFunc();`
  - **Expected:** If using `--isolatedModules` and `--rule 'import/no-unresolved: 0'`, the tool should **PASS** (or only warn), because it shouldn't care about files outside the current scope.
- **Case: Global Variables.**
  - **Input:** `window.localStorage.setItem('key', 'value');`
  - **Expected:** Should **PASS**. If your linter is too strict, it might flag `window` as undefined. Your test ensures your "Universal" config handles browser/node globals.
